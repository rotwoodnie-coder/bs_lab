"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, type RichMediaEmbed, type RichMediaValue } from "@bs-lab/ui";

import type { ApiActor } from "@/lib/new-core-api";
import type { SubjectDiscipline } from "@/types/subject";

import { StepContentRichEditor } from "../StepContentRichEditor";
import { TeachingContextBulkInput } from "../TeachingContextBulkInput";
import { TeachingContextStructuredFields } from "../TeachingContextStructuredFields";

import type { PhaseKey } from "../../types";
import type { ParsedTeachingContextBulk } from "../../utils/parse-teaching-context-bulk";

export function EditorTeachingContextSection(props: {
  fieldDisabled: boolean;
  mediaActor: ApiActor;
  phase: PhaseKey;
  setPhase: React.Dispatch<React.SetStateAction<PhaseKey>>;
  discipline: SubjectDiscipline;
  setDiscipline: React.Dispatch<React.SetStateAction<SubjectDiscipline>>;
  selectedGradeCodes: string[];
  setSelectedGradeCodes: React.Dispatch<React.SetStateAction<string[]>>;
  phaseLabel: string;
  disciplineLabel: string;
  selectedGradeLabels: string[];
  title: string;
  summary: string;
  curriculum: string;
  teachingContextContent: string;
  teachingContextEmbeds: RichMediaEmbed[];
  onTeachingContextRichChange: (next: RichMediaValue) => void;
  teachingRefTextbookVersion: string;
  setTeachingRefTextbookVersion: React.Dispatch<React.SetStateAction<string>>;
  teachingRefUnit: string;
  setTeachingRefUnit: React.Dispatch<React.SetStateAction<string>>;
  teachingRefLessonPeriod: string;
  setTeachingRefLessonPeriod: React.Dispatch<React.SetStateAction<string>>;
  coursebookId: string;
  setCoursebookId: React.Dispatch<React.SetStateAction<string>>;
  unitId: string;
  setUnitId: React.Dispatch<React.SetStateAction<string>>;
}) {
  const mergeSourceText = React.useMemo(
    () =>
      [
        props.title,
        props.summary,
        props.curriculum,
        props.phaseLabel,
        props.disciplineLabel,
        props.selectedGradeLabels.length ? props.selectedGradeLabels.join("、") : "",
      ]
        .filter((s) => s.trim().length > 0)
        .join("\n"),
    [props.title, props.summary, props.curriculum, props.phaseLabel, props.disciplineLabel, props.selectedGradeLabels],
  );

  const applyParsed = React.useCallback(
    (parsed: ParsedTeachingContextBulk) => {
      props.setTeachingRefTextbookVersion((v) => parsed.textbookVersion || v);
      props.setTeachingRefUnit((v) => parsed.unit || v);
      props.setTeachingRefLessonPeriod((v) => parsed.lessonPeriod || v);
    },
    [props.setTeachingRefLessonPeriod, props.setTeachingRefTextbookVersion, props.setTeachingRefUnit],
  );

  return (
    <Card id="teachingContext" className="rounded-[28px] border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] scroll-mt-24">
      <CardHeader>
        <CardTitle className="text-base">对照教材</CardTitle>
        <CardDescription>
          学段、学科、年级、课时下拉可在此修改，并与「实验基本信息」共用同一套选项与状态；教材版本、单元可手工填写或通过综合录入识别。
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <TeachingContextStructuredFields
          actor={props.mediaActor}
          disabled={props.fieldDisabled}
          phase={props.phase}
          setPhase={props.setPhase}
          discipline={props.discipline}
          setDiscipline={props.setDiscipline}
          selectedGradeCodes={props.selectedGradeCodes}
          setSelectedGradeCodes={props.setSelectedGradeCodes}
          textbookVersion={props.teachingRefTextbookVersion}
          setTextbookVersion={props.setTeachingRefTextbookVersion}
          teachingUnit={props.teachingRefUnit}
          setTeachingUnit={props.setTeachingRefUnit}
          lessonPeriod={props.teachingRefLessonPeriod}
          setLessonPeriod={props.setTeachingRefLessonPeriod}
          coursebookId={props.coursebookId}
          setCoursebookId={props.setCoursebookId}
          unitId={props.unitId}
          setUnitId={props.setUnitId}
        />
        <TeachingContextBulkInput
          disabled={props.fieldDisabled}
          mergeSourceText={mergeSourceText}
          teachingRichPlainText={props.teachingContextContent}
          onApplyParsed={applyParsed}
        />
        <StepContentRichEditor
          mediaActor={props.mediaActor}
          disabled={props.fieldDisabled}
          content={props.teachingContextContent}
          contentEmbeds={props.teachingContextEmbeds}
          onChange={props.onTeachingContextRichChange}
          editorTitle="对照教材说明"
          contentPlaceholder="例如：页码、插图说明，以及与本实验对应的课标条目补充……"
        />
      </CardContent>
    </Card>
  );
}
