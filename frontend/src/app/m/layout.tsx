"use client";

import type { ReactNode } from "react";
import { MobileProvider, useMobileContext } from "@/contexts/MobileContext";
import { BottomNav } from "@/components/mobile/BottomNav";
import { cn } from "@/lib/utils";

function resolveMobileLayoutVariant(schoolLevelId?: string | null) {
  const value = String(schoolLevelId ?? "").toLowerCase();
  if (!value) return "primary";
  if (value.includes("middle") || value.includes("junior") || value.includes("初中") || value.includes("中学")) return "middle";
  return "primary";
}

function MobileShell({ children }: { children: ReactNode }) {
  const { userContext } = useMobileContext();
  const variant = resolveMobileLayoutVariant(userContext?.schoolLevelId);

  return (
    <div
      className={cn(
        "min-h-dvh text-foreground transition-colors",
        variant === "primary" ? "bg-gradient-to-b from-amber-50 via-white to-rose-50 md:pl-20" : "bg-slate-50 md:pl-20",
      )}
    >
      <div className="pb-20 md:pb-0">{children}</div>
      <BottomNav />
    </div>
  );
}

export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <MobileProvider>
      <MobileShell>{children}</MobileShell>
    </MobileProvider>
  );
}
