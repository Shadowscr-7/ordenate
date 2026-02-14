// ============================================================
// Subscription API — GET current subscription info
// GET /api/stripe/subscription
// ============================================================
import { NextRequest } from "next/server";

import { apiServerError, apiSuccess, apiUnauthorized } from "@/lib/api-response";
import { getSession } from "@/lib/auth/actions";
import { db } from "@/lib/db";

export async function GET(_request: NextRequest) {
  try {
    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    const user = await db.user.findUnique({
      where: { authId: authUser.id },
      include: {
        memberships: {
          take: 1,
          include: { workspace: { include: { subscription: true } } },
        },
      },
    });

    const workspace = user?.memberships[0]?.workspace;
    if (!workspace) return apiUnauthorized();

    const subscription = workspace.subscription;

    // Count dumps this month for limit check
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dumpsThisMonth = await db.brainDump.count({
      where: {
        workspaceId: workspace.id,
        createdAt: { gte: startOfMonth },
      },
    });

    return apiSuccess({
      plan: subscription?.plan ?? "BASIC",
      status: subscription?.status ?? "ACTIVE",
      stripeCustomerId: subscription?.stripeCustomerId ?? null,
      stripeSubId: subscription?.stripeSubId ?? null,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
      dumpsThisMonth,
      dumpsLimit: subscription?.plan === "PRO" ? null : 10,
    });
  } catch (error) {
    return apiServerError(error);
  }
}
