import * as React from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bs-lab/ui";
import { BookOpen } from "@bs-lab/ui/icons";
import { firstImageSrcFromHtml, plainTextFromHtml } from "@/components/business/rich-html-editor/word-html-sanitize";
import type { ApiActor } from "@/lib/new-core-api";
import type { V2DictGradeItem, V2DictItem } from "@/lib/v2/v2-exp-api";
import type { EducationPhase, SubjectDiscipline } from "@/types/subject";

import { EditorBasicSettingsRow } from "./EditorBasicSettingsRow";
import { EditorExpPickerBar } from "./EditorExpPickerBar";
import { EditorMainVideoSection } from "./EditorMainVideoSection";
import { EditorPrincipleSection } from "./EditorPrincipleSection";

type DifficultyOption = {
  id: string;
  name: string;
};

export function EditorBasicSection(props: {
  mediaActor: ApiActor;
  expandedSectionId: string;
  onNavigateAnchor: (id: string) => void;
  fieldDisabled: boolean;
  creatorName: string;
  expName: string;
  setExpName: (v: string) => void;
  principle: string;
  setPrinciple: (v: string) => void;
  principleImage: string;
  setPrincipleImage: (v: string) => void;
  principleVideo: string;
  setPrincipleVideo: (v: string) => void;
  principleEmbeds: Array<{ id: string; kind: "image" | "video"; src: string; caption?: string }>;
  setPrincipleEmbeds: (next: Array<{ id: string; kind: "image" | "video"; src: string; caption?: string }>) => void;
  summary: string;
  setSummary: (v: string) => void;
  subjectId: string | null;
  setSubjectId: (v: string | null) => void;
  schoolLevelId: string | null;
  setSchoolLevelId: (v: string | null) => void;
  gradeId: string | null;
  setGradeId: (v: string | null) => void;
  simulatorUrl: string;
  setSimulatorUrl: (v: string) => void;
  pickerTable: unknown;
  pickerRowsLength: number;
  pickerSelectedStandardId: string | null;
  pickerSelectedStandardRow?: {
    title?: string;
    workflowStatus?: string | null;
    subjectLabel?: string;
    phaseLabel?: string;
    gradeLabels?: string[];
    curriculumRefShort?: string;
  } | null;
  pickerUseCustomExp: boolean;
  pickerListFilterPhases: EducationPhase[];
  onPickerSetListFilterPhases: React.Dispatch<React.SetStateAction<EducationPhase[]>>;
  pickerListFilterDisciplines: SubjectDiscipline[];
  onPickerSetListFilterDisciplines: React.Dispatch<React.SetStateAction<SubjectDiscipline[]>>;
  pickerListFilterGradeCodes: string[];
  onPickerSetListFilterGradeCodes: React.Dispatch<React.SetStateAction<string[]>>;
  pickerListDisciplineOptions: { id: SubjectDiscipline; label: string }[];
  pickerListGradeOptions: { code: string; label: string }[];
  schoolLevelOptions?: V2DictItem[];
  gradeSubjectMap?: { id: string; subjectId: string; gradeId: string }[];
  pickerListFilterPhaseLabels: string;
  pickerListFilterDisciplineSummary: string;
  pickerListFilterGradeSummary: string;
  pickerSearchKeyword: string;
  onPickerSearch: (keyword: string) => void;
  onPickerSetSelectedStandardId: (v: string | null) => void;
  onPickerSetUseCustomExp: (v: boolean) => void;
  onPickerSetCurriculum: (v: string) => void;
  onPickerConfirm: (meta: { expId: string; expName: string }) => void | Promise<void>;
  onAutoFillBasic?: () => void | Promise<void>;
  onAutoFillAll?: () => void | Promise<void>;
  onPickerSetPhase: (v: EducationPhase) => void;
  onPickerSetDiscipline: (v: SubjectDiscipline) => void;
  onPickerSetSelectedGradeCodes: React.Dispatch<React.SetStateAction<string[]>>;
  debugExperimentRawText?: string;
  subjectOptions?: V2DictItem[];
  gradeDictOptions?: V2DictGradeItem[];
  selectedGradeCodes: string[];
  setSelectedGradeCodes: React.Dispatch<React.SetStateAction<string[]>>;
  gradeOptions: Array<{ id: string; code: string; label: string; levelId?: string }>;
  disciplineLabel: string;
  difficultyId: string;
  onDifficultyIdChange: (v: string) => void;
  difficultyOptions: DifficultyOption[];
  difficultyLoading: boolean;
  chooseType: "y" | "n" | null;
  setChooseType: (v: "y" | "n" | null) => void;
  expTaskType: "hw" | "tk" | "self" | null;
  onExpTaskTypeChange: (v: "hw" | "tk" | "self" | null) => void;
  expTaskTypeDisabled: boolean;
  mainVideoUrl: string;
  setMainVideoUrl: (v: string) => void;
  mainVideoEmbeds: Array<{ id: string; kind: "video"; src: string; caption?: string }>;
  setMainVideoEmbeds: (next: Array<{ id: string; kind: "video"; src: string; caption?: string }>) => void;
  onMainVideoIdChange?: (registryId: string | null) => void;
  userId: string;
  expId: string | null;
}) {
  const subjectOptionValue = React.useMemo(() => (props.subjectId?.trim() ? props.subjectId.trim() : "__none__"), [props.subjectId]);
  const phaseOptionValue = React.useMemo(() => (props.schoolLevelId?.trim() ? props.schoolLevelId.trim() : "__none__"), [props.schoolLevelId]);
  const phaseOptions = React.useMemo(
    () => props.schoolLevelOptions ?? [],
    [props.schoolLevelOptions],
  );
  const subjectOptions = React.useMemo(
    () => props.subjectOptions ?? [],
    [props.subjectOptions],
  );
  const gradeOptions = React.useMemo(
    () => props.gradeOptions ?? [],
    [props.gradeOptions],
  );
  const gradeSubjectMap = React.useMemo(() => props.gradeSubjectMap ?? [], [props.gradeSubjectMap]);

  const allowedGradeIds = React.useMemo(() => {
    const subjectId = subjectOptionValue === "__none__" ? null : subjectOptionValue;
    const levelId = phaseOptionValue === "__none__" ? null : phaseOptionValue;
    if (!subjectId || !levelId) return new Set<string>();

    const matched = new Set<string>();
    for (const rel of gradeSubjectMap) {
      if (rel.subjectId !== subjectId) continue;
      const grade = gradeOptions.find((g) => g.id === rel.gradeId);
      if (!grade) continue;
      if (grade.levelId && String(grade.levelId).trim() !== levelId) continue;
      matched.add(rel.gradeId);
    }
    return matched;
  }, [gradeOptions, gradeSubjectMap, phaseOptionValue, subjectOptionValue]);
  const visibleGradeOptions = React.useMemo(() => gradeOptions.filter((g) => allowedGradeIds.has(g.id)), [allowedGradeIds, gradeOptions]);

  const onPickSubjectId = React.useCallback(
    (next: string) => {
      const subjectId = next === "__none__" ? null : next;
      props.setSubjectId(subjectId);
      props.setSelectedGradeCodes((prev) => prev.filter((code) => visibleGradeOptions.some((g) => g.code === code)));
      if (!subjectId) props.setGradeId(null);
    },
    [props, visibleGradeOptions],
  );

  const onPickPhase = React.useCallback(
    (next: string) => {
      const phase = next === "__none__" ? null : next;
      props.setSchoolLevelId(phase);
      props.setSelectedGradeCodes((prev) => prev.filter((code) => visibleGradeOptions.some((g) => g.code === code)));
      if (!phase) props.setGradeId(null);
    },
    [props, visibleGradeOptions],
  );

  const onPrincipleHtmlChange = React.useCallback(
    (html: string) => {
      props.setPrinciple(html);
      props.setSummary(plainTextFromHtml(html).slice(0, 500));
      props.setPrincipleEmbeds([]);
      props.setPrincipleImage(firstImageSrcFromHtml(html));
    },
    [props],
  );

  const handleMainVideoChange = React.useCallback(
    (embeds: Array<{ id: string; kind: "video"; src: string; caption?: string }>, url: string) => {
      props.setMainVideoEmbeds(embeds);
      props.setMainVideoUrl(url);
    },
    [props],
  );

  const handleExpNameOcr = React.useCallback((title: string) => props.setExpName(title), [props]);
  const handleGradeOcr = React.useCallback(
    (gradeId: string, schoolLevelId: string) => {
      props.setGradeId(gradeId);
      props.setSchoolLevelId(schoolLevelId);
    },
    [props],
  );

  return (
    <Card id="basic" className="rounded-[28px] border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="size-4 text-muted-foreground" />
          基础信息
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-12">
        <EditorExpPickerBar
          fieldDisabled={props.fieldDisabled}
          pickerSelectedStandardId={props.pickerSelectedStandardId}
          pickerTable={props.pickerTable}
          pickerRowsLength={props.pickerRowsLength}
          pickerUseCustomExp={props.pickerUseCustomExp}
          pickerListFilterPhases={props.pickerListFilterPhases}
          onPickerSetListFilterPhases={props.onPickerSetListFilterPhases}
          pickerListFilterDisciplines={props.pickerListFilterDisciplines}
          onPickerSetListFilterDisciplines={props.onPickerSetListFilterDisciplines}
          pickerListFilterGradeCodes={props.pickerListFilterGradeCodes}
          onPickerSetListFilterGradeCodes={props.onPickerSetListFilterGradeCodes}
          pickerListDisciplineOptions={props.pickerListDisciplineOptions}
          pickerListGradeOptions={props.pickerListGradeOptions}
          pickerListFilterPhaseLabels={props.pickerListFilterPhaseLabels}
          pickerListFilterDisciplineSummary={props.pickerListFilterDisciplineSummary}
          pickerListFilterGradeSummary={props.pickerListFilterGradeSummary}
          pickerSearchKeyword={props.pickerSearchKeyword}
          onPickerSearch={props.onPickerSearch}
          onPickerSetSelectedStandardId={props.onPickerSetSelectedStandardId}
          onPickerSetUseCustomExp={props.onPickerSetUseCustomExp}
          onPickerSetCurriculum={props.onPickerSetCurriculum}
          onPickerConfirm={props.onPickerConfirm}
          onAutoFillBasic={props.onAutoFillBasic}
          onAutoFillAll={props.onAutoFillAll}
          onPickerSetPhase={props.onPickerSetPhase}
          onPickerSetDiscipline={props.onPickerSetDiscipline}
          onPickerSetSelectedGradeCodes={props.onPickerSetSelectedGradeCodes}
        />

        <EditorMainVideoSection
          mediaActor={props.mediaActor}
          fieldDisabled={props.fieldDisabled}
          mainVideoEmbeds={props.mainVideoEmbeds}
          mainVideoUrl={props.mainVideoUrl}
          onMainVideoChange={handleMainVideoChange}
          onMainVideoIdChange={props.onMainVideoIdChange}
          gradeDictOptions={props.gradeDictOptions}
          expId={props.expId}
          userId={props.userId}
          onExpNameOcr={handleExpNameOcr}
          onGradeOcr={handleGradeOcr}
        />

        <div className="flex items-center gap-2 lg:col-span-4">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {props.creatorName.charAt(0).toUpperCase() || "U"}
          </div>
          <span className="text-sm text-muted-foreground">
            创建人：<span className="text-foreground font-medium">{props.creatorName}</span>
          </span>
        </div>

        <div className="grid gap-4 lg:col-span-12 lg:grid-cols-2">
          <div className="grid gap-2">
            <Label>学段</Label>
            <Select value={phaseOptionValue} onValueChange={onPickPhase} disabled={props.fieldDisabled}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="学段" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">未选择</SelectItem>
                {phaseOptions.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>学科</Label>
            <Select value={subjectOptionValue} onValueChange={onPickSubjectId} disabled={props.fieldDisabled}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="学科" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">未选择</SelectItem>
                {(props.subjectOptions ?? []).map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2 lg:col-span-12">
          <Label>年级（可多选）</Label>
          <p className="text-xs text-slate-500">会根据当前学段和学科过滤可选年级</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(visibleGradeOptions ?? []).map((g) => {
              const active = props.selectedGradeCodes.includes(g.code);
              return (
                <label
                  key={g.code}
                  className={
                    active
                      ? "flex cursor-pointer items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm"
                      : "flex cursor-pointer items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-sm"
                  }
                >
                  <Checkbox
                    checked={active}
                    disabled={props.fieldDisabled || phaseOptionValue === "__none__"}
                    onCheckedChange={() => {
                      props.setSelectedGradeCodes((prev) =>
                        active ? prev.filter((c) => c !== g.code) : [...prev, g.code],
                      );
                    }}
                  />
                  <span>{g.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2 lg:col-span-12">
          <Label htmlFor="exp-title">实验名称</Label>
          <Input
            id="exp-title"
            value={props.expName}
            onChange={(e) => props.setExpName(e.target.value)}
            disabled={props.fieldDisabled}
            placeholder="请输入实验名称"
          />
        </div>

        <EditorBasicSettingsRow
          chooseType={props.chooseType}
          fieldDisabled={props.fieldDisabled}
          onChooseTypeChange={props.setChooseType}
          expTaskType={props.expTaskType}
          expTaskTypeDisabled={props.expTaskTypeDisabled}
          onExpTaskTypeChange={props.onExpTaskTypeChange}
          difficultyId={props.difficultyId}
          onDifficultyIdChange={props.onDifficultyIdChange}
          difficultyOptions={props.difficultyOptions}
          difficultyLoading={props.difficultyLoading}
          simulatorUrl={props.simulatorUrl}
          onSimulatorUrlChange={props.setSimulatorUrl}
        />

        <EditorPrincipleSection
          mediaActor={props.mediaActor}
          fieldDisabled={props.fieldDisabled}
          principle={props.principle}
          onPrincipleHtmlChange={onPrincipleHtmlChange}
        />
      </CardContent>
    </Card>
  );
}
