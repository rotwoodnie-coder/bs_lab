"use client";

import * as React from "react";

import { Button } from "@bs-lab/ui";
import { BookOpen } from "@bs-lab/ui/icons";
import type { EducationPhase, SubjectDiscipline } from "@/types/subject";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/atoms/table";

import { ExperimentPickerDialog } from "../ExperimentPickerDialog";

type Props = {
  fieldDisabled: boolean;
  pickerSelectedStandardId: string | null;
  pickerTable: unknown;
  pickerRowsLength: number;
  pickerUseCustomExp: boolean;
  pickerLinkedName?: string | null;
  pickerSelectedStandardRow?: {
    title?: string;
    subjectLabel?: string;
    phaseLabel?: string;
    gradeLabels?: string[];
  } | null;
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
  onPickerConfirm: (meta: { expId: string; expName?: string; sourceType?: 'library' | 'msg'; publishStatus?: string | null; libraryId?: string }) => void | Promise<void>;
  onPickerSetLinkedName?: (v: string | null) => void;
  onAutoFillBasic?: () => void | Promise<void>;
  onAutoFillAll?: () => void | Promise<void>;
  onPickerSetPhase: (v: EducationPhase) => void;
  onPickerSetDiscipline: (v: SubjectDiscipline) => void;
  onPickerSetSelectedGradeCodes: React.Dispatch<React.SetStateAction<string[]>>;
};

export function EditorExpPickerBar(props: Props) {
  const [pickerOpen, setPickerOpen] = React.useState(false);

  return (
    <div className="grid gap-3 lg:col-span-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="size-4" />
          关联实验
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {props.pickerSelectedStandardId ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-1.5"
              disabled={props.fieldDisabled}
              onClick={() => {
                props.onPickerSetSelectedStandardId(null);
                props.onPickerSetLinkedName?.(null);
                props.onPickerSetUseCustomExp(true);
                props.onPickerSetCurriculum("老师拓展实验（未关联实验列表）");
              }}
            >
              清除关联
            </Button>
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
      </div>
      {props.pickerSelectedStandardId ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100/80">
                <TableHead className="h-10 px-4 text-xs font-medium text-slate-500">实验名称</TableHead>
                <TableHead className="h-10 px-4 text-xs font-medium text-slate-500">学科</TableHead>
                <TableHead className="h-10 px-4 text-xs font-medium text-slate-500">学段</TableHead>
                <TableHead className="h-10 px-4 text-xs font-medium text-slate-500">适用年级</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="px-4 py-3 font-medium text-slate-900">
                  {props.pickerSelectedStandardRow?.title?.trim() || props.pickerLinkedName?.trim() || "未命名实验"}
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700">
                  {props.pickerSelectedStandardRow?.subjectLabel?.trim() || "-"}
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700">
                  {props.pickerSelectedStandardRow?.phaseLabel?.trim() || "-"}
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-700">
                  {props.pickerSelectedStandardRow?.gradeLabels?.length ? props.pickerSelectedStandardRow.gradeLabels.join("、") : "-"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          暂未关联实验，选择后会在这里以表格形式显示。
        </div>
      )}
      <ExperimentPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        curriculumTable={props.pickerTable}
        curriculumTableRowsLength={props.pickerRowsLength}
        selectedStandardId={props.pickerSelectedStandardId}
        useCustomExperiment={props.pickerUseCustomExp}
        linkedStandardName={props.pickerLinkedName}
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
        onConfirm={props.onPickerConfirm}
        setPhase={props.onPickerSetPhase}
        setDiscipline={props.onPickerSetDiscipline}
        setSelectedGradeCodes={props.onPickerSetSelectedGradeCodes}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={props.onAutoFillBasic}>
          自动填写基础信息
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={props.onAutoFillAll}>
          自动填写全部内容
        </Button>
      </div>
    </div>
  );
}
