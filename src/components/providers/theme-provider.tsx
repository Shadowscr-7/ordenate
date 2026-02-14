// ============================================================
// Theme Provider — Dark/Light mode support
// ============================================================

"use client";

import type { ComponentProps } from "react";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
