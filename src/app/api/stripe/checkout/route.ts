// ============================================================
// Stripe Checkout API — Create checkout session
// POST /api/stripe/checkout
// ============================================================
import { NextRequest } from "next/server";

import { z } from "zod";

import {
  apiError,
  apiServerError,
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
} from "@/lib/api-response";
import { getSession } from "@/lib/auth/actions";
import { db } from "@/lib/db";
import { STRIPE_PRICES, getStripe } from "@/lib/stripe";

const checkoutSchema = z.object({
  plan: z.enum(["BASIC", "PRO"]),
});

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const { plan } = parsed.data;
    const priceId = STRIPE_PRICES[plan];

    if (!priceId) {
      return apiError(
        `Stripe price not configured for plan ${plan}. Set STRIPE_PRICE_${plan} env var.`,
        500,
      );
    }

    const stripe = getStripe();
    const subscription = workspace.subscription;

    // Get or create Stripe customer
    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user!.email,
        name: user!.name ?? undefined,
        metadata: {
          workspaceId: workspace.id,
          userId: user!.id,
        },
      });
      customerId = customer.id;

      // Save customer ID
      if (subscription) {
        await db.subscription.update({
          where: { id: subscription.id },
          data: { stripeCustomerId: customerId },
        });
      }
    }

    // If already has an active Stripe subscription, redirect to portal instead
    if (subscription?.stripeSubId && subscription.status === "ACTIVE") {
      return apiError(
        "Ya tienes una suscripción activa. Usa el portal para gestionar tu plan.",
        409,
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/settings?checkout=success`,
      cancel_url: `${appUrl}/dashboard/settings?checkout=canceled`,
      metadata: {
        workspaceId: workspace.id,
      },
      subscription_data: {
        metadata: {
          workspaceId: workspace.id,
        },
      },
    });

    return apiSuccess({ url: session.url });
  } catch (error) {
    return apiServerError(error);
  }
}
