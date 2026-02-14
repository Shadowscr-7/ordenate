// ============================================================
// Plan Gating — Check subscription limits & features
// ============================================================
import { PLAN_LIMITS } from "@/types";
import type { SubscriptionPlan } from "@/types";

import { db } from "@/lib/db";

interface GateResult {
  allowed: boolean;
  plan: SubscriptionPlan;
  reason?: string;
}

/**
 * Check if a workspace can create more brain dumps this month.
 */
export async function canCreateDump(workspaceId: string): Promise<GateResult> {
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    include: { subscription: true },
  });

  const plan: SubscriptionPlan = workspace?.subscription?.plan ?? "BASIC";
  const limit = PLAN_LIMITS[plan].maxDumpsPerMonth;

  if (limit === Infinity) {
    return { allowed: true, plan };
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const count = await db.brainDump.count({
    where: {
      workspaceId,
      createdAt: { gte: startOfMonth },
    },
  });

  if (count >= limit) {
    return {
      allowed: false,
      plan,
      reason: `Has alcanzado el límite de ${limit} brain dumps este mes. Actualiza a Pro para dumps ilimitados.`,
    };
  }

  return { allowed: true, plan };
}

/**
 * Check if a workspace has access to a Pro feature.
 */
export async function hasProAccess(workspaceId: string): Promise<GateResult> {
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    include: { subscription: true },
  });

  const plan: SubscriptionPlan = workspace?.subscription?.plan ?? "BASIC";
  const status = workspace?.subscription?.status ?? "ACTIVE";

  if (plan !== "PRO" || (status !== "ACTIVE" && status !== "TRIALING")) {
    return {
      allowed: false,
      plan,
      reason: "Esta función requiere una suscripción Pro activa.",
    };
  }

  return { allowed: true, plan };
}

/**
 * Get the current plan for a workspace.
 */
export async function getWorkspacePlan(workspaceId: string): Promise<SubscriptionPlan> {
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    include: { subscription: true },
  });

  return workspace?.subscription?.plan ?? "BASIC";
}
