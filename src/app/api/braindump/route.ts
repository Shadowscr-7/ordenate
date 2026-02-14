// ============================================================
// Brain Dump API — Create new brain dump + parse into tasks
// ============================================================

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/actions";
import { createBrainDumpSchema } from "@/lib/validations";
import {
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  apiServerError,
} from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    const body = await request.json();
    const parsed = createBrainDumpSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const { title, rawText, source } = parsed.data;

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

    // Parse text into lines (non-empty, trimmed)
    const lines = rawText
      .split(/\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Create brain dump with tasks in one transaction
    const brainDump = await db.brainDump.create({
      data: {
        title: title || `Brain Dump ${new Date().toLocaleDateString("es-ES")}`,
        rawText,
        source,
        status: "PROCESSED",
        workspaceId,
        tasks: {
          create: lines.map((text, index) => ({
            text,
            sortOrder: index,
            status: "PENDING",
          })),
        },
      },
      include: {
        tasks: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return apiSuccess(brainDump, 201);
  } catch (error) {
    return apiServerError(error);
  }
}
