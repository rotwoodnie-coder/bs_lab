"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  RadioGroup,
  RadioGroupItem,
  Switch,
} from "@bs-lab/ui";
import { ChevronDown } from "@bs-lab/ui/icons";

import type { SchoolSystemPayload } from "../page.api";
import type { DataSchoolLevel, EduGrade } from "../page.types";

type GradeDraft = { id: string; grade_name: string; grade_id: string; active_status: 0 | 1 };

export function EduGradeSettingsPanel(props: {
  levels: DataSchoolLevel[];
  grades: EduGrade[];
  levelGradeEnabledMap: Map<string, Set<string>>;
  busy: boolean;
  onApplyScheme: (payload: SchoolSystemPayload) => void;
  onSaveMatrixChanges: (
    rows: Array<{ id: string; grade_name: string; grade_id: string; active_status: 0 | 1; levelId: string }>,
  ) => void;
  onCreateGrade: (payload: { grade_name: string; grade_id: string }) => void;
  onUpdateGrade: (payload: { id: string; grade_name: string; grade_id: string; active_status: 0 | 1 }) => void;
  onDeleteGrade: (gradeId: string) => void;
}) {
  const [newName, setNewName] = React.useState("");
  const [newCode, setNewCode] = React.useState("");
  const [drafts, setDrafts] = React.useState<GradeDraft[]>([]);
  const [scheme, setScheme] = React.useState<"543" | "633">("543");
  const [schemeSectionOpen, setSchemeSectionOpen] = React.useState(false);
  const [assignedLevelDraftByGrade, setAssignedLevelDraftByGrade] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    setDrafts(props.grades.map((g) => ({ id: g.id, grade_name: g.name, grade_id: g.code, active_status: g.status })));
  }, [props.grades]);

  const sortedLevels = React.useMemo(
    () => [...props.levels].sort((a, b) => a.sortOrder - b.sortOrder),
    [props.levels],
  );

  const currentScheme = React.useMemo(() => {
    const has = (levelKey: string, gradeCode: string) => {
      const level = props.levels.find((item) => item.levelId === levelKey);
      if (!level) return false;
      const enabled = props.levelGradeEnabledMap.get(level.levelId) ?? new Set<string>();
      const grade = props.grades.find((item) => item.code === gradeCode);
      return Boolean(grade && enabled.has(grade.id));
    };
    const is543 =
      has("STAGE_PRIMARY", "GRADE_5") &&
      !has("STAGE_PRIMARY", "GRADE_6") &&
      has("STAGE_JUNIOR", "GRADE_6") &&
      has("STAGE_JUNIOR", "GRADE_9");
    const is633 =
      has("STAGE_PRIMARY", "GRADE_6") &&
      has("STAGE_JUNIOR", "GRADE_7") &&
      !has("STAGE_JUNIOR", "GRADE_6");
    if (is543) return { value: "543" as const, text: "当前学制：5-4-3（例如上海）" };
    if (is633) return { value: "633" as const, text: "当前学制：6-3-3（例如江苏、安徽）" };
    return { value: null, text: "当前学制：自定义/混合" };
  }, [props.grades, props.levelGradeEnabledMap, props.levels]);

  React.useEffect(() => {
    if (currentScheme.value) setScheme(currentScheme.value);
  }, [currentScheme.value]);

  const assignedLevelByGrade = React.useMemo(() => {
    const map = new Map<string, string>();
    for (let i = 0; i < drafts.length; i++) {
      const draft = drafts[i];
      if (!draft) continue;
      for (let j = 0; j < sortedLevels.length; j++) {
        const level = sortedLevels[j];
        if (!level) continue;
        const enabled = props.levelGradeEnabledMap.get(level.levelId) ?? new Set<string>();
        if (enabled.has(draft.id)) {
          map.set(draft.id, level.levelId);
          break;
        }
      }
    }
    return map;
  }, [drafts, props.levelGradeEnabledMap, sortedLevels]);

  React.useEffect(() => {
    const next: Record<string, string> = {};
    assignedLevelByGrade.forEach((levelId, gradeId) => {
      next[gradeId] = levelId;
    });
    setAssignedLevelDraftByGrade(next);
  }, [assignedLevelByGrade]);

  const initialDraftById = React.useMemo(() => {
    const map = new Map<string, GradeDraft>();
    props.grades.forEach((g) => map.set(g.id, { id: g.id, grade_name: g.name, grade_id: g.code, active_status: g.status }));
    return map;
  }, [props.grades]);

  const changedGradeIds = React.useMemo(() => {
    const ids = new Set<string>();
    drafts.forEach((draft) => {
      const initial = initialDraftById.get(draft.id);
      if (!initial) return;
      const draftLevel = assignedLevelDraftByGrade[draft.id] ?? "";
      const initialLevel = assignedLevelByGrade.get(draft.id) ?? "";
      const changed =
        draft.grade_name !== initial.grade_name ||
        draft.grade_id !== initial.grade_id ||
        draft.active_status !== initial.active_status ||
        draftLevel !== initialLevel;
      if (changed) ids.add(draft.id);
    });
    return ids;
  }, [assignedLevelByGrade, assignedLevelDraftByGrade, drafts, initialDraftById]);

  const buildSchemePayload = React.useCallback((): SchoolSystemPayload => ({ scheme }), [scheme]);

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="pb-3">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md px-1 py-1 text-left hover:bg-muted/30"
          onClick={() => setSchemeSectionOpen((prev) => !prev)}
          aria-expanded={schemeSectionOpen}
        >
          <CardTitle className="flex items-center gap-2 text-base">
            学制与年级设置
            <span className="text-sm font-normal text-muted-foreground">{currentScheme.text}</span>
            <Badge variant="outline">支持模板切换</Badge>
          </CardTitle>
          <ChevronDown className={`size-4 transition-transform ${schemeSectionOpen ? "rotate-0" : "-rotate-90"}`} />
        </button>
      </CardHeader>
      {schemeSectionOpen ? (
        <CardContent className="space-y-3">
          <div className="rounded-md border border-border bg-muted/10 p-2">
            <div className="mb-2 text-sm text-foreground">学制方案设置（低频）</div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-foreground">学制方案</span>
                <Button type="button" size="sm" variant={scheme === "543" ? "default" : "outline"} onClick={() => setScheme("543")}>
                  5-4-3
                </Button>
                <Button type="button" size="sm" variant={scheme === "633" ? "default" : "outline"} onClick={() => setScheme("633")}>
                  6-3-3
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => props.onApplyScheme(buildSchemePayload())}
                  disabled={props.busy || currentScheme.value === scheme}
                >
                  应用学制方案
                </Button>
                <span className="text-xs text-muted-foreground">
                  {currentScheme.value === scheme ? "当前选择已生效" : "当前为待应用方案"}
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-md border border-border p-2">
            <div className="mb-2 text-sm text-foreground">新增年级</div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="年级名称，如 六年级" />
              <Input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="年级编码，如 GRADE_6" />
              <Button
                type="button"
                onClick={() => {
                  props.onCreateGrade({ grade_name: newName.trim(), grade_id: newCode.trim().toUpperCase() });
                  setNewName("");
                  setNewCode("");
                }}
                disabled={props.busy}
              >
                新增
              </Button>
            </div>
          </div>
          <div className="rounded-md border border-border p-2">
            <div className="mb-2 text-sm text-foreground">学制勾选矩阵（1-12 年级）</div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-separate border-spacing-y-1 text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-2 py-1">年级</th>
                    <th className="px-2 py-1">编码</th>
                    <th className="px-2 py-1 text-center">归属学段（单选）</th>
                    <th className="px-2 py-1 text-center">年级启用</th>
                    <th className="px-2 py-1 text-center">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={props.busy || changedGradeIds.size === 0}
                        onClick={() => {
                          const rows = drafts
                            .filter((draft) => changedGradeIds.has(draft.id))
                            .map((draft) => ({
                              ...draft,
                              levelId: assignedLevelDraftByGrade[draft.id] ?? "",
                            }))
                            .filter((row) => row.levelId);
                          if (!rows.length) return;
                          props.onSaveMatrixChanges(rows);
                        }}
                      >
                        保存全部修改
                      </Button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((draft) => (
                    <tr key={draft.id} className="rounded-md bg-card">
                      <td className="px-2 py-1">
                        <Input
                          value={draft.grade_name}
                          onChange={(e) =>
                            setDrafts((prev) => prev.map((item) => (item.id === draft.id ? { ...item, grade_name: e.target.value } : item)))
                          }
                          placeholder="年级名称"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <Input
                          value={draft.grade_id}
                          onChange={(e) =>
                            setDrafts((prev) =>
                              prev.map((item) => (item.id === draft.id ? { ...item, grade_id: e.target.value.toUpperCase() } : item)),
                            )
                          }
                          placeholder="年级编码"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <RadioGroup
                          value={assignedLevelDraftByGrade[draft.id] ?? ""}
                          onValueChange={(value) => {
                            if (!value) return;
                            setAssignedLevelDraftByGrade((prev) => ({ ...prev, [draft.id]: value }));
                          }}
                          className="flex flex-wrap items-center justify-center gap-3"
                        >
                          {sortedLevels.map((level) => {
                            const radioId = `grade-${draft.id}-level-${level.levelId}`;
                            return (
                              <label key={level.levelId} htmlFor={radioId} className="flex items-center gap-1.5 text-xs text-foreground">
                                <RadioGroupItem id={radioId} value={level.levelId} />
                                {level.levelName}
                              </label>
                            );
                          })}
                        </RadioGroup>
                      </td>
                      <td className="px-2 py-1">
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                          <Switch
                            checked={draft.active_status === 1}
                            onCheckedChange={(checked) =>
                              setDrafts((prev) => prev.map((item) => (item.id === draft.id ? { ...item, active_status: checked ? 1 : 0 } : item)))
                            }
                          />
                        </div>
                      </td>
                      <td className="px-2 py-1">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const levelId = assignedLevelDraftByGrade[draft.id] ?? "";
                              if (!levelId) return;
                              props.onSaveMatrixChanges([{ ...draft, levelId }]);
                            }}
                            disabled={props.busy || !changedGradeIds.has(draft.id)}
                          >
                            保存
                          </Button>
                          <Button type="button" size="sm" variant="destructive" onClick={() => props.onDeleteGrade(draft.id)} disabled={props.busy}>
                            删除
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {drafts.length === 0 ? <div className="py-4 text-center text-sm text-muted-foreground">暂无年级数据</div> : null}
          </div>
          <details className="rounded-md border border-border p-2">
            <summary className="cursor-pointer text-sm text-foreground">展开详细年级维护说明</summary>
            <p className="mt-2 text-xs text-muted-foreground">年级归属为单选：一个年级只能对应一个学段。年级启用表示是否在全系统可用。</p>
          </details>
        </CardContent>
      ) : null}
    </Card>
  );
}
