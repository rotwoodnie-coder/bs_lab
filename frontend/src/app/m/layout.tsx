"use client";

import type { ReactNode } from "react";
import { MobileProvider, useMobileContext } from "@/contexts/MobileContext";
import { BottomNav } from "@/components/mobile/BottomNav";
import { cn } from "@/lib/utils";

function MobileShell({ children }: { children: ReactNode }) {
  const { getSchoolStage } = useMobileContext();
  const variant = getSchoolStage();

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
