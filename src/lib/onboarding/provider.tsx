// ============================================================
// Onboarding Provider — Manages tour state and progress
// ============================================================

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { InteractiveTour } from "@/components/onboarding/interactive-tour";
import type { OnboardingContext as TourContext } from "@/lib/onboarding/steps";

interface OnboardingContextType {
  isActive: boolean;
  currentStep: number;
  currentContext: TourContext | null;
  startTour: () => void;
  skipTour: () => void;
  completeTour: () => void;
  setStep: (step: number) => void;
  showHelp: (context: TourContext) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

export function OnboardingProvider({
  children,
  initialCompleted = false,
  initialStep = 0,
}: {
  children: React.ReactNode;
  initialCompleted?: boolean;
  initialStep?: number;
}) {
  const [showTour, setShowTour] = useState(false); // Don't auto-start
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [currentContext, setCurrentContext] = useState<TourContext | null>(null);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  const pathname = usePathname();

  // Auto-start tour for new users on dashboard (only once)
  useEffect(() => {
    // Only auto-start if:
    // 1. User hasn't completed onboarding (explicitly false, not undefined)
    // 2. We're on the dashboard
    // 3. We haven't auto-started yet
    // 4. Current step is 0 (fresh start)
    if (
      initialCompleted === false &&
      pathname === "/dashboard" &&
      !hasAutoStarted &&
      currentStep === 0
    ) {
      // Delay to ensure page is fully loaded
      const timer = setTimeout(() => {
        setCurrentContext("dashboard");
        setShowTour(true);
        setHasAutoStarted(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [pathname, initialCompleted, currentStep, hasAutoStarted]);

  const startTour = () => {
    setShowTour(true);
  };

  const skipTour = async () => {
    setShowTour(false);
    setCurrentContext(null); // Clear context
    // Update backend
    try {
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "skip" }),
      });
    } catch (error) {
      console.error("Failed to skip onboarding:", error);
    }
  };

  const completeTour = async () => {
    setShowTour(false);
    setCurrentContext(null); // Clear context
    // Update backend
    try {
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    }
  };

  const setStep = async (step: number) => {
    setCurrentStep(step);
    // Update backend
    try {
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", step }),
      });
    } catch (error) {
      console.error("Failed to update onboarding step:", error);
    }
  };

  const showHelp = (context: TourContext) => {
    setCurrentStep(0); // Reset to first step
    setCurrentContext(context); // Set the context
    setShowTour(true); // Show the tour
  };

  return (
    <OnboardingContext.Provider
      value={{
        isActive: showTour,
        currentStep,
        currentContext,
        startTour,
        skipTour,
        completeTour,
        setStep,
        showHelp,
      }}
    >
      {children}
      {/* Single global tour component */}
      {currentContext && <InteractiveTour context={currentContext} />}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}
