"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Spinner,
  Switch,
} from "@bs-lab/ui";

import { generateSubjectCodeFromName } from "../subject-code-map";
import type { EduGrade, GradeDrawerModel, SubjectCardRow } from "../page.types";

function moveRelation(ids: string[], from: number, to: number): string[] {
  const next = [...ids];
  const [item] = next.splice(from, 1);
  if (!item) return ids;
  next.splice(to, 0, item);
  return next;
}

export function EduSubjectBoard(props: {
  loading: boolean;
  /** 展示用：当前选中学段（`data_school_level.level_name`） */
  levelName: string;
  rows: SubjectCardRow[];
  query: string;
  sortingSubject: boolean;
  selectedLinkKey: string;
  gradeEditorModel: GradeDrawerModel | null;
  levelGrades: EduGrade[];
  savingGrades: boolean;
  allSubjects: Array<{ id: string; name: string; code: string }>;
  onQueryChange: (value: string) => void;
  onOpenGradesEditor: (linkKey: string) => void;
  onCloseGradesEditor: () => void;
  onGradeModelChange: (next: GradeDrawerModel) => void;
  onSaveGrades: () => void;
  onAddSubject: (payload: { subject_name: string; subject_id: string }) => void;
  onToggleStatus: (linkKey: string, next: 0 | 1) => void;
  /** `linkKey` 顺序，与 {@link LevelSubjectSummary.linkKey} 一致 */
  onReorder: (linkKeysInOrder: string[]) => void;
}) {
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [newSubjectName, setNewSubjectName] = React.useState("");
  const [newSubjectCode, setNewSubjectCode] = React.useState("");
  const [codeTouched, setCodeTouched] = React.useState(false);

  const idsInView = React.useMemo(() => props.rows.map((row) => row.linkKey), [props.rows]);

  const onDropAt = React.useCallback(
    (toIndex: number) => {
      if (dragIndex === null || dragIndex === toIndex) return;
      props.onReorder(moveRelation(idsInView, dragIndex, toIndex));
      setDragIndex(null);
    },
    [dragIndex, idsInView, props],
  );

  const selectedGradeSet = React.useMemo(
    () => new Set(props.gradeEditorModel?.selectedGradeIds ?? []),
    [props.gradeEditorModel?.selectedGradeIds],
  );

  const onToggleGrade = React.useCallback(
    (gradeId: string, checked: boolean) => {
      if (!props.gradeEditorModel) return;
      const nextSet = new Set(selectedGradeSet);
      if (checked) nextSet.add(gradeId);
      else nextSet.delete(gradeId);
      props.onGradeModelChange({ ...props.gradeEditorModel, selectedGradeIds: [...nextSet] });
    },
    [props, selectedGradeSet],
  );

  const normalizedName = newSubjectName.trim();
  const normalizedCode = newSubjectCode.trim().toUpperCase();
  const duplicateName = props.allSubjects.some((item) => item.name.trim() === normalizedName);
  const duplicateCode = props.allSubjects.some((item) => item.code.trim().toUpperCase() === normalizedCode);
  const codeFormatValid = /^[A-Z0-9_]+$/.test(normalizedCode || "_");
  const addDisabled =
    !normalizedName || !normalizedCode || duplicateName || duplicateCode || !codeFormatValid;

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            关联学科
            <Badge variant="outline">{props.levelName || "未选择学段"}</Badge>
            {props.sortingSubject ? <Spinner className="size-4" /> : null}
          </CardTitle>
          <div className="flex items-center gap-2">
            {adding ? (
              <>
                <Input
                  value={newSubjectName}
                  onChange={(event) => {
                    const nextName = event.target.value;
                    setNewSubjectName(nextName);
                    if (!codeTouched) {
                      setNewSubjectCode(generateSubjectCodeFromName(nextName));
                    }
                  }}
                  placeholder="学科名称，如 地理"
                  className="h-8 w-40 text-xs"
                />
                <Input
                  value={newSubjectCode}
                  onChange={(event) => {
                    setCodeTouched(true);
                    setNewSubjectCode(event.target.value.toUpperCase());
                  }}
                  placeholder="编码，如 SUB_GEOGRAPHY"
                  className="h-8 w-44 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={addDisabled}
                  onClick={() => {
                    if (addDisabled) return;
                    props.onAddSubject({ subject_name: normalizedName, subject_id: normalizedCode });
                    setNewSubjectName("");
                    setNewSubjectCode("");
                    setCodeTouched(false);
                    setAdding(false);
                  }}
                >
                  确认
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAdding(false);
                    setNewSubjectName("");
                    setNewSubjectCode("");
                    setCodeTouched(false);
                  }}
                >
                  取消
                </Button>
                <div className="text-[11px] text-muted-foreground">
                  {duplicateName
                    ? "学科名称重复"
                    : duplicateCode
                      ? "学科编码重复"
                      : !codeFormatValid
                        ? "编码仅支持 A-Z/0-9/_"
                        : ""}
                </div>
              </>
            ) : (
              <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)}>
                新增学科
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">影子关联提示：修改学科信息会影响所有关联该学科的学段，请谨慎操作。</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={props.query}
          onChange={(event) => props.onQueryChange(event.target.value)}
          placeholder="搜索学科名称或编码"
          className="max-w-sm"
        />

        {props.loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">学科列表加载中...</div>
        ) : (
          <div className="space-y-2">
            {props.rows.map((row, index) => (
              <div key={row.linkKey} className="space-y-2">
                <div
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => onDropAt(index)}
                  className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2"
                >
                  <span className="w-6 text-xs text-muted-foreground">{index + 1}</span>
                  <img src={`/${row.subjectIconPath}`} alt={row.subjectName} className="size-5 text-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-foreground">{row.subjectName}</div>
                    <div className="text-xs text-muted-foreground">{row.subjectCode}</div>
                  </div>
                  <Switch
                    checked={row.lineActive === 1}
                    onCheckedChange={(checked) => props.onToggleStatus(row.linkKey, checked ? 1 : 0)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant={props.selectedLinkKey === row.linkKey ? "default" : "outline"}
                    onClick={() => props.onOpenGradesEditor(row.linkKey)}
                  >
                    年级关联
                  </Button>
                </div>
                {props.selectedLinkKey === row.linkKey ? (
                  <div className="ml-9 space-y-3 rounded-md border border-border bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{props.gradeEditorModel?.levelName ?? props.levelName}</Badge>
                    <Badge variant="secondary">{props.gradeEditorModel?.subjectName ?? row.subjectName}</Badge>
                    <span className="text-xs text-muted-foreground">在当前学科下选择可关联年级</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {props.levelGrades.map((grade) => (
                      <label
                        key={grade.id}
                        className="flex items-center gap-2 rounded border border-border bg-background px-2 py-2 text-sm"
                      >
                        <Checkbox
                          checked={selectedGradeSet.has(grade.id)}
                          onCheckedChange={(checked) => onToggleGrade(grade.id, checked === true)}
                        />
                        <span>{grade.name}</span>
                      </label>
                    ))}
                  </div>
                  {props.levelGrades.length === 0 ? (
                    <div className="rounded border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
                      当前学段暂无可关联年级，请先完成学段对应年级设定。
                    </div>
                  ) : null}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={props.onCloseGradesEditor}>
                      取消
                    </Button>
                    <Button
                      type="button"
                      onClick={props.onSaveGrades}
                      disabled={!props.gradeEditorModel || props.savingGrades}
                    >
                      {props.savingGrades ? "保存中..." : "保存"}
                    </Button>
                  </div>
                  </div>
                ) : null}
              </div>
            ))}
            {props.rows.length === 0 ? (
              <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                当前学段暂无可展示学科
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
