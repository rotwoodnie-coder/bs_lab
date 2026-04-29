import * as React from "react";

import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bs-lab/ui";

import { SUBJECT_CASCADE } from "@/data/subject-tree";
import type { ApiActor } from "@/lib/new-core-api";
import { fetchEduTextbookTree, fetchEduTextbooks, type CoursebookTreeChapter } from "@/lib/edu-textbooks-api";
import type { SubjectDiscipline } from "@/types/subject";

import type { PhaseKey } from "../types";

const LESSON_PERIOD_PRESETS = ["0.5课时", "1课时", "1.5课时", "2课时", "2.5课时", "3课时", "4课时", "5课时", "6课时"] as const;

type Props = {
  actor: ApiActor;
  disabled: boolean;
  phase: PhaseKey;
  setPhase: (v: PhaseKey) => void;
  discipline: SubjectDiscipline;
  setDiscipline: (v: SubjectDiscipline) => void;
  selectedGradeCodes: string[];
  setSelectedGradeCodes: React.Dispatch<React.SetStateAction<string[]>>;
  textbookVersion: string;
  setTextbookVersion: (v: string) => void;
  teachingUnit: string;
  setTeachingUnit: (v: string) => void;
  lessonPeriod: string;
  setLessonPeriod: (v: string) => void;
  coursebookId: string;
  setCoursebookId: (v: string) => void;
  unitId: string;
  setUnitId: (v: string) => void;
};

function lessonPeriodSelectValue(lesson: string): string {
  const t = lesson.trim();
  if (!t) return "__none__";
  return (LESSON_PERIOD_PRESETS as readonly string[]).includes(t) ? t : "__custom__";
}

export function TeachingContextStructuredFields(props: Props) {
  const phaseOption = React.useMemo(() => SUBJECT_CASCADE.find((item) => item.phase === props.phase), [props.phase]);
  const disciplineOptions = React.useMemo(() => phaseOption?.disciplines ?? [], [phaseOption]);
  const gradeOptions = React.useMemo(() => {
    const hit = disciplineOptions.find((item) => item.discipline === props.discipline);
    return hit?.grades ?? [];
  }, [disciplineOptions, props.discipline]);

  const gradeSelectValue = props.selectedGradeCodes[0] ?? "__none__";

  const [coursebooks, setCoursebooks] = React.useState<Array<{ id: string; title: string }>>([]);
  const [chapters, setChapters] = React.useState<CoursebookTreeChapter[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const items = await fetchEduTextbooks(props.actor);
        if (cancelled) return;
        setCoursebooks(items.map((x) => ({ id: x.id, title: x.title })));
      } catch {
        if (!cancelled) setCoursebooks([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [props.actor]);

  React.useEffect(() => {
    let cancelled = false;
    const bid = props.coursebookId.trim();
    if (!bid) {
      setChapters([]);
      return;
    }
    void (async () => {
      try {
        const tree = await fetchEduTextbookTree(props.actor, bid);
        if (cancelled) return;
        setChapters(tree);
      } catch {
        if (!cancelled) setChapters([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [props.actor, props.coursebookId]);

  const unitOptions = React.useMemo(() => {
    const out: Array<{ id: string; label: string }> = [];
    for (const ch of chapters) {
      for (const u of ch.units ?? []) {
        out.push({ id: u.unitId, label: `${ch.chapterName} · ${u.unitName}` });
      }
    }
    return out;
  }, [chapters]);

  const onLessonSelect = React.useCallback(
    (v: string) => {
      if (v === "__none__") props.setLessonPeriod("");
      else if (v === "__custom__") props.setLessonPeriod("");
      else props.setLessonPeriod(v);
    },
    [props.setLessonPeriod],
  );

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-2">
          <Label>学段</Label>
          <Select
            value={props.phase}
            onValueChange={(v) => props.setPhase(v as PhaseKey)}
            disabled={props.disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择学段" />
            </SelectTrigger>
            <SelectContent>
              {SUBJECT_CASCADE.map((item) => (
                <SelectItem key={item.phase} value={item.phase}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>学科</Label>
          <Select
            value={props.discipline}
            onValueChange={(v) => props.setDiscipline(v as SubjectDiscipline)}
            disabled={props.disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择学科" />
            </SelectTrigger>
            <SelectContent>
              {disciplineOptions.map((item) => (
                <SelectItem key={item.discipline} value={item.discipline}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>年级</Label>
          <Select
            value={gradeSelectValue}
            onValueChange={(v) => {
              if (v === "__none__") props.setSelectedGradeCodes([]);
              else props.setSelectedGradeCodes([v]);
            }}
            disabled={props.disabled || gradeOptions.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择年级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">请选择年级</SelectItem>
              {gradeOptions.map((g) => (
                <SelectItem key={g.code} value={g.code}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {props.selectedGradeCodes.length > 1 ? (
            <p className="text-xs text-muted-foreground">基本信息中为多选年级时，此处以下拉首项展示；在此重选后将改为单年级。</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label>课时</Label>
          <Select value={lessonPeriodSelectValue(props.lessonPeriod)} onValueChange={onLessonSelect} disabled={props.disabled}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择课时" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">请选择课时</SelectItem>
              {LESSON_PERIOD_PRESETS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
              <SelectItem value="__custom__">其他（手填）</SelectItem>
            </SelectContent>
          </Select>
          {lessonPeriodSelectValue(props.lessonPeriod) === "__custom__" ? (
            <Input
              value={props.lessonPeriod}
              onChange={(e) => props.setLessonPeriod(e.target.value)}
              disabled={props.disabled}
              placeholder="请输入课时说明"
            />
          ) : null}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>教材（落库）</Label>
          <Select
            value={props.coursebookId.trim() ? props.coursebookId : "__none__"}
            onValueChange={(v) => {
              const next = v === "__none__" ? "" : v;
              props.setCoursebookId(next);
              // 切换教材后，小节选择清空，避免跨教材脏数据
              props.setUnitId("");
            }}
            disabled={props.disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择教材（/v2/coursebook）" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">请选择教材</SelectItem>
              {coursebooks.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">保存到 exp_msg.coursebook_id。</p>
        </div>
        <div className="grid gap-2">
          <Label>教材小节（落库）</Label>
          <Select
            value={props.unitId.trim() ? props.unitId : "__none__"}
            onValueChange={(v) => props.setUnitId(v === "__none__" ? "" : v)}
            disabled={props.disabled || !props.coursebookId.trim()}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={props.coursebookId.trim() ? "选择小节（/v2/coursebook/:id/tree）" : "请先选择教材"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">请选择小节</SelectItem>
              {unitOptions.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">保存到 exp_msg.unit_id。</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="tc-textbook-version">教材版本</Label>
          <Input
            id="tc-textbook-version"
            value={props.textbookVersion}
            onChange={(e) => props.setTextbookVersion(e.target.value)}
            disabled={props.disabled}
            placeholder="如：人教版高中物理必修第三册"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tc-unit">单元</Label>
          <Input
            id="tc-unit"
            value={props.teachingUnit}
            onChange={(e) => props.setTeachingUnit(e.target.value)}
            disabled={props.disabled}
            placeholder="如：第九章第2节"
          />
        </div>
      </div>
    </div>
  );
}
