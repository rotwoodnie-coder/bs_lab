import * as React from "react";

import { Button, Input, Label, type RichMediaValue } from "@bs-lab/ui";

import type { ApiActor } from "@/lib/new-core-api";

import type { ExperimentStepDraft } from "../types";
import { StepContentRichEditor } from "./StepContentRichEditor";

export function StepItem(props: {
  item: ExperimentStepDraft;
  index: number;
  mediaActor: ApiActor;
  disabled: boolean;
  canDelete: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onUpdate: (field: "title" | "expectedResult", value: string) => void;
  onRichContentChange: (next: RichMediaValue) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="grid gap-2 rounded-md border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <Label>步骤 {props.index + 1}</Label>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={props.onMoveUp} disabled={props.disabled || !props.canMoveUp}>
            上移
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={props.onMoveDown} disabled={props.disabled || !props.canMoveDown}>
            下移
          </Button>
        </div>
      </div>
      <Input
        value={props.item.title}
        placeholder="步骤标题"
        disabled={props.disabled}
        onChange={(e) => props.onUpdate("title", e.target.value)}
      />
      <StepContentRichEditor
        mediaActor={props.mediaActor}
        disabled={props.disabled}
        content={props.item.content}
        contentEmbeds={props.item.contentEmbeds}
        onChange={props.onRichContentChange}
      />
      <Input
        value={props.item.expectedResult}
        placeholder="该步骤预期现象（用于汇总实验结果）"
        disabled={props.disabled}
        onChange={(e) => props.onUpdate("expectedResult", e.target.value)}
      />
      <Button type="button" variant="outline" disabled={props.disabled || !props.canDelete} onClick={props.onDelete}>
        删除步骤
      </Button>
    </div>
  );
}

