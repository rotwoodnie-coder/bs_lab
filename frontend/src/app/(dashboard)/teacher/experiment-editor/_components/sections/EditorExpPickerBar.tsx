"use client";

import * as React from "react";

import { Button } from "@bs-lab/ui";
import { BookOpen } from "@bs-lab/ui/icons";
import type { EducationPhase, SubjectDiscipline } from "@/types/subject";

import { ExperimentPickerDialog } from "../ExperimentPickerDialog";

type Props = {
  fieldDisabled: boolean;
  pickerSelectedStandardId: string | null;
  pickerTable: unknown;
  pickerRowsLength: number;
  pickerUseCustomExp: boolean;
  pickerListFilterPhases: EducationPhase[];
  onPickerSetListFilterPhases: React.Dispatch<React.SetStateAction<EducationPhase[]>>;
  pickerListFilterDisciplines: SubjectDiscipline[];
  onPickerSetListFilterDisciplines: React.Dispatch<React.SetStateAction<SubjectDiscipline[]>>;
  pickerListFilterGradeCodes: string[];
  onPickerSetListFilterGradeCodes: React.Dispatch<React.SetStateAction<string[]>>;
  pickerListDisciplineOptions: { id: SubjectDiscipline; label: string }[];
  pickerListGradeOptions: { code: string; label: string }[];
  pickerListFilterPhaseLabels: string;
  pickerListFilterDisciplineSummary: string;
  pickerListFilterGradeSummary: string;
  pickerSearchKeyword: string;
  onPickerSearch: (keyword: string) => void;
  onPickerSetSelectedStandardId: (v: string | null) => void;
  onPickerSetUseCustomExp: (v: boolean) => void;
  onPickerSetCurriculum: (v: string) => void;
  onPickerAutoSetParticipation: (v: "required" | "optional") => void;
  onPickerAttach: (expId: string) => void | Promise<void>;
  onPickerSetPhase: (v: EducationPhase) => void;
  onPickerSetDiscipline: (v: SubjectDiscipline) => void;
  onPickerSetSelectedGradeCodes: React.Dispatch<React.SetStateAction<string[]>>;
};

export function EditorExpPickerBar(props: Props) {
  const [pickerOpen, setPickerOpen] = React.useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-12">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BookOpen className="size-4" />
        关联实验
      </div>
      <div className="flex items-center gap-2">
        {props.pickerSelectedStandardId ? (
          <span className="text-xs text-muted-foreground">
            已关联：{props.pickerSelectedStandardId.slice(0, 12)}
          </span>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={props.fieldDisabled}
          onClick={() => setPickerOpen(true)}
        >
          <BookOpen className="size-3.5" />
          {props.pickerSelectedStandardId ? "更换关联实验" : "选择关联实验"}
        </Button>
      </div>
      <ExperimentPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        curriculumTable={props.pickerTable}
        curriculumTableRowsLength={props.pickerRowsLength}
        selectedStandardId={props.pickerSelectedStandardId}
        useCustomExperiment={props.pickerUseCustomExp}
        fieldDisabled={props.fieldDisabled}
        listFilterPhases={props.pickerListFilterPhases}
        setListFilterPhases={props.onPickerSetListFilterPhases}
        listFilterDisciplines={props.pickerListFilterDisciplines}
        setListFilterDisciplines={props.onPickerSetListFilterDisciplines}
        listFilterGradeCodes={props.pickerListFilterGradeCodes}
        setListFilterGradeCodes={props.onPickerSetListFilterGradeCodes}
        listDisciplineOptions={props.pickerListDisciplineOptions}
        listGradeOptions={props.pickerListGradeOptions}
        listFilterPhaseLabels={props.pickerListFilterPhaseLabels}
        listFilterDisciplineSummary={props.pickerListFilterDisciplineSummary}
        listFilterGradeSummary={props.pickerListFilterGradeSummary}
        experimentSearchKeyword={props.pickerSearchKeyword}
        onSearchExperiments={props.onPickerSearch}
        setSelectedStandardId={props.onPickerSetSelectedStandardId}
        setUseCustomExperiment={props.onPickerSetUseCustomExp}
        setCurriculum={props.onPickerSetCurriculum}
        autoSetParticipation={props.onPickerAutoSetParticipation}
        attachExperimentFromList={props.onPickerAttach}
        setPhase={props.onPickerSetPhase}
        setDiscipline={props.onPickerSetDiscipline}
        setSelectedGradeCodes={props.onPickerSetSelectedGradeCodes}
      />
    </div>
  );
}
