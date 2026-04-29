"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import type { ShowcaseDef } from "../lab-types";
import { PropsDocBlock } from "./props-doc-block";

type ShowcasesRecord = Record<string, ShowcaseDef>;

export function ShowcaseBlock({
  name,
  showcases,
}: {
  name: string;
  showcases: ShowcasesRecord;
}) {
  const def = showcases[name];
  if (!def) {
    return (
      <p className="text-sm text-destructive">
        未注册的 showcase：<code>{name}</code>
      </p>
    );
  }
  return (
    <div className="flex min-h-fit flex-col gap-3">
      <p className="text-sm font-medium text-muted-foreground">{def.label}</p>
      <PropsDocBlock text={def.propsDoc} />
      <div className={cn("min-h-fit", def.rowClassName ?? "flex flex-wrap gap-2")}>
        {def.presets.map((p) => (
          <React.Fragment key={p.key}>{p.render()}</React.Fragment>
        ))}
      </div>
    </div>
  );
}
