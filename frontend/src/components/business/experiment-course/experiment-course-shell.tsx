"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ExperimentCourseShellProps = {
  left: React.ReactNode;
  main: React.ReactNode;
  right?: React.ReactNode;
  bottom?: React.ReactNode;
  className?: string;
};

export function ExperimentCourseShell({ left, main, right, bottom, className }: ExperimentCourseShellProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid gap-6 pb-28 lg:grid-cols-[15%_65%_20%] lg:items-start">
        <aside className="hidden min-w-0 lg:sticky lg:top-6 lg:block lg:self-start">{left}</aside>
        <div className="min-w-0 space-y-6">{main}</div>
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:self-start">{right}</aside>
      </div>
      {bottom}
    </div>
  );
}
