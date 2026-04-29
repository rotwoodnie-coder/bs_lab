"use client";

import * as React from "react";

import { Button, Input, Label, type RichMediaValue } from "@bs-lab/ui";

import type { ApiActor } from "@/lib/new-core-api";

import type { ExperimentResultEntryDraft } from "../types";
import { StepContentRichEditor } from "./StepContentRichEditor";

export function ResultEntryItem(props: {
  item: ExperimentResultEntryDraft;
  index: number;
  mediaActor: ApiActor;
  disabled: boolean;
  canDelete: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onUpdateTitle: (value: string) => void;
  onRichContentChange: (next: RichMediaValue) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="grid gap-2 rounded-md border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <Label>结果 {props.index + 1}</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={props.onMoveUp}
            disabled={props.disabled || !props.canMoveUp}
          >
            上移
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={props.onMoveDown}
            disabled={props.disabled || !props.canMoveDown}
          >
            下移
          </Button>
        </div>
      </div>
      <Input
        value={props.item.title}
        placeholder="结果标题"
        disabled={props.disabled}
        onChange={(e) => props.onUpdateTitle(e.target.value)}
      />
      <StepContentRichEditor
        mediaActor={props.mediaActor}
        disabled={props.disabled}
        content={props.item.content}
        contentEmbeds={props.item.contentEmbeds}
        onChange={props.onRichContentChange}
        editorTitle="结果说明"
        contentPlaceholder="请描述本项实验结果，可插入图片与视频。"
      />
      <Button type="button" variant="outline" disabled={props.disabled || !props.canDelete} onClick={props.onDelete}>
        删除本条
      </Button>
    </div>
  );
}
