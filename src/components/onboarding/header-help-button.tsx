// ============================================================
// Header Help Button — Context-aware help button for navbar
// ============================================================

"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOnboarding } from "@/lib/onboarding/provider";
import type { OnboardingContext } from "@/lib/onboarding/steps";

// Subscriptions for client-side detection
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function HeaderHelpButton() {
  const { showHelp } = useOnboarding();
  const pathname = usePathname();
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Determine context based on current route
  const getContext = (): OnboardingContext | null => {
    if (pathname === "/dashboard") return "dashboard";
    if (pathname === "/dashboard/backlog") return "backlog";
    if (pathname === "/dashboard/dumps") return "dumps";
    if (pathname === "/dashboard/eisenhower") return "eisenhower";
    if (pathname === "/dashboard/pareto") return "pareto";
    return null;
  };

  const context = getContext();

  // Don't render until mounted to avoid hydration errors
  if (!mounted || !context) {
    return null;
  }

  const handleClick = () => {
    showHelp(context);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClick}
          className="transition-transform duration-200 hover:scale-105"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Ver guía de esta pantalla</TooltipContent>
    </Tooltip>
  );
}
