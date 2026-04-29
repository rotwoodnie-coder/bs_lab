"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type FixedFormActionsProps = {
  children: React.ReactNode;
  className?: string;
};

export function FixedFormActions({ children, className }: FixedFormActionsProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-background/95 pb-safe-bottom backdrop-blur">
      <div className={cn("mx-auto flex w-full max-w-[1400px] items-center justify-end gap-2 px-4 py-3", className)}>
        {children}
      </div>
    </div>
  );
}
