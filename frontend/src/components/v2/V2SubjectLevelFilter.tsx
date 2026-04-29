"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bs-lab/ui";
import type { CoreApiActor } from "@/lib/core-api-shared";
import {
  fetchV2SchoolSubjects,
  fetchV2SchoolLevels,
  fetchV2SchoolGrades,
  type V2DictItem,
  type V2DictGradeItem,
} from "@/lib/v2/v2-exp-api";

/** Radix Select 不允许 `value=""`，用哨兵表示「未选 / 全部」。勿与字典 id 冲突。 */
const FILTER_ALL = "__v2_filter_all__";

export interface V2SubjectLevelFilterValue {
  subjectId?: string;
  schoolLevelId?: string;
  gradeId?: string;
}

interface Props {
  actor: CoreApiActor;
  value: V2SubjectLevelFilterValue;
  onChange: (next: V2SubjectLevelFilterValue) => void;
  showGrade?: boolean;
  layout?: "row" | "stack";
}

export function V2SubjectLevelFilter({ actor, value, onChange, showGrade = false, layout = "row" }: Props) {
  const [subjects, setSubjects] = React.useState<V2DictItem[]>([]);
  const [levels, setLevels] = React.useState<V2DictItem[]>([]);
  const [grades, setGrades] = React.useState<V2DictGradeItem[]>([]);

  React.useEffect(() => {
    void fetchV2SchoolSubjects(actor).then(setSubjects).catch(() => {});
    void fetchV2SchoolLevels(actor).then(setLevels).catch(() => {});
    if (showGrade) {
      void fetchV2SchoolGrades(actor).then(setGrades).catch(() => {});
    }
  }, [actor, showGrade]);

  const filteredGrades = value.schoolLevelId
    ? grades.filter((g) => g.levelId === value.schoolLevelId)
    : grades;

  const wrapClass = layout === "row"
    ? "flex flex-wrap gap-2"
    : "flex flex-col gap-2";

  const handleLevelChange = (levelId: string) => {
    onChange({
      ...value,
      schoolLevelId: levelId === FILTER_ALL ? undefined : levelId,
      gradeId: undefined,
    });
  };

  return (
    <div className={wrapClass}>
      <Select
        value={value.subjectId?.trim() ? value.subjectId : FILTER_ALL}
        onValueChange={(v) =>
          onChange({ ...value, subjectId: v === FILTER_ALL ? undefined : v })
        }
      >
        <SelectTrigger className="w-32 min-w-0">
          <SelectValue placeholder="学科" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={FILTER_ALL}>全部学科</SelectItem>
          {subjects.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.schoolLevelId?.trim() ? value.schoolLevelId : FILTER_ALL}
        onValueChange={handleLevelChange}
      >
        <SelectTrigger className="w-32 min-w-0">
          <SelectValue placeholder="学段" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={FILTER_ALL}>全部学段</SelectItem>
          {levels.map((l) => (
            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showGrade && (
        <Select
          value={value.gradeId?.trim() ? value.gradeId : FILTER_ALL}
          onValueChange={(v) =>
            onChange({ ...value, gradeId: v === FILTER_ALL ? undefined : v })
          }
        >
          <SelectTrigger className="w-28 min-w-0">
            <SelectValue placeholder="年级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILTER_ALL}>全部年级</SelectItem>
            {filteredGrades.map((g) => (
              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
