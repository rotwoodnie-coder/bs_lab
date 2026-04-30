"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bs-lab/ui";
import { cn } from "@/lib/utils";

export function ManagementPageFrame(props: {
  title: React.ReactNode;
  description?: React.ReactNode;
  kpis?: React.ReactNode;
  cardTitle: React.ReactNode;
  cardToolbar: React.ReactNode;
  cardMeta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  hideTopSection?: boolean;
  cardClassName?: string;
}) {
  return (
    <div className={cn("flex min-h-0 w-full min-w-0 flex-col gap-3", props.className)}>
      {!props.hideTopSection ? (
        <>
          <div className="space-y-1">
            <div className="flex items-center gap-2">{props.title}</div>
            {props.description ? <p className="text-sm text-muted-foreground">{props.description}</p> : null}
          </div>

          {props.kpis ? <div>{props.kpis}</div> : null}
        </>
      ) : null}

      <Card className={cn("flex min-h-0 flex-1 flex-col gap-0 overflow-hidden border-border py-0 shadow-xs", props.cardClassName)}>
        <CardHeader className="space-y-1 px-4 py-2">
          <CardTitle className="text-lg font-semibold text-slate-900">{props.cardTitle}</CardTitle>
          {props.cardToolbar}
          {props.cardMeta ? <CardDescription className="text-xs">{props.cardMeta}</CardDescription> : null}
        </CardHeader>
        <CardContent
          className="flex min-h-0 flex-1 flex-col border-t border-border p-2 sm:p-2 overflow-hidden"
        >
          {props.children}
        </CardContent>
      </Card>
    </div>
  );
}

