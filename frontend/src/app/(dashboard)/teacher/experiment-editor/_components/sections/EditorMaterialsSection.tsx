import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bs-lab/ui";

import type { ExperimentMaterialDraft } from "../../types";
import { StepMaterialsPanel } from "../StepMaterialsPanel";

export function EditorMaterialsSection(props: {
  materialsStepsDisabled: boolean;
  materials: ExperimentMaterialDraft[];
  appendMaterials: (drafts: Omit<ExperimentMaterialDraft, "id">[]) => void;
  removeMaterial: (id: string) => void;
  updateMaterial: (
    id: string,
    field:
      | "nameLab"
      | "nameHomeSubstitute"
      | "notes"
      | "hazardFlags"
      | "quantity"
      | "materialType"
      | "materialTypeId"
      | "safetyReminder"
      | "thumbnailUrl"
      | "libraryMaterialId"
      | "numValue"
      | "unitId"
      | "expPurpose"
      | "materialPropId"
      | "materialSecurityList"
      | "materialPics",
    value:
      | string
      | string[]
      | Array<{ securityId: string; securityLevel: number | null }>
      | Array<{ seqId: string; materialUrl: string | null; sortOrder: number | null }>,
  ) => void;
}) {
  return (
    <Card id="materials" className="rounded-[28px] border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] scroll-mt-24">
      <CardHeader>
        <CardTitle className="text-base">实验材料</CardTitle>
        <CardDescription>列出实验所需材料；缩略图为可选项，不影响完成度校验。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <StepMaterialsPanel
          materials={props.materials}
          disabled={props.materialsStepsDisabled}
          onAppendMaterials={props.appendMaterials}
          onRemoveMaterial={props.removeMaterial}
          onUpdateMaterial={props.updateMaterial}
        />
      </CardContent>
    </Card>
  );
}
