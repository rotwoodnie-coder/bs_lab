"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MobileCard({
  title,
  subtitle,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-3xl border border-border/60 bg-background shadow-sm", className)}>
      {(title || subtitle) && (
        <header className="border-b border-border/50 px-4 py-3">
          {title ? <h2 className="text-base font-semibold">{title}</h2> : null}
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
