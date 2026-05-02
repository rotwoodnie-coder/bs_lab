"use client";

import type { ReactNode } from "react";
import { MobileProvider, useMobileContext } from "@/contexts/MobileContext";
import { BottomNav } from "@/components/mobile/BottomNav";
import { cn } from "@/lib/utils";

function MobileShell({ children }: { children: ReactNode }) {
  const { getSchoolStage } = useMobileContext();
  const variant = getSchoolStage();
  const isPrimary = variant === "primary";

  return (
    <div
      className={cn(
        "min-h-dvh text-foreground transition-colors",
        isPrimary
          ? "bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.55),_transparent_34%),linear-gradient(135deg,_#ffd9a8_0%,_#ffb6c1_48%,_#fff5fb_100%)] md:pl-20"
          : "bg-[linear-gradient(180deg,_#eef2f7_0%,_#f8fafc_36%,_#e2e8f0_100%)] md:pl-20",
      )}
    >
      <div className="pb-24 md:pb-0">{children}</div>
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
