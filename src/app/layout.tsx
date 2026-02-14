import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Analytics } from "@vercel/analytics/react";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Ordénate — Tu mente, en orden",
    template: "%s | Ordénate",
  },
  description:
    "Captura ideas, prioriza con Eisenhower y Pareto, ejecuta con foco. Potenciado por IA.",
  keywords: [
    "ordénate",
    "brain dump",
    "priorización",
    "eisenhower",
    "pareto",
    "productividad",
    "IA",
    "tareas",
  ],
  metadataBase: new URL("https://ordenate.vercel.app"),
  openGraph: {
    title: "Ordénate — Tu mente, en orden",
    description:
      "Captura ideas, prioriza con la Matriz Eisenhower y Pareto, ejecuta con foco. Potenciado por IA.",
    url: "https://ordenate.vercel.app",
    siteName: "Ordénate",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ordénate — Tu mente, en orden",
    description: "Captura ideas, prioriza con Eisenhower y Pareto. Potenciado por IA.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={0}>
            {children}
            <Toaster richColors position="bottom-right" />
          </TooltipProvider>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
