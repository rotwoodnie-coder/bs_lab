import * as React from "react";

import { cn } from "@/lib/utils";

export type EmptyPlaceholderProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyPlaceholder({
  icon,
  title,
  description,
  action,
  className,
}: EmptyPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg bg-muted/30 px-6 py-12",
        className,
      )}
    >
      {icon ? (
        <div className="text-muted-foreground">{icon}</div>
      ) : null}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
