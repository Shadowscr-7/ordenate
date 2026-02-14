// ============================================================
// Interactive Tour Component using React Joyride
// ============================================================

"use client";

import React, { useCallback, useSyncExternalStore } from "react";
import Joyride, { CallBackProps, STATUS, EVENTS } from "react-joyride";
import { useOnboarding } from "@/lib/onboarding/provider";
import type { OnboardingContext } from "@/lib/onboarding/steps";
import { ONBOARDING_STEPS } from "@/lib/onboarding/steps";

interface InteractiveTourProps {
  context: OnboardingContext;
}

// Subscriptions for client-side detection
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function InteractiveTour({ context }: InteractiveTourProps) {
  const { isActive, skipTour, completeTour } = useOnboarding();
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const steps = ONBOARDING_STEPS[context] || [];

  // Add custom styles for hover effects
  React.useEffect(() => {
    const styleId = 'joyride-custom-styles';
    if (mounted && !document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .__floater__arrow polygon {
          fill: hsl(var(--card)) !important;
        }
        .react-joyride__tooltip button:hover {
          transform: translateY(-1px);
        }
        .react-joyride__tooltip button:active {
          transform: translateY(0);
        }
        /* Botón Next/Siguiente con efecto mejorado */
        .react-joyride__tooltip button[data-action="primary"]:hover {
          filter: brightness(1.1);
          box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.4), 0 4px 8px -2px rgba(0, 0, 0, 0.2);
        }
        /* Botón Skip con efecto */
        .react-joyride__tooltip button[data-action="skip"]:hover {
          background-color: hsl(var(--muted));
          border-color: hsl(var(--primary) / 0.4);
        }
        /* Botón Back con efecto */
        .react-joyride__tooltip button[data-action="back"]:hover {
          background-color: hsl(var(--muted));
        }
        /* Mejorar el botón de cerrar (X) */
        .react-joyride__tooltip button[aria-label="Close"] {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid hsl(var(--border));
          background-color: hsl(var(--muted) / 0.5);
          color: hsl(var(--card-foreground));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 500;
          line-height: 1;
          transition: all 0.2s;
          cursor: pointer;
        }
        .react-joyride__tooltip button[aria-label="Close"]:hover {
          background-color: hsl(var(--destructive));
          border-color: hsl(var(--destructive));
          color: hsl(var(--destructive-foreground));
          transform: rotate(90deg) scale(1.1);
        }
        .react-joyride__tooltip button[aria-label="Close"]:active {
          transform: rotate(90deg) scale(0.95);
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      const existing = document.getElementById(styleId);
      if (existing) existing.remove();
    };
  }, [mounted]);

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, type, index } = data;

      // Tour finished or skipped
      if (status === STATUS.FINISHED) {
        completeTour();
      } else if (status === STATUS.SKIPPED) {
        skipTour();
      }

      // Target not found - warn but continue
      if (type === EVENTS.TARGET_NOT_FOUND) {
        console.warn('[Tour] Target not found for step', index);
      }
    },
    [completeTour, skipTour],
  );

  // Don't render until mounted to avoid hydration errors
  if (!mounted || !isActive || steps.length === 0) {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      continuous
      showProgress
      showSkipButton
      run={isActive}
      callback={handleJoyrideCallback}
      locale={{
        back: "Atrás",
        close: "Cerrar",
        last: "Finalizar",
        next: "Siguiente",
        open: "Abrir",
        skip: "Saltar tour",
      }}
      styles={{
        options: {
          primaryColor: "hsl(var(--primary))",
          textColor: "hsl(var(--card-foreground))",
          backgroundColor: "hsl(var(--card))",
          overlayColor: "rgba(0, 0, 0, 0.85)",
          arrowColor: "hsl(var(--card))",
          zIndex: 10000,
        },
        overlay: {
          mixBlendMode: "normal",
        },
        spotlight: {
          borderRadius: "8px",
        },
        tooltip: {
          borderRadius: "16px",
          fontSize: "15px",
          padding: "0",
          backgroundColor: "hsl(var(--card))",
          border: "2px solid hsl(var(--border))",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 8px 16px -4px rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
          maxWidth: "440px",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        tooltipTitle: {
          display: "none",
        },
        tooltipContent: {
          padding: "24px",
          paddingRight: "48px", // Espacio para la X
          fontSize: "15px",
          lineHeight: "1.7",
          color: "hsl(var(--card-foreground))",
        },
        tooltipFooter: {
          marginTop: "0",
          padding: "16px 24px 20px",
          borderTop: "1px solid hsl(var(--border))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "hsl(var(--muted) / 0.2)",
          borderBottomLeftRadius: "14px",
          borderBottomRightRadius: "14px",
        },
        tooltipFooterSpacer: {
          flex: "1",
        },
        buttonNext: {
          backgroundColor: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
          borderRadius: "8px",
          padding: "10px 24px",
          fontSize: "14px",
          fontWeight: "600",
          border: "none",
          cursor: "pointer",
          transition: "all 0.2s",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)",
        },
        buttonBack: {
          color: "hsl(var(--card-foreground))",
          marginRight: "8px",
          padding: "10px 20px",
          fontSize: "14px",
          fontWeight: "500",
          border: "1px solid hsl(var(--border))",
          backgroundColor: "hsl(var(--muted) / 0.5)",
          borderRadius: "8px",
          cursor: "pointer",
          transition: "all 0.2s",
        },
        buttonSkip: {
          color: "hsl(var(--card-foreground))",
          fontSize: "13px",
          fontWeight: "500",
          border: "1px solid hsl(var(--border))",
          backgroundColor: "hsl(var(--muted) / 0.5)",
          borderRadius: "6px",
          padding: "6px 12px",
          cursor: "pointer",
          transition: "all 0.2s",
        },
        buttonClose: {
          display: "none", // Ocultamos el estilo por defecto, usamos el CSS custom
        },
      }}
    />
  );
}
