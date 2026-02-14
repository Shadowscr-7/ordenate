// ============================================================
// Onboarding API — Update user onboarding progress
// ============================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/actions";
import {
  apiSuccess,
  apiUnauthorized,
  apiServerError,
  apiError,
} from "@/lib/api-response";

const updateOnboardingSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("skip"),
  }),
  z.object({
    action: z.literal("complete"),
  }),
  z.object({
    action: z.literal("update"),
    step: z.number().int().min(0),
  }),
]);

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    const body = await request.json();
    const validation = updateOnboardingSchema.safeParse(body);

    if (!validation.success) {
      return apiError(validation.error.message);
    }

    const { action } = validation.data;

    const updateData =
      action === "skip"
        ? {
            onboardingCompleted: true,
            onboardingSkippedAt: new Date(),
          }
        : action === "complete"
          ? {
              onboardingCompleted: true,
            }
          : {
              onboardingStep: validation.data.step,
            };

    const user = await db.user.update({
      where: { authId: authUser.id },
      data: updateData,
      select: {
        id: true,
        onboardingCompleted: true,
        onboardingStep: true,
      },
    });

    return apiSuccess(user);
  } catch (error) {
    return apiServerError(error);
  }
}

export async function GET() {
  try {
    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    const user = await db.user.findUnique({
      where: { authId: authUser.id },
      select: {
        onboardingCompleted: true,
        onboardingStep: true,
        telegramChatId: true,
      },
    });

    if (!user) return apiUnauthorized();

    return apiSuccess(user);
  } catch (error) {
    return apiServerError(error);
  }
}
