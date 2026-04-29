"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  DataTablePagination,
  DataTableViewOptions,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bs-lab/ui";
import { Search } from "@bs-lab/ui/icons";
import {
  type PaginationState,
  type SortingState,
  type Updater,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@bs-lab/ui/react-table";

import type { QuestionStatusFilter, QuestionsServerPagination } from "../page.hooks";
import { buildQuestionsTableColumns, dictNameById } from "./questions-table-columns";
import type { V2DictItem } from "@/lib/v2/v2-exp-api";
import type { V2QuestionItem } from "@/lib/v2/v2-question-api";

export function QuestionsListCard(props: {
  items: V2QuestionItem[];
  loading: boolean;
  keyword: string;
  setKeyword: (v: string) => void;
  statusFilter: QuestionStatusFilter;
  setStatusFilter: (v: QuestionStatusFilter) => void;
  questionTypeId: string;
  setQuestionTypeId: (v: string) => void;
  difficultyTypeId: string;
  setDifficultyTypeId: (v: string) => void;
  questionTypes: V2DictItem[];
  difficultyTypes: V2DictItem[];
  questionCapacities: V2DictItem[];
  serverPagination: QuestionsServerPagination;
  refresh: () => void;
  onEdit: (row: V2QuestionItem) => void;
  onDelete: (row: V2QuestionItem) => void;
  onStatus: (row: V2QuestionItem, status: "y" | "t") => void;
  onRequestDeactivate: (row: V2QuestionItem) => void;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const typeName = React.useCallback((id: string | null) => dictNameById(props.questionTypes, id), [props.questionTypes]);
  const difficultyName = React.useCallback(
    (id: string | null) => dictNameById(props.difficultyTypes, id),
    [props.difficultyTypes],
  );
  const capacityName = React.useCallback(
    (id: string | null) => dictNameById(props.questionCapacities, id),
    [props.questionCapacities],
  );

  const columns = React.useMemo(
    () =>
      buildQuestionsTableColumns({
        typeName,
        difficultyName,
        capacityName,
        onEdit: props.onEdit,
        onDelete: props.onDelete,
        onStatus: props.onStatus,
        onRequestDeactivate: props.onRequestDeactivate,
      }),
    [typeName, difficultyName, capacityName, props.onEdit, props.onDelete, props.onStatus, props.onRequestDeactivate],
  );

  const server = props.serverPagination;
  const paginationState: PaginationState = React.useMemo(
    () => ({ pageIndex: server.pageIndex, pageSize: server.pageSize }),
    [server.pageIndex, server.pageSize],
  );

  const onPaginationChange = React.useCallback(
    (updater: Updater<PaginationState>) => {
      const next = typeof updater === "function" ? updater(paginationState) : updater;
      if (next.pageSize !== server.pageSize) {
        server.onPageSizeChange(next.pageSize);
        if (next.pageIndex !== 0) server.onPageIndexChange(0);
        return;
      }
      if (next.pageIndex !== server.pageIndex) server.onPageIndexChange(next.pageIndex);
    },
    [paginationState, server],
  );

  const table = useReactTable({
    data: props.items,
    columns,
    state: { sorting, pagination: paginationState },
    onSortingChange: setSorting,
    onPaginationChange,
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(server.total / server.pageSize)),
    rowCount: server.total,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.questionId,
  });

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">筛选与列表</CardTitle>
        <CardDescription>关键词匹配题干；题型、难度、状态与字典表一致。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="relative min-w-0 flex-1 sm:min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="搜索题干关键词"
              value={props.keyword}
              onChange={(e) => props.setKeyword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">状态</Label>
            <Select value={props.statusFilter} onValueChange={(v) => props.setStatusFilter(v as QuestionStatusFilter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="t">草稿</SelectItem>
                <SelectItem value="y">已启用</SelectItem>
                <SelectItem value="n">已停用</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">题型</Label>
            <Select value={props.questionTypeId || "__all__"} onValueChange={(v) => props.setQuestionTypeId(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="全部题型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">全部题型</SelectItem>
                {props.questionTypes.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">难度类型</Label>
            <Select
              value={props.difficultyTypeId || "__all__"}
              onValueChange={(v) => props.setDifficultyTypeId(v === "__all__" ? "" : v)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="全部难度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">全部难度</SelectItem>
                {props.difficultyTypes.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => props.refresh()}>
            刷新
          </Button>
        </div>

        {props.loading ? (
          <p className="text-sm text-muted-foreground">加载中…</p>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-end">
              <DataTableViewOptions table={table} />
            </div>
            <DataTable
              table={table}
              stickyHeader
              className="max-h-[min(68vh,560px)] overflow-auto rounded-md border border-border"
              emptyText="暂无题目。可点击「新建题目」写入题库。"
            />
            <DataTablePagination table={table} pageSizeOptions={[10, 20, 50]} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
