"use client";

import * as React from "react";
import { Badge, Button, Combobox, type ComboboxOption, Label } from "@bs-lab/ui";
import { Check, Loader2, X } from "@bs-lab/ui/icons";

import { cn } from "@/lib/utils";
import type { V2SysUserItem, V2SysOrgItem } from "@/lib/v2/v2-sys-api";
import type { SubjectOption } from "../page.hooks";
import { resolveSchoolNameFromTree } from "../_lib/teacher-class-org-resolve";
import {
  classesUnderSchoolGrade,
  findOrgNode,
  gradesUnderSchool,
  listSchools,
  schoolComboboxGroupLabel,
} from "../_lib/teacher-config-tree-helpers";

export interface TeacherConfigBodyProps {
  open: boolean;
  teacher: V2SysUserItem;
  /** 学科全量字典（用于主题色/图标备用） */
  subjects: SubjectOption[];
  subjectNameById: Record<string, string>;
  classTree: V2SysOrgItem[];
  classNameById: Record<string, string>;
  relationMap: Record<string, Set<string>>;
  lockedSchoolId?: string | null;
  defaultSchoolOrgId?: string | null;
  defaultSchoolDisplayName?: string | null;
  relationLoading: boolean;
  onAdd: (subjectId: string, classIds: string[]) => void;
  onRemove: (subjectId: string, classOrgId: string) => void;
  // 新：课设配置辅助
  configTeacherSubjects: SubjectOption[];
  configTeacherSubjectsLoading: boolean;
  gradeSubjectMap: Record<string, string[]>;
  conflictSet: Set<string>;
  onReloadConflicts: (gradeId: string) => Promise<void>;
}

// ─── 冲突单元格组件 ──────────────────────────────────────

function ConflictCell({ subjectName }: { subjectName: string }) {
  return (
    <div className="flex items-center justify-center gap-1 rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1.5">
      <X className="size-3 shrink-0 text-destructive" />
      <span className="truncate text-[11px] font-medium text-destructive">{subjectName}</span>
    </div>
  );
}

// ─── 矩阵单元格组件 ──────────────────────────────────────

function MatrixCell({
  checked,
  disabled,
  className,
  cellKey,
  subjectName,
  onToggle,
}: {
  checked: boolean;
  disabled: boolean;
  className: string;
  cellKey: string;
  subjectName: string;
  onToggle: (cellKey: string) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle(cellKey)}
      className={cn(
        "flex items-center justify-center rounded-md border px-2 py-2 text-xs font-medium transition-all",
        disabled && "cursor-not-allowed opacity-50",
        !disabled && !checked && "border-border/70 bg-card hover:border-primary/40 hover:bg-primary/5",
        !disabled && checked && "border-primary/60 bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20",
      )}
      title={disabled ? `${className} 已被其他教师占用` : checked ? `已关联：${className}` : `点击关联：${className}`}
    >
      {disabled ? (
        <X className="size-3.5 text-destructive/70" />
      ) : checked ? (
        <Check className="size-3.5" />
      ) : (
        <span className="inline-block size-3.5 rounded-sm border border-muted-foreground/30" />
      )}
      <span className="ml-1.5 truncate">{className}</span>
    </button>
  );
}

// ─── 主组件 ─────────────────────────────────────────────

