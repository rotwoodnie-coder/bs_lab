import * as React from "react";

import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bs-lab/ui";

import { SUBJECT_CASCADE } from "@/data/subject-tree";
import type { ApiActor } from "@/lib/new-core-api";
import { fetchEduTextbookTree, fetchEduTextbooks, type CoursebookTreeChapter } from "@/lib/edu-textbooks-api";
import type { SubjectDiscipline } from "@/types/subject";

import type { PhaseKey } from "../types";

type Props = {
  actor: ApiActor;
  disabled: boolean;
  phase: PhaseKey;
  setPhase: (v: PhaseKey) => void;
  discipline: SubjectDiscipline;
  setDiscipline: (v: SubjectDiscipline) => void;
  selectedGradeCodes: string[];
  setSelectedGradeCodes: React.Dispatch<React.SetStateAction<string[]>>;
  coursebookId: string;
  setCoursebookId: (v: string) => void;
  unitId: string;
  setUnitId: (v: string) => void;
};

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
  // 当前选中的 chapterId（仅 UI 中间态，不持久化到 DB）
  const [selectedChapterId, setSelectedChapterId] = React.useState("");

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
      setSelectedChapterId("");
      return;
    }
    void (async () => {
      try {
        const tree = await fetchEduTextbookTree(props.actor, bid);
        if (cancelled) return;
        setChapters(tree);
        // 如果当前选中的 unitId 对应某个 chapter，自动选中该 chapter
        if (props.unitId.trim()) {
          for (const ch of tree) {
            const hasUnit = (ch.units ?? []).some((u) => u.unitId === props.unitId);
            if (hasUnit) {
              setSelectedChapterId(ch.chapterId);
              break;
            }
          }
        }
      } catch {
        if (!cancelled) setChapters([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [props.actor, props.coursebookId, props.unitId]);

  const chapterOptions = React.useMemo(
    () => chapters.map((ch) => ({ id: ch.chapterId, label: ch.chapterName })),
    [chapters],
  );

  // 当前选中章下的节
  const unitOptions = React.useMemo(() => {
    if (!selectedChapterId) return [];
    const ch = chapters.find((c) => c.chapterId === selectedChapterId);
    return (ch?.units ?? []).map((u) => ({ id: u.unitId, label: u.unitName }));
  }, [chapters, selectedChapterId]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="grid gap-2">
          <Label>教材（落库）</Label>
          <Select
            value={props.coursebookId.trim() ? props.coursebookId : "__none__"}
            onValueChange={(v) => {
              const next = v === "__none__" ? "" : v;
              props.setCoursebookId(next);
              // 切换教材后，章节和小节选择清空
              setSelectedChapterId("");
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
          <Label>章（落库）</Label>
          <Select
            value={selectedChapterId || "__none__"}
            onValueChange={(v) => {
              setSelectedChapterId(v === "__none__" ? "" : v);
              // 切换章后，节清空
              props.setUnitId("");
            }}
            disabled={props.disabled || !props.coursebookId.trim()}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={props.coursebookId.trim() ? "选择章" : "请先选择教材"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">请选择章</SelectItem>
              {chapterOptions.map((ch) => (
                <SelectItem key={ch.id} value={ch.id}>
                  {ch.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">中间层级，辅助筛选节。</p>
        </div>
        <div className="grid gap-2">
          <Label>节（落库）</Label>
          <Select
            value={props.unitId.trim() ? props.unitId : "__none__"}
            onValueChange={(v) => props.setUnitId(v === "__none__" ? "" : v)}
            disabled={props.disabled || !selectedChapterId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={selectedChapterId ? "选择节" : "请先选择章"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">请选择节</SelectItem>
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
    </div>
  );
}
