// ============================================================
// Brain Dump API — Create new brain dump + parse into tasks
// ============================================================
// Supports two modes:
//   1. Manual — split rawText by lines (default)
//   2. AI     — normalize with LLM + classify Eisenhower
// ============================================================

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/actions";
import { createBrainDumpSchema } from "@/lib/validations";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiValidationError,
  apiServerError,
} from "@/lib/api-response";
import { normalizeText, classifyTasks } from "@/lib/ai";
import { canCreateDump } from "@/lib/plan-gate";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    const body = await request.json();
    const parsed = createBrainDumpSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const { title, rawText, source, useAI } = parsed.data;

    // Find user's workspace
    const user = await db.user.findUnique({
      where: { authId: authUser.id },
      include: {
        memberships: {
          include: { workspace: true },
          take: 1,
        },
      },
    });

    if (!user || !user.memberships[0]) {
      return apiUnauthorized();
    }

    const workspaceId = user.memberships[0].workspace.id;

    // ── Plan limit check ───────────────────────────────────
    const gate = await canCreateDump(workspaceId);
    if (!gate.allowed) {
      return apiError(gate.reason ?? "Límite de plan alcanzado", 403);
    }

    let taskLines: string[];
    let suggestedTitle = title || null;
    let aiClassifications: { text: string; quadrant: string; confidence: number; reason: string }[] = [];

    if (useAI) {
      // ── AI Pipeline ──────────────────────────────────────
      // Step 1: Normalize text into clean tasks
      const normalized = await normalizeText(rawText);
      taskLines = normalized.tasks;
      if (!suggestedTitle && normalized.title) {
        suggestedTitle = normalized.title;
      }

      // Step 2: Classify tasks into Eisenhower quadrants
      if (taskLines.length > 0) {
        const classified = await classifyTasks(taskLines);
        aiClassifications = classified.tasks;
      }
    } else {
      // ── Manual Pipeline ──────────────────────────────────
      taskLines = rawText
        .split(/\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    }

    // Build task data with optional AI classification
    const tasksData = taskLines.map((text, index) => {
      const classification = aiClassifications.find(
        (c) => c.text.toLowerCase().trim() === text.toLowerCase().trim(),
      );

      return {
        text,
        sortOrder: index,
        status: "PENDING" as const,
        quadrant: classification
          ? (classification.quadrant as "Q1_DO" | "Q2_SCHEDULE" | "Q3_DELEGATE" | "Q4_DELETE")
          : undefined,
      };
    });

    // Create brain dump with tasks in one transaction
    const brainDump = await db.brainDump.create({
      data: {
        title: suggestedTitle || `Brain Dump ${new Date().toLocaleDateString("es-ES")}`,
        rawText,
        source,
        status: "PROCESSED",
        workspaceId,
        tasks: {
          create: tasksData,
        },
      },
      include: {
        tasks: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return apiSuccess(
      {
        ...brainDump,
        aiClassifications: useAI ? aiClassifications : undefined,
      },
      201,
    );
  } catch (error) {
    return apiServerError(error);
  }
}
