"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@bs-lab/ui";

import type { ExperimentPickerDialog } from "../ExperimentPickerDialog";

// This component has been deprecated. The "关联实验" functionality
// has been extracted into ExperimentPickerDialog and is triggered from EditorBasicSection.
export function EditorSubjectSection(_props: {
  pickerTable: Parameters<typeof ExperimentPickerDialog>[0]["pickerTable"];
  pickerRowsLength: number;
  pickerSelectedStandardId: string;
  pickerUseCustomExp: boolean;
  pickerListFilterPhases: string[];
  onPickerSetListFilterPhases: (v: string[]) => void;
  pickerListFilterDisciplines: string[];
  onPickerSetListFilterDisciplines: (v: string[]) => void;
  pickerListFilterGradeCodes: string[];
  onPickerSetListFilterGradeCodes: (v: string[]) => void;
  pickerListDisciplineOptions: { code: string; name: string }[];
  pickerListGradeOptions: { code: string; name: string }[];
  pickerListFilterPhaseLabels: string;
  pickerListFilterDisciplineSummary: string;
  pickerListFilterGradeSummary: string;
  pickerSearchKeyword: string;
  onPickerSearch: (v: string) => void;
  onPickerSetSelectedStandardId: (v: string) => void;
  onPickerSetUseCustomExp: (v: boolean) => void;
  onPickerSetCurriculum: (v: string) => void;
  onPickerAutoSetParticipation: () => void;
  onPickerAttach: () => void;
  onPickerSetPhase: (v: string[]) => void;
  onPickerSetDiscipline: (v: string[]) => void;
  onPickerSetSelectedGradeCodes: (v: string[]) => void;
  mediaActor: import("@/lib/new-core-api").ApiActor;
}) {
  return (
    <Card id="subject" className="rounded-[28px] border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] scroll-mt-24">
      <CardHeader>
        <CardTitle className="text-base">关联实验（已废弃）</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          关联实验功能已整合到基础信息卡片中。
        </p>
      </CardContent>
    </Card>
  );
}
