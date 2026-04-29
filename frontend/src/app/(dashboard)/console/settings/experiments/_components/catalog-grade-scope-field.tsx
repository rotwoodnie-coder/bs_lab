"use client";

import * as React from "react";
import { Checkbox, Label } from "@bs-lab/ui";

import type { SchoolDimensionSnapshot } from "../../education/subject-grades/page.types";
import { eligibleGradeIdsForCatalog } from "../catalog-eligible-grades";

export function CatalogGradeScopeField(props: {
  snapshot: SchoolDimensionSnapshot | null;
  stageId: string;
  subjectId: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const s = props.snapshot;
  const options = React.useMemo(() => {
    if (!s || !props.stageId || !props.subjectId) return [];
    return eligibleGradeIdsForCatalog(s, props.stageId, props.subjectId)
      .map((id) => {
        const g = s.grades.find((x) => x.gradeId === id);
        return { id, name: g?.gradeName ?? id };
      })
      .filter((x) => x.name);
  }, [s, props.stageId, props.subjectId]);

  const set = React.useMemo(() => new Set(props.value), [props.value]);

  const toggle = React.useCallback(
    (id: string, checked: boolean) => {
      const next = new Set(props.value);
      if (checked) next.add(id);
      else next.delete(id);
      const ordered = options.map((o) => o.id).filter((gid) => next.has(gid));
      props.onChange(ordered);
    },
    [options, props],
  );

  if (!s) {
    return <p className="text-xs text-muted-foreground">加载教学维度后可选择适用年级。</p>;
  }
  if (options.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        当前学段与学科下暂无可用年级路径，请检查教育路径矩阵或学段-年级配置。
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-border bg-muted/10 p-3">
      <Label className="text-foreground">适用年级（可多选）</Label>
      <div className="flex flex-col gap-2 sm:max-h-48 sm:overflow-y-auto">
        {options.map((o) => (
          <label key={o.id} className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={set.has(o.id)} onCheckedChange={(v) => toggle(o.id, v === true)} />
            <span className="text-foreground">{o.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
