import * as React from "react";

import { Button, Card, CardContent, CardHeader, CardTitle, type RichMediaValue } from "@bs-lab/ui";

import type { ApiActor } from "@/lib/new-core-api";

import type { ExperimentStepDraft } from "../../types";
import { StepItem } from "../StepItem";

export function EditorStepsSection(props: {
  materialsStepsDisabled: boolean;
  mediaActor: ApiActor;
  steps: ExperimentStepDraft[];
  addStep: () => void;
  removeStep: (id: string) => void;
  updateStep: (id: string, field: "title" | "expectedResult", value: string) => void;
  updateStepRichContent: (id: string, next: RichMediaValue) => void;
  reorderStep: (fromIndex: number, toIndex: number) => void;
}) {
  return (
    <Card id="steps" className="rounded-[28px] border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] scroll-mt-24">
      <CardHeader>
        <CardTitle className="text-base">实验步骤</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">按操作顺序填写各步说明，可插入图片与视频。</span>
          <Button type="button" variant="outline" size="sm" disabled={props.materialsStepsDisabled} onClick={props.addStep}>
            新增步骤
          </Button>
        </div>
        {props.steps.map((item, idx) => (
          <StepItem
            key={item.id}
            item={item}
            index={idx}
            mediaActor={props.mediaActor}
            disabled={props.materialsStepsDisabled}
            canDelete={props.steps.length > 1}
            canMoveUp={idx > 0}
            canMoveDown={idx < props.steps.length - 1}
            onUpdate={(field, value) => props.updateStep(item.id, field, value)}
            onRichContentChange={(next) => props.updateStepRichContent(item.id, next)}
            onDelete={() => props.removeStep(item.id)}
            onMoveUp={() => props.reorderStep(idx, idx - 1)}
            onMoveDown={() => props.reorderStep(idx, idx + 1)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
