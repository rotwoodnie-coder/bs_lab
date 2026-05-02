"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MobileProvider, useMobileContext } from "@/contexts/MobileContext";
import { BottomNav } from "@/components/mobile/BottomNav";
import { cn } from "@/lib/utils";

const HIDDEN_BOTTOM_NAV_PATHS = ["/m/login", "/m/bind/child", "/m/bind/success"] as const;

function MobileShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { getSchoolStage } = useMobileContext();
  const variant = getSchoolStage();
  const isPrimary = variant === "primary";
  const hideBottomNav = HIDDEN_BOTTOM_NAV_PATHS.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  return (
    <div
      className={cn(
        "min-h-dvh text-foreground transition-colors",
        isPrimary
          ? "bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.55),_transparent_34%),linear-gradient(135deg,_#ffd9a8_0%,_#ffb6c1_48%,_#fff5fb_100%)] md:pl-20"
          : "bg-[linear-gradient(180deg,_#eef2f7_0%,_#f8fafc_36%,_#e2e8f0_100%)] md:pl-20",
      )}
    >
      <div className={cn("pb-24 md:pb-0", hideBottomNav && "pb-0")}>{children}</div>
      {hideBottomNav ? null : <BottomNav />}
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
