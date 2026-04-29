import * as React from "react";

import { Badge, TabsList, TabsTrigger } from "@bs-lab/ui";

export type EditorTabKey = "basic" | "teachingContext" | "materials" | "steps" | "result" | "safety";

export type EditorTabItem = {
  key: EditorTabKey;
  label: string;
  completed: boolean;
  progressPct: number;
};

export function EditorTabNav(props: { items: EditorTabItem[] }) {
  return (
    <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-muted/30 p-1">
      {props.items.map((item) => {
        const toneClass = item.completed ? "border-status-success/40 text-status-success" : "text-muted-foreground";
        return (
          <TabsTrigger key={item.key} value={item.key} className="gap-2 data-[state=active]:bg-background">
            <span>{item.label}</span>
            <Badge variant="outline" className={toneClass}>
              {item.completed ? "已完成" : `${item.progressPct}%`}
            </Badge>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}

