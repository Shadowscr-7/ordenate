// ============================================================
// Stripe Webhook Handler — POST /api/webhooks/stripe
// ============================================================
// Handles:
//   checkout.session.completed → create/update subscription
//   invoice.paid → renew subscription period
//   invoice.payment_failed → mark past_due
//   customer.subscription.updated → sync changes
//   customer.subscription.deleted → cancel subscription
// ============================================================
import { NextRequest, NextResponse } from "next/server";

import Stripe from "stripe";

import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }
  } catch (error) {
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ─── Handlers ───────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const workspaceId = session.metadata?.workspaceId;
  if (!workspaceId) {
    console.error("[Stripe] checkout.session.completed missing workspaceId metadata");
    return;
  }

  const stripe = getStripe();
  const subscriptionId = session.subscription as string;
  if (!subscriptionId) return;

  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = sub.items.data[0]?.price?.id;
  const plan = getPlanFromPriceId(priceId);
  const period = getSubPeriod(sub);

  await db.subscription.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      plan,
      status: "ACTIVE",
      stripeCustomerId: session.customer as string,
      stripeSubId: subscriptionId,
      stripePriceId: priceId,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
    update: {
      plan,
      status: "ACTIVE",
      stripeCustomerId: session.customer as string,
      stripeSubId: subscriptionId,
      stripePriceId: priceId,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });

  console.log(`[Stripe] Subscription created/updated for workspace ${workspaceId}: ${plan}`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const period = getSubPeriod(sub);

  await db.subscription.updateMany({
    where: { stripeSubId: subscriptionId },
    data: {
      status: "ACTIVE",
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });

  console.log(`[Stripe] Invoice paid — subscription ${subscriptionId} renewed`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  await db.subscription.updateMany({
    where: { stripeSubId: subscriptionId },
    data: { status: "PAST_DUE" },
  });

  console.log(`[Stripe] Payment failed — subscription ${subscriptionId} marked PAST_DUE`);
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const priceId = sub.items.data[0]?.price?.id;
  const plan = getPlanFromPriceId(priceId);

  const statusMap: Record<string, string> = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    trialing: "TRIALING",
    incomplete: "INCOMPLETE",
  };

  await db.subscription.updateMany({
    where: { stripeSubId: sub.id },
    data: {
      plan,
      status: (statusMap[sub.status] ?? "ACTIVE") as
        | "ACTIVE"
        | "PAST_DUE"
        | "CANCELED"
        | "TRIALING"
        | "INCOMPLETE",
      stripePriceId: priceId,
      currentPeriodStart: getSubPeriod(sub).start,
      currentPeriodEnd: getSubPeriod(sub).end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });

  console.log(`[Stripe] Subscription ${sub.id} updated to ${plan} (${sub.status})`);
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  await db.subscription.updateMany({
    where: { stripeSubId: sub.id },
    data: {
      status: "CANCELED",
      cancelAtPeriodEnd: false,
    },
  });

  console.log(`[Stripe] Subscription ${sub.id} canceled`);
}

// ─── Helpers ────────────────────────────────────────────────

function getPlanFromPriceId(priceId: string | undefined): "BASIC" | "PRO" {
  const basicPriceId = process.env.STRIPE_PRICE_BASIC;
  if (basicPriceId && priceId === basicPriceId) return "BASIC";
  return "PRO";
}

/** Extract period dates from subscription item (Stripe v20 moved them here). */
function getSubPeriod(sub: Stripe.Subscription) {
  const item = sub.items.data[0];
  return {
    start: item ? new Date(item.current_period_start * 1000) : new Date(),
    end: item ? new Date(item.current_period_end * 1000) : new Date(),
  };
}

/** Get subscriptionId from an invoice (Stripe v20 uses parent.subscription_details). */
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription;
  if (typeof sub === "string") return sub;
  if (sub && typeof sub === "object" && "id" in sub) return sub.id;
  return null;
}
