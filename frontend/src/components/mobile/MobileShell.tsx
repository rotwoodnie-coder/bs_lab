"use client";

import type { ReactNode } from "react";
import { resolveMobileAudience } from "./mobile-role";
import { BottomNav } from "./BottomNav";
import { cn } from "@/lib/utils";
import { useMobileContext } from "@/contexts/MobileContext";

function audienceBadge(audience: ReturnType<typeof resolveMobileAudience>) {
  switch (audience) {
    case "primary":
      return "小学风格";
    case "middle":
      return "中学风格";
    case "parent":
      return "家长风格";
    case "teacher":
      return "老师风格";
  }
}

export function MobileShell({ children }: { children: ReactNode }) {
  const { userContext } = useMobileContext();
  const audience = resolveMobileAudience({ schoolLevelId: userContext?.schoolLevelId ?? null, role: userContext?.role ?? null });

  return (
    <div
      className={cn(
        "min-h-dvh text-foreground",
        audience === "primary" && "bg-gradient-to-b from-amber-50 via-white to-amber-100/40",
        audience === "middle" && "bg-gradient-to-b from-slate-50 via-white to-slate-100/30",
        audience === "parent" && "bg-gradient-to-b from-emerald-50 via-white to-emerald-100/30",
        audience === "teacher" && "bg-gradient-to-b from-sky-50 via-white to-sky-100/30",
      )}
    >
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div>
            <h1 className={cn("font-semibold tracking-tight", audience === "primary" ? "text-2xl" : "text-lg")}>科学小实验社区</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {userContext?.userNickName ?? userContext?.userName ?? "实验用户"} · {userContext?.hasBinding ? "已绑定" : "待绑定"}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background px-3 py-2 text-xs font-medium text-muted-foreground">
            {audienceBadge(audience)}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-4 md:pl-24 md:pr-6">{children}</main>
      <BottomNav />
    </div>
  );
}
