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

  // Add custom styles for enhanced visual experience
  React.useEffect(() => {
    const styleId = 'joyride-custom-styles';
    if (mounted && !document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Floater body - Fondo y contorno destacado */
        .__floater__body {
          background: linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.98) 100%) !important;
          border: 2px solid hsl(var(--primary) / 0.3) !important;
          border-radius: 20px !important;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset,
                      0 20px 40px -10px rgba(0, 0, 0, 0.5),
                      0 10px 20px -5px rgba(0, 0, 0, 0.3),
                      0 0 60px -15px hsl(var(--primary) / 0.2) !important;
        }
        
        /* Flecha del tooltip */
        .__floater__arrow {
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3)) !important;
        }
        
        .__floater__arrow polygon {
          fill: hsl(var(--card)) !important;
          stroke: hsl(var(--primary) / 0.3) !important;
          stroke-width: 2px !important;
        }
        
        /* Spotlight - Reborde azul/celeste con transparencia */
        .react-joyride__spotlight {
          border: 3px solid hsl(199deg 89% 48% / 0.8) !important;
          border-radius: 12px !important;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5),
                      0 0 0 6px hsl(199deg 89% 48% / 0.4),
                      0 0 20px 3px hsl(199deg 89% 48% / 0.6),
                      inset 0 0 20px 0 hsl(199deg 89% 48% / 0.15) !important;
          background: transparent !important;
        }
        
        /* Animación de entrada del tooltip */
        .react-joyride__tooltip {
          animation: tourFadeIn 0.3s ease-out;
        }
        
        @keyframes tourFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        /* Efectos de hover en botones */
        .react-joyride__tooltip button {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .react-joyride__tooltip button:hover {
          transform: translateY(-2px);
        }
        
        .react-joyride__tooltip button:active {
          transform: translateY(0);
        }
        
        /* Botón Next/Siguiente - Efecto destacado */
        .react-joyride__tooltip button[data-action="primary"] {
          position: relative;
          overflow: hidden;
        }
        
        .react-joyride__tooltip button[data-action="primary"]:hover {
          filter: brightness(1.15);
          box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.5), 
                      0 6px 12px -3px rgba(0, 0, 0, 0.3),
                      0 0 0 3px hsl(var(--primary) / 0.2);
        }
        
        .react-joyride__tooltip button[data-action="primary"]:active {
          transform: translateY(0) scale(0.98);
        }
        
        /* Botón Skip - Efecto sutil */
        .react-joyride__tooltip button[data-action="skip"]:hover {
          background-color: hsl(var(--muted));
          border-color: hsl(var(--primary) / 0.5);
          box-shadow: 0 4px 8px -2px rgba(0, 0, 0, 0.2);
        }
        
        /* Botón Back - Efecto sutil */
        .react-joyride__tooltip button[data-action="back"]:hover {
          background-color: hsl(var(--muted));
          border-color: hsl(var(--border));
          box-shadow: 0 4px 8px -2px rgba(0, 0, 0, 0.2);
        }
        
        /* Botón de cerrar (X) - Diseño mejorado */
        .react-joyride__tooltip button[aria-label="Close"] {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1.5px solid hsl(var(--border));
          background: linear-gradient(135deg, hsl(var(--muted) / 0.8), hsl(var(--muted) / 0.5));
          color: hsl(var(--card-foreground));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 600;
          line-height: 1;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          z-index: 10;
        }
        
        .react-joyride__tooltip button[aria-label="Close"]:hover {
          background: hsl(var(--destructive));
          border-color: hsl(var(--destructive));
          color: hsl(var(--destructive-foreground));
          transform: rotate(90deg) scale(1.15);
          box-shadow: 0 8px 16px -4px rgba(220, 38, 38, 0.4);
        }
        
        .react-joyride__tooltip button[aria-label="Close"]:active {
          transform: rotate(90deg) scale(1.0);
        }
        
        /* Progress indicator - Mejorado */
        .react-joyride__tooltip .react-joyride__tooltip__counter {
          font-weight: 600;
          color: hsl(var(--primary));
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
          backgroundColor: "transparent",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          arrowColor: "transparent",
          zIndex: 10000,
        },
        overlay: {
          mixBlendMode: "normal",
          backdropFilter: "blur(1px)",
        },
        spotlight: {
          // Estilos manejados por CSS personalizado
        },
        tooltip: {
          borderRadius: "20px",
          fontSize: "15px",
          padding: "0",
          backgroundColor: "transparent",
          border: "none",
          boxShadow: "none",
          maxWidth: "460px",
          minWidth: "320px",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        tooltipTitle: {
          display: "none",
        },
        tooltipContent: {
          padding: "28px 28px 20px",
          paddingRight: "56px", // Espacio para la X
          fontSize: "15px",
          lineHeight: "1.65",
          color: "hsl(var(--card-foreground))",
          backgroundColor: "hsl(var(--card))",
          borderTopLeftRadius: "20px",
          borderTopRightRadius: "20px",
        },
        tooltipFooter: {
          marginTop: "0",
          padding: "18px 28px 24px",
          borderTop: "1.5px solid hsl(var(--border))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          backgroundColor: "hsl(var(--card))",
          borderBottomLeftRadius: "20px",
          borderBottomRightRadius: "20px",
        },
        tooltipFooterSpacer: {
          flex: "1",
        },
        buttonNext: {
          backgroundColor: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
          borderRadius: "10px",
          padding: "11px 28px",
          fontSize: "14px",
          fontWeight: "700",
          letterSpacing: "0.01em",
          border: "none",
          cursor: "pointer",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.3), 0 2px 6px -1px rgba(0, 0, 0, 0.2)",
        },
        buttonBack: {
          color: "hsl(var(--card-foreground))",
          marginRight: "8px",
          padding: "11px 22px",
          fontSize: "14px",
          fontWeight: "600",
          border: "1.5px solid hsl(var(--border))",
          backgroundColor: "hsl(var(--muted) / 0.6)",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        },
        buttonSkip: {
          color: "hsl(var(--card-foreground))",
          fontSize: "13px",
          fontWeight: "600",
          border: "1.5px solid hsl(var(--border))",
          backgroundColor: "hsl(var(--muted) / 0.5)",
          borderRadius: "8px",
          padding: "7px 14px",
          cursor: "pointer",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        },
        buttonClose: {
          display: "none", // Ocultamos el estilo por defecto, usamos el CSS custom
        },
      }}
    />
  );
}
