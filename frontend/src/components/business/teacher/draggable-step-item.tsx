"use client";

import * as React from "react";
import { Button, Card, CardContent, Input, Label, Textarea } from "@bs-lab/ui";

export type ExperimentStepDraft = {
  id: string;
  title: string;
  content: string;
  expectedResult: string;
};

type DraggableStepItemProps = {
  item: ExperimentStepDraft;
  index: number;
  total: number;
  disabled: boolean;
  onUpdate: (id: string, patch: Partial<ExperimentStepDraft>) => void;
  onDelete: (id: string) => void;
  onMove: (from: number, to: number) => void;
};

export function DraggableStepItem({
  item,
  index,
  total,
  disabled,
  onUpdate,
  onDelete,
  onMove,
}: DraggableStepItemProps) {
  const [dragging, setDragging] = React.useState(false);

  return (
    <Card
      draggable={!disabled}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", String(index));
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const sourceIndex = Number(event.dataTransfer.getData("text/plain"));
        if (!Number.isFinite(sourceIndex) || sourceIndex === index) return;
        onMove(sourceIndex, index);
      }}
      className={dragging ? "border-0 shadow-md" : "border-0 shadow-sm"}
    >
      <CardContent className="space-y-2 pt-4">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs text-muted-foreground">步骤 {index + 1}</Label>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || index === 0}
              onClick={() => onMove(index, index - 1)}
            >
              上移
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || index === total - 1}
              onClick={() => onMove(index, index + 1)}
            >
              下移
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || total <= 1}
              onClick={() => onDelete(item.id)}
            >
              删除
            </Button>
          </div>
        </div>
        <Input
          value={item.title}
          placeholder="步骤标题"
          disabled={disabled}
          onChange={(event) => onUpdate(item.id, { title: event.target.value })}
        />
        <Textarea
          value={item.content}
          placeholder="步骤内容"
          rows={2}
          disabled={disabled}
          onChange={(event) => onUpdate(item.id, { content: event.target.value })}
        />
        <Input
          value={item.expectedResult}
          placeholder="该步骤预期现象"
          disabled={disabled}
          onChange={(event) => onUpdate(item.id, { expectedResult: event.target.value })}
        />
      </CardContent>
    </Card>
  );
}