export function TeacherConfigBody({
  open,
  teacher,
  subjects: _subjects,
  subjectNameById,
  classTree,
  classNameById,
  relationMap,
  lockedSchoolId,
  defaultSchoolOrgId,
  defaultSchoolDisplayName,
  relationLoading,
  onAdd,
  onRemove,
  configTeacherSubjects,
  configTeacherSubjectsLoading,
  gradeSubjectMap,
  conflictSet,
  onReloadConflicts,
}: TeacherConfigBodyProps) {
  const schools = React.useMemo(() => listSchools(classTree), [classTree]);

  const schoolComboboxOptions = React.useMemo<ComboboxOption[]>(() => {
    const opts = schools.map((s) => ({
      value: s.orgId,
      label: s.orgName,
      group: schoolComboboxGroupLabel(classTree, s.orgId),
    }));
    opts.sort((a, b) => {
      const g = (a.group ?? "").localeCompare(b.group ?? "", "zh-CN");
      if (g !== 0) return g;
      return a.label.localeCompare(b.label, "zh-CN");
    });
    return opts;
  }, [schools, classTree]);

  const showSchoolPicker = React.useMemo(
    () => schools.length > 1 && !lockedSchoolId?.trim() && !defaultSchoolOrgId?.trim(),
    [schools.length, lockedSchoolId, defaultSchoolOrgId],
  );

  const [selectedSchoolId, setSelectedSchoolId] = React.useState("");
  const [selectedGradeId, setSelectedGradeId] = React.useState("");

  // 初始化：打开弹窗时设定学校
  React.useEffect(() => {
    if (!open || !teacher) return;
    const lock = lockedSchoolId?.trim() ?? "";
    const def = defaultSchoolOrgId?.trim() ?? "";
    setSelectedSchoolId(lock || def || (schools.length === 1 ? schools[0]!.orgId : ""));
    setSelectedGradeId("");
  }, [open, teacher.userId, lockedSchoolId, defaultSchoolOrgId, schools]);

  const schoolNode = React.useMemo(
    () => (selectedSchoolId ? findOrgNode(classTree, selectedSchoolId) : null),
    [classTree, selectedSchoolId],
  );

  const gradeOptions = React.useMemo(() => (schoolNode ? gradesUnderSchool(schoolNode) : []), [schoolNode]);

  // 年级选择联动
  React.useEffect(() => {
    if (!open || !teacher) return;
    if (gradeOptions.length === 0) {
      setSelectedGradeId("");
      return;
    }
    setSelectedGradeId((prev) => (prev && gradeOptions.some((g) => g.orgId === prev) ? prev : gradeOptions[0]!.orgId));
  }, [open, teacher.userId, gradeOptions]);

  // 年级切换时加载冲突
  React.useEffect(() => {
    if (selectedGradeId) void onReloadConflicts(selectedGradeId);
  }, [selectedGradeId, onReloadConflicts]);

  const classOptions = React.useMemo(() => {
    if (!schoolNode || !selectedGradeId) return [];
    return classesUnderSchoolGrade(schoolNode, selectedGradeId);
  }, [schoolNode, selectedGradeId]);

  // 构建矩阵：行 = 教师可教学科（过滤年级-学科映射），列 = 班级
  const displaySubjects = React.useMemo(() => {
    if (configTeacherSubjects.length === 0) return [];
    if (!selectedGradeId || !gradeSubjectMap[selectedGradeId]) return configTeacherSubjects;
    const allowedSubjectIds = new Set(gradeSubjectMap[selectedGradeId] ?? []);
    return configTeacherSubjects.filter((s) => allowedSubjectIds.has(s.id));
  }, [configTeacherSubjects, selectedGradeId, gradeSubjectMap]);

  const schoolReadOnlyLabel = React.useMemo(() => {
    if (!selectedSchoolId) return defaultSchoolDisplayName ?? "—";
    return (
      findOrgNode(classTree, selectedSchoolId)?.orgName
      ?? resolveSchoolNameFromTree(classTree, selectedSchoolId)
      ?? defaultSchoolDisplayName
      ?? selectedSchoolId
    );
  }, [selectedSchoolId, classTree, defaultSchoolDisplayName]);

  function relationKey(sid: string) {
    return `subject:${sid}`;
  }

  function isSubjectClassChecked(subjectId: string, classOrgId: string): boolean {
    return relationMap[relationKey(subjectId)]?.has(classOrgId) ?? false;
  }

  function isSubjectClassConflicted(subjectId: string, classOrgId: string): boolean {
    return conflictSet.has(`${classOrgId}::${subjectId}`);
  }

  function handleCellToggle(cellKey: string) {
    const parts = cellKey.split("::");
    if (parts.length !== 2) return;
    const [classOrgId, subjectId] = parts;
    if (isSubjectClassChecked(subjectId, classOrgId)) {
      onRemove(subjectId, classOrgId);
    } else {
      onAdd(subjectId, [classOrgId]);
    }
  }

  if (relationLoading || configTeacherSubjectsLoading) {
    return (
      <div className="flex min-h-[12rem] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        正在加载授课配置…
      </div>
    );
  }

  if (configTeacherSubjects.length === 0) {
    return (
      <div className="flex min-h-[8rem] items-center justify-center text-sm text-muted-foreground">
        该教师尚未加入任何课题组，暂无授教学科。请先在「课题组管理」中为教师分配学科。
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 学校选择 */}
      <div className="space-y-2">
        <Label className="text-base font-semibold text-foreground">学校</Label>
        {showSchoolPicker ? (
          <Combobox
            value={selectedSchoolId}
            onValueChange={setSelectedSchoolId}
            options={schoolComboboxOptions}
            placeholder="选择学校"
            searchPlaceholder="搜索学校…"
            emptyText="无匹配学校"
            triggerClassName="h-11 w-full max-w-none rounded-lg text-sm font-medium sm:max-w-2xl"
          />
        ) : (
          <p className="rounded-lg border border-border/80 bg-muted/15 px-3 py-2.5 text-sm font-medium text-foreground sm:max-w-2xl">
            {schoolReadOnlyLabel}
          </p>
        )}
      </div>

      {/* 年级选择 */}
      <div className="space-y-3">
        <Label className="text-base font-semibold text-foreground">年级</Label>
        {gradeOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">当前学校下暂无年级节点，请检查组织架构。</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {gradeOptions.map((g) => {
              const on = g.orgId === selectedGradeId;
              return (
                <button
                  key={g.orgId}
                  type="button"
                  onClick={() => setSelectedGradeId(g.orgId)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    on
                      ? "border-primary bg-teal-50/40 text-foreground shadow-sm ring-1 ring-primary/25"
                      : "border-border/80 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                >
                  {g.orgName}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 矩阵网格 */}
      {selectedGradeId && displaySubjects.length > 0 && classOptions.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border/80">
          <div className="min-w-fit">
            {/* 表头：学科名 + 班级列 */}
            <div className="flex border-b border-border/80 bg-muted/20 text-xs font-semibold text-muted-foreground">
              <div className="flex w-[100px] shrink-0 items-center px-3 py-2.5">
                学科 \ 班级
              </div>
              {classOptions.map((c) => (
                <div key={c.orgId} className="flex w-[120px] shrink-0 items-center justify-center px-2 py-2.5 text-center">
                  <Badge variant="secondary" className="rounded-full border-0 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {c.orgName}
                  </Badge>
                </div>
              ))}
            </div>

            {/* 矩阵数据行 */}
            {displaySubjects.map((sub) => (
              <div key={sub.id} className="flex border-b border-border/40 last:border-b-0 hover:bg-muted/10">
                <div className="flex w-[100px] shrink-0 items-center px-3 py-2 text-sm font-medium text-foreground">
                  {sub.name}
                </div>
                {classOptions.map((c) => {
                  const checked = isSubjectClassChecked(sub.id, c.orgId);
                  const conflicted = isSubjectClassConflicted(sub.id, c.orgId);
                  const cellKey = `${c.orgId}::${sub.id}`;

                  if (conflicted) {
                    return (
                      <div key={cellKey} className="flex w-[120px] shrink-0 items-center justify-center px-2 py-2">
                        <ConflictCell subjectName="已有教师占用" />
                      </div>
                    );
                  }

                  return (
                    <div key={cellKey} className="flex w-[120px] shrink-0 items-center justify-center px-2 py-2">
                      <button
                        type="button"
                        onClick={() => handleCellToggle(cellKey)}
                        className={cn(
                          "flex w-full items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs transition-all",
                          checked
                            ? "border-primary/60 bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                            : "border-border/70 bg-card hover:border-primary/40 hover:bg-primary/5",
                        )}
                        title={checked ? `取消关联：${c.orgName}` : `关联教师与 ${c.orgName}（${sub.name}）`}
                      >
                        {checked ? <Check className="size-3.5" /> : (
                          <span className="inline-block size-3.5 rounded-sm border border-muted-foreground/30" />
                        )}
                        <span className="truncate">{checked ? "已关联" : "未关联"}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex min-h-[8rem] items-center justify-center text-sm text-muted-foreground">
          {!selectedGradeId
            ? "请先选择年级"
            : displaySubjects.length === 0
              ? "当前年级下无可配置的学科（教师未加入相关课题组）"
              : "当前年级下无班级节点"
          }
        </div>
      )}

      {/* 图例 */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Check className="size-3 text-primary" /> 已关联
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block size-3 rounded-sm border border-muted-foreground/30" /> 未关联（可点击）
        </span>
        <span className="inline-flex items-center gap-1">
          <X className="size-3 text-destructive" /> 已被其他教师占用（不可操作）
        </span>
      </div>
    </div>
  );
}
