"use client";

import * as React from "react";
import { Checkbox, Label, ScrollArea } from "@bs-lab/ui";

import type { DictOption } from "@/lib/v2/v2-dict-adapter";

export function OrgSchoolGradeMultiCheck(props: {
  gradeOptions: DictOption[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  idPrefix: string;
}) {
  const { gradeOptions, value, onChange, disabled, idPrefix } = props;
  const set = React.useMemo(() => new Set(value), [value]);

  const toggle = (id: string, checked: boolean) => {
    const next = new Set(set);
    if (checked) next.add(id);
    else next.delete(id);
    onChange([...next].sort());
  };

  if (gradeOptions.length === 0) {
    return <p className="text-xs text-muted-foreground">年级字典未加载</p>;
  }

  return (
    <ScrollArea className="h-[min(220px,40dvh)] rounded-md border border-border px-2 py-2">
      <div className="flex flex-col gap-2 pr-2">
        {gradeOptions.map((g) => {
          const id = `${idPrefix}-${g.id}`;
          return (
            <div key={g.id} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={set.has(g.id)}
                disabled={disabled}
                onCheckedChange={(c) => toggle(g.id, c === true)}
              />
              <Label htmlFor={id} className="cursor-pointer text-sm font-normal leading-snug">
                {g.name}
              </Label>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
