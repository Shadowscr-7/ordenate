// ============================================================
// Stripe Customer Portal — Create portal session
// POST /api/stripe/portal
// ============================================================

import { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/actions";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiServerError,
} from "@/lib/api-response";

export async function POST(_request: NextRequest) {
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

    const subscription = user?.memberships[0]?.workspace?.subscription;
    if (!subscription?.stripeCustomerId) {
      return apiError("No se encontró un cliente de Stripe asociado. Suscríbete primero.", 404);
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${appUrl}/dashboard/settings`,
    });

    return apiSuccess({ url: session.url });
  } catch (error) {
    return apiServerError(error);
  }
}
