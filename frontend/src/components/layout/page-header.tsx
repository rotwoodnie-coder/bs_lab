import * as React from "react";

import { cn } from "@/lib/utils";

export function PageHeader(props: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-8 flex w-full flex-col items-start justify-between gap-4 px-6 md:px-8 sm:flex-row sm:items-center", props.className)}>
      <div className="min-w-0 space-y-1.5">
        {/* V0 类管理台：页标题略大、字重 600、紧凑字距 */}
        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[1.75rem] sm:leading-snug">
          {props.title}
        </h1>
        {props.description ? (
          <p className="max-w-2xl text-sm font-normal leading-relaxed text-muted-foreground">{props.description}</p>
        ) : null}
      </div>

      {props.actions ? (
        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">{props.actions}</div>
      ) : null}
    </header>
  );
}
