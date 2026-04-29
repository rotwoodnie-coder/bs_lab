import * as React from "react";
import { Button, Input, Label, Textarea } from "@bs-lab/ui";

import { EXPERIMENT_EDITOR_MULTILINE_ROWS } from "../page.constants";

import { useEditorEngine } from "../hooks/use-editor-engine";

type UseEditorEngineResult = ReturnType<typeof useEditorEngine>["step"];

export type StepListSidebarProps = {
  engine: UseEditorEngineResult;
  disabled: boolean;
};

export function StepListSidebar({ engine, disabled }: StepListSidebarProps) {
  const moveStep = (id: string, direction: "up" | "down") => {
    const currentIndex = engine.steps.findIndex((step) => step.id === id);
    if (currentIndex < 0) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    engine.reorderStep(currentIndex, targetIndex);
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <Label>实验步骤</Label>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={engine.addStep}>
          新增步骤
        </Button>
      </div>
      {engine.steps.map((item, idx) => (
        <div key={item.id} className="grid gap-2 rounded-md border border-border p-3">
          <div className="flex items-center justify-between">
            <Label>步骤 {idx + 1}</Label>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" disabled={disabled || idx === 0} onClick={() => moveStep(item.id, "up")}>
                上移
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || idx === engine.steps.length - 1}
                onClick={() => moveStep(item.id, "down")}
              >
                下移
              </Button>
            </div>
          </div>
          <Input
            value={item.title}
            placeholder="步骤标题"
            disabled={disabled}
            onChange={(e) => engine.updateStep(item.id, "title", e.target.value)}
          />
          <Textarea
            value={item.content}
            placeholder="步骤内容"
            rows={EXPERIMENT_EDITOR_MULTILINE_ROWS}
            disabled={disabled}
            onChange={(e) => engine.updateStep(item.id, "content", e.target.value)}
          />
          <Input
            value={item.expectedResult}
            placeholder="该步骤预期现象（用于汇总实验结果）"
            disabled={disabled}
            onChange={(e) => engine.updateStep(item.id, "expectedResult", e.target.value)}
          />
          <Button type="button" variant="outline" disabled={disabled || engine.steps.length <= 1} onClick={() => engine.removeStep(item.id)}>
            删除步骤
          </Button>
        </div>
      ))}
    </div>
  );
}

