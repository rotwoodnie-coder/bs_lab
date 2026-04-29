"use client";

import * as React from "react";

import { Button, type RichMediaValue } from "@bs-lab/ui";

import type { ApiActor } from "@/lib/new-core-api";

import type { ExperimentResultEntryDraft } from "../types";
import { ResultEntryItem } from "./ResultEntryItem";

export function ResultEntryList(props: {
  mediaActor: ApiActor;
  entries: ExperimentResultEntryDraft[];
  disabled: boolean;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdateTitle: (id: string, value: string) => void;
  onRichContentChange: (id: string, next: RichMediaValue) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" disabled={props.disabled} onClick={props.onAdd}>
          新增结果条目
        </Button>
      </div>
      {props.entries.map((item, idx) => (
        <ResultEntryItem
          key={item.id}
          item={item}
          index={idx}
          mediaActor={props.mediaActor}
          disabled={props.disabled}
          canDelete={props.entries.length > 1}
          canMoveUp={idx > 0}
          canMoveDown={idx < props.entries.length - 1}
          onUpdateTitle={(value) => props.onUpdateTitle(item.id, value)}
          onRichContentChange={(next) => props.onRichContentChange(item.id, next)}
          onDelete={() => props.onRemove(item.id)}
          onMoveUp={() => props.onReorder(idx, idx - 1)}
          onMoveDown={() => props.onReorder(idx, idx + 1)}
        />
      ))}
    </div>
  );
}
