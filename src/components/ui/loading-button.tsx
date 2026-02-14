// ============================================================
// Loading Button — Button with built-in loading state
// ============================================================

"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

interface LoadingButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  loadingText?: string;
  asChild?: boolean;
}

export function LoadingButton({
  children,
  loading = false,
  loadingText,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || loading} {...props}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
