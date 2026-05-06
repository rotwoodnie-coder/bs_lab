"use client";

import * as React from "react";

import {
  Badge,
  Button,
  Checkbox,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@bs-lab/ui";
import { Search, BookOpen } from "@bs-lab/ui/icons";

import { SUBJECT_CASCADE } from "@/data/subject-tree";
import type { EducationPhase, SubjectDiscipline } from "@/types/subject";

type GradeOpt = { code: string; label: string };
type DisciplineOpt = { id: SubjectDiscipline; label: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // biome-ignore lint/suspicious/noExplicitAny: DataTable generic type
  curriculumTable: any;
  curriculumTableRowsLength: number;
  selectedStandardId: string | null;
  useCustomExperiment: boolean;
  linkedStandardName?: string | null;
  fieldDisabled: boolean;

  // filters
  listFilterPhases: EducationPhase[];
  setListFilterPhases: React.Dispatch<React.SetStateAction<EducationPhase[]>>;
  listFilterDisciplines: SubjectDiscipline[];
  setListFilterDisciplines: React.Dispatch<React.SetStateAction<SubjectDiscipline[]>>;
  listFilterGradeCodes: string[];
  setListFilterGradeCodes: React.Dispatch<React.SetStateAction<string[]>>;
  listDisciplineOptions: DisciplineOpt[];
  listGradeOptions: GradeOpt[];
  listFilterPhaseLabels: string;
  listFilterDisciplineSummary: string;
  listFilterGradeSummary: string;
  experimentSearchKeyword: string;
  onSearchExperiments: (keyword: string) => void;

  // actions
  setSelectedStandardId: (v: string | null) => void;
  setUseCustomExperiment: (v: boolean) => void;
  setCurriculum: (v: string) => void;
  onConfirm: (meta: { expId: string; expName?: string }) => void | Promise<void>;
  setPhase: (v: EducationPhase) => void;
  setDiscipline: (v: SubjectDiscipline) => void;
  setSelectedGradeCodes: React.Dispatch<React.SetStateAction<string[]>>;
};

export function ExperimentPickerDialog(props: Props) {
  const [searchDraft, setSearchDraft] = React.useState(props.experimentSearchKeyword);
  const [picking, setPicking] = React.useState(false);

  React.useEffect(() => {
    setSearchDraft(props.experimentSearchKeyword);
  }, [props.experimentSearchKeyword]);

  const phaseValue = React.useMemo(
    () => (props.listFilterPhases[0]?.trim() ? props.listFilterPhases[0] : "__all__"),
    [props.listFilterPhases],
  );
  const disciplineValue = React.useMemo(
    () => (props.listFilterDisciplines[0]?.trim() ? props.listFilterDisciplines[0] : "__all__"),
    [props.listFilterDisciplines],
  );

  const triggerSearch = React.useCallback(() => {
    props.onSearchExperiments(searchDraft);
  }, [props.onSearchExperiments, searchDraft]);

  const resetSearchByFilterInteraction = React.useCallback(() => {
    if (!searchDraft && !props.experimentSearchKeyword) return;
    setSearchDraft("");
    props.onSearchExperiments("");
  }, [props.experimentSearchKeyword, props.onSearchExperiments, searchDraft]);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden rounded-[32px] p-0 sm:max-w-[min(90vw,960px)]">
        {/* ===== 1. Header ===== */}
        <DialogHeader className="shrink-0 border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-slate-500" />
            <DialogTitle className="text-base font-semibold text-slate-800">关联实验</DialogTitle>
          </div>
          <DialogDescription className="sr-only">搜索并选择一个实验作为本实验的关联参考。</DialogDescription>
        </DialogHeader>

        {/* ===== 2. Scrollable body ===== */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          {/* 第一行：搜索框 */}
          <div className="grid gap-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">搜索实验</Label>
            <div className="flex items-center gap-2">
              <div className="relative w-full max-w-[520px]">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    triggerSearch();
                  }}
                  placeholder="搜索实验名称"
                  className="h-10 rounded-2xl border-slate-200 bg-slate-50 pl-9 text-sm placeholder:text-slate-400 focus:border-slate-300 focus:shadow-sm focus-visible:ring-0"
                />
              </div>
              <Button
                type="button"
                size="sm"
                className="h-10 rounded-2xl bg-[#008080] px-4 text-white hover:bg-[#006666]"
                onClick={triggerSearch}
              >
                查询
              </Button>
            </div>
          </div>

          {/* 第二行：学段 / 学科 */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">学段</Label>
              <Select
                value={phaseValue}
                onValueChange={(v) => {
                  if (props.fieldDisabled) return;
                  const next = String(v ?? "").trim();
                  props.setListFilterPhases(next && next !== "__all__" ? [next as EducationPhase] : []);
                  resetSearchByFilterInteraction();
                }}
                disabled={props.fieldDisabled}
              >
                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm text-slate-700 shadow-none">
                  <SelectValue placeholder="不限学段" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">不限</SelectItem>
                  {SUBJECT_CASCADE.map((p) => (
                    <SelectItem key={p.phase} value={p.phase}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">学科</Label>
              <Select
                value={disciplineValue}
                onValueChange={(v) => {
                  if (props.fieldDisabled) return;
                  const next = String(v ?? "").trim();
                  props.setListFilterDisciplines(next && next !== "__all__" ? [next as SubjectDiscipline] : []);
                  resetSearchByFilterInteraction();
                }}
                disabled={props.fieldDisabled}
              >
                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm text-slate-700 shadow-none">
                  <SelectValue placeholder="全部学科" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部学科</SelectItem>
                  {props.listDisciplineOptions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 第三行：年级大面板 */}
          <div className="grid gap-2">
            <Label className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span>年级</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-auto px-1 py-0 text-xs font-normal normal-case tracking-normal text-slate-400 hover:text-slate-600"
                disabled={props.fieldDisabled || props.listFilterGradeCodes.length === 0}
                onClick={() => {
                  props.setListFilterGradeCodes([]);
                  resetSearchByFilterInteraction();
                }}
              >
                清空
              </Button>
            </Label>
            <div className="grid max-h-36 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3 xl:grid-cols-4">
              {props.listGradeOptions.map((g) => {
                const checked = props.listFilterGradeCodes.includes(g.code);
                return (
                  <label
                    key={g.code}
                    className={[
                      "flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm transition-colors",
                      checked ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={props.fieldDisabled}
                      onCheckedChange={(next) => {
                        if (props.fieldDisabled) return;
                        const on = next === true;
                        props.setListFilterGradeCodes((prev) =>
                          on ? [...new Set([...prev, g.code])] : prev.filter((x) => x !== g.code),
                        );
                        resetSearchByFilterInteraction();
                      }}
                      className={checked ? "border-teal-400 text-teal-600" : "border-slate-300"}
                    />
                    {g.label}
                  </label>
                );
              })}
            </div>
          </div>

          {/* 第四行：当前选择结果汇总 */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-slate-700">当前选择结果</span>
              {props.selectedStandardId ? (
                <span>已关联：{props.linkedStandardName?.trim() || props.selectedStandardId.slice(0, 12)}</span>
              ) : (
                <span>未关联实验</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span>当前筛选：{props.listFilterPhaseLabels}</span>
              <span>·</span>
              <span>{props.listFilterDisciplineSummary}</span>
              <span>·</span>
              <span>{props.listFilterGradeSummary}</span>
            </div>
          </div>

          {/* 第五行：试验列表 */}
          <div className="flex min-h-[240px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
              <p className="text-sm font-bold text-slate-600">实验列表</p>
              <div className="flex items-center gap-3">
                {props.selectedStandardId ? (
                  <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-500 shadow-sm">
                    当前关联：{props.linkedStandardName?.trim() || props.selectedStandardId.slice(0, 12)}
                  </span>
                ) : null}
                <div className="flex items-center gap-2 text-xs">
                  <span className={ !props.useCustomExperiment ? "font-semibold text-slate-700" : "text-slate-400" }>
                    列表
                  </span>
                  <Switch
                    checked={props.useCustomExperiment}
                    onCheckedChange={(next) => {
                      props.setUseCustomExperiment(next);
                      if (next) {
                        props.setSelectedStandardId(null);
                        props.setCurriculum("老师拓展实验（未关联实验列表）");
                      }
                    }}
                    className="data-[state=checked]:bg-destructive/80"
                    aria-label="切换实验列表与拓展实验"
                  />
                  <span className={ props.useCustomExperiment ? "font-semibold text-destructive" : "text-slate-400" }>
                    拓展
                  </span>
                </div>
                {props.useCustomExperiment ? (
                  <Badge variant="destructive" className="h-5 rounded-full px-2 text-[10px]">
                    拓展
                  </Badge>
                ) : null}
                {!props.useCustomExperiment && props.selectedStandardId ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 rounded-full px-2 text-xs text-slate-500 hover:bg-slate-100"
                    onClick={() => {
                      props.setSelectedStandardId(null);
                      props.setUseCustomExperiment(true);
                    }}
                  >
                    解除关联
                  </Button>
                ) : null}
                <Badge
                  variant="secondary"
                  className="rounded-full bg-slate-100 text-xs text-slate-500"
                >
                  {props.curriculumTableRowsLength}
                </Badge>
              </div>
            </div>
            <div className="flex-1 overflow-auto [&_table_header]:bg-slate-50/80">
              <DataTable
                table={props.curriculumTable as never}
                showRowNumber
                rowNumberMode="page"
                stickyHeader
                onRowClick={(rowItem) => {
                  const r = rowItem as { id: string; title?: string };
                  props.onConfirm({ expId: r.id, expName: String(r.title ?? r.id) });
                  props.onOpenChange(false);
                }}
                className="[&_thead_tr]:bg-slate-50/80 [&_th]:text-slate-600 [&_th]:font-bold [&_tbody_tr]:transition-colors [&_tbody_tr]:hover:bg-teal-50/30"
              />
            </div>
            {props.selectedStandardId ? (
              <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
                已选择：{props.linkedStandardName?.trim() || props.selectedStandardId}
              </div>
            ) : null}
          </div>
        </div>

        {/* ===== 3. Footer ===== */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full border border-slate-200 px-5 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
            onClick={() => props.onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!props.selectedStandardId || picking || props.useCustomExperiment}
            className="gap-1.5 rounded-full bg-[#008080] px-6 text-white shadow-sm hover:bg-[#006666] disabled:opacity-50"
            onClick={async () => {
              if (!props.selectedStandardId) return;
              setPicking(true);
              try {
                await props.onConfirm({ expId: props.selectedStandardId, expName: props.linkedStandardName?.trim() || props.selectedStandardId });
                props.onOpenChange(false);
              } finally {
                setPicking(false);
              }
            }}
          >
            {picking ? "关联中…" : "关联此实验"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
