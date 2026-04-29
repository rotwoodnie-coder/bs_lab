import * as React from "react";
import { Button, Input, Label, Separator, Textarea } from "@bs-lab/ui";

import { EXPERIMENT_EDITOR_MULTILINE_ROWS } from "../page.constants";

import type { ExperimentMaterialDraft, ExperimentStepDraft } from "../types";

export type StepSidebarProps = {
  materials: ExperimentMaterialDraft[];
  setMaterials: React.Dispatch<React.SetStateAction<ExperimentMaterialDraft[]>>;
  steps: ExperimentStepDraft[];
  setSteps: React.Dispatch<React.SetStateAction<ExperimentStepDraft[]>>;
  materialsStepsDisabled: boolean;
};

export function StepSidebar({ materials, setMaterials, steps, setSteps, materialsStepsDisabled }: StepSidebarProps) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <Label>实验材料</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={materialsStepsDisabled}
            onClick={() =>
              setMaterials((prev) => [
                ...prev,
                { id: `m${Date.now()}`, nameLab: "", nameHomeSubstitute: "", hazardFlags: [], notes: "" },
              ])
            }
          >
            新增材料
          </Button>
        </div>
        {materials.map((item, idx) => (
          <div key={item.id} className="grid gap-2 rounded-md border border-border p-3 md:grid-cols-4">
            <Input
              value={item.nameLab}
              placeholder={`材料 ${idx + 1}`}
              disabled={materialsStepsDisabled}
              onChange={(e) =>
                setMaterials((prev) => prev.map((x) => (x.id === item.id ? { ...x, nameLab: e.target.value } : x)))
              }
            />
            <Input
              value={item.nameHomeSubstitute}
              placeholder="家庭替代材料"
              disabled={materialsStepsDisabled}
              onChange={(e) =>
                setMaterials((prev) =>
                  prev.map((x) => (x.id === item.id ? { ...x, nameHomeSubstitute: e.target.value } : x)),
                )
              }
            />
            <Input
              value={item.hazardFlags.join("、")}
              placeholder="危险属性（以、分隔）"
              disabled={materialsStepsDisabled}
              onChange={(e) =>
                setMaterials((prev) =>
                  prev.map((x) =>
                    x.id === item.id
                      ? {
                          ...x,
                          hazardFlags: e.target.value
                            .split(/[、，,]/)
                            .map((text) => text.trim())
                            .filter(Boolean),
                        }
                      : x,
                  ),
                )
              }
            />
            <Button
              type="button"
              variant="outline"
              disabled={materialsStepsDisabled || materials.length <= 1}
              onClick={() => setMaterials((prev) => prev.filter((x) => x.id !== item.id))}
            >
              删除
            </Button>
          </div>
        ))}
      </div>

      <Separator />

      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <Label>实验步骤</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={materialsStepsDisabled}
            onClick={() =>
              setSteps((prev) => [
                ...prev,
                { id: `s${Date.now()}`, title: "", content: "", contentEmbeds: [], expectedResult: "" },
              ])
            }
          >
            新增步骤
          </Button>
        </div>
        {steps.map((item, idx) => (
          <div key={item.id} className="grid gap-2 rounded-md border border-border p-3">
            <Label>步骤 {idx + 1}</Label>
            <Input
              value={item.title}
              placeholder="步骤标题"
              disabled={materialsStepsDisabled}
              onChange={(e) =>
                setSteps((prev) => prev.map((x) => (x.id === item.id ? { ...x, title: e.target.value } : x)))
              }
            />
            <Textarea
              value={item.content}
              placeholder="步骤内容"
              rows={EXPERIMENT_EDITOR_MULTILINE_ROWS}
              disabled={materialsStepsDisabled}
              onChange={(e) =>
                setSteps((prev) => prev.map((x) => (x.id === item.id ? { ...x, content: e.target.value } : x)))
              }
            />
            <Input
              value={item.expectedResult}
              placeholder="该步骤预期现象（用于汇总实验结果）"
              disabled={materialsStepsDisabled}
              onChange={(e) =>
                setSteps((prev) =>
                  prev.map((x) => (x.id === item.id ? { ...x, expectedResult: e.target.value } : x)),
                )
              }
            />
            <Button
              type="button"
              variant="outline"
              disabled={materialsStepsDisabled || steps.length <= 1}
              onClick={() => setSteps((prev) => prev.filter((x) => x.id !== item.id))}
            >
              删除步骤
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

