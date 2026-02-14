// ============================================================
// Stripe Client — Server-side singleton
// ============================================================

import Stripe from "stripe";
import { serverEnv } from "@/lib/env";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = serverEnv.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    stripeInstance = new Stripe(key, {
      typescript: true,
    });
  }
  return stripeInstance;
}

// ─── Price IDs (configured in Stripe Dashboard) ─────────────
// These are set via env vars so they're easy to change per environment.

export const STRIPE_PRICES = {
  BASIC: process.env.STRIPE_PRICE_BASIC ?? "",
  PRO: process.env.STRIPE_PRICE_PRO ?? "",
} as const;
