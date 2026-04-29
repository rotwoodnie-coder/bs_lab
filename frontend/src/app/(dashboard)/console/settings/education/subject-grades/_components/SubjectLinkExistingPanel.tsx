"use client";

import * as React from "react";
import { Button, Checkbox, Spinner } from "@bs-lab/ui";

export function SubjectLinkExistingPanel(props: {
  subjects: Array<{ id: string; name: string }>;
  busy: boolean;
  onLink: (subjectIds: string[]) => void | Promise<void>;
}) {
  const [picked, setPicked] = React.useState<Set<string>>(() => new Set());

  React.useEffect(() => {
    setPicked(new Set());
  }, [props.subjects]);

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const ids = [...picked];

  return (
    <div className="rounded-md border border-dashed border-border bg-muted/10 px-4 py-4 space-y-3">
      <div className="text-sm text-foreground">
        库中已有学科尚未与当前学段建立「年级-学科」矩阵行（表{" "}
        <code className="text-xs">data_school_grade_subject</code>
        ）。勾选后点击关联，将按学段下年级批量写入矩阵（与「新增学科」接口一致）。
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {props.subjects.map((s) => (
          <label
            key={s.id}
            className="flex items-center gap-2 rounded border border-border bg-background px-2 py-2 text-sm"
          >
            <Checkbox checked={picked.has(s.id)} onCheckedChange={() => toggle(s.id)} />
            <span className="truncate">{s.name}</span>
            <span className="text-xs text-muted-foreground truncate">{s.id}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={props.busy || ids.length === 0}
          onClick={() => void props.onLink(ids)}
        >
          {props.busy ? (
            <>
              <Spinner className="size-4" /> 关联中…
            </>
          ) : (
            "关联到当前学段"
          )}
        </Button>
      </div>
    </div>
  );
}
