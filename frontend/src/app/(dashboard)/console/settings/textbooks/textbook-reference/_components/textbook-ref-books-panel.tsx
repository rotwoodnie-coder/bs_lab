"use client";

import * as React from "react";
import {
  Button,
  DataTable,
  DataTablePagination,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Spinner,
  Switch,
} from "@bs-lab/ui";
import { getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type SortingState } from "@bs-lab/ui/react-table";
import { Search } from "@bs-lab/ui/icons";

import type { ApiActor } from "@/lib/new-core-api";

import type { TextbookRefBook } from "../page.types";
import { buildTextbookRefBookColumns } from "./textbook-ref-book-table-columns";
import { TextbookRefCoverField } from "./textbook-ref-cover-field";
import { TEXTBOOK_REF_GRADE_NONE, TextbookRefGradeSelect } from "./textbook-ref-grade-select";

export function TextbookRefBooksPanel(props: {
  mediaActor: ApiActor;
  subjectLabel: string;
  rows: TextbookRefBook[];
  loading: boolean;
  selectedBookId: string;
  bookQuery: string;
  onBookQueryChange: (v: string) => void;
  onSelectBook: (id: string) => void;
  gradeNameById?: Record<string, string>;
  gradeOptions?: Array<{ id: string; name: string }>;
  /** 学段树当前选中的年级节点 id；未选年级时为空，新建教材默认沿用 */
  treeSelectedGradeId?: string;
  onCreate: (body: {
    subjectId: string;
    title: string;
    coursebookVersion?: string | null;
    gradeId?: string | null;
    coverRegistryId?: string | null;
    status?: 0 | 1;
  }) => Promise<void>;
  onPatch: (
    id: string,
    body: {
      title?: string;
      coursebookVersion?: string | null;
      gradeId?: string | null;
      coverRegistryId?: string | null;
      status?: 0 | 1;
      sortOrder?: number;
    },
  ) => Promise<void>;
  subjectId: string;
}) {
  const gradeOptions = props.gradeOptions ?? [];
  const gradeNameById = props.gradeNameById ?? {};
  const treeSelectedGradeId = props.treeSelectedGradeId ?? "";

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<TextbookRefBook | null>(null);
  const [cTitle, setCTitle] = React.useState("");
  const [cVersion, setCVersion] = React.useState("");
  const [cCover, setCCover] = React.useState("");
  const [cGradeId, setCGradeId] = React.useState(TEXTBOOK_REF_GRADE_NONE);
  const [eTitle, setETitle] = React.useState("");
  const [eVersion, setEVersion] = React.useState("");
  const [eCover, setECover] = React.useState("");
  const [eGradeId, setEGradeId] = React.useState(TEXTBOOK_REF_GRADE_NONE);
  const [eSort, setESort] = React.useState("0");
  const [eStatus, setEStatus] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  const openEdit = React.useCallback((r: TextbookRefBook) => {
    setEditRow(r);
    setETitle(r.title);
    setEVersion(r.coursebookVersion ?? "");
    setECover(r.coverRegistryId ?? "");
    setEGradeId(r.gradeId?.trim() ? r.gradeId : TEXTBOOK_REF_GRADE_NONE);
    setESort(String(r.sortOrder ?? 0));
    setEStatus(r.status === 1);
  }, []);

  const toggleStatus = React.useCallback(
    async (r: TextbookRefBook) => {
      setBusy(true);
      try {
        await props.onPatch(r.id, { status: r.status === 1 ? 0 : 1 });
      } finally {
        setBusy(false);
      }
    },
    [props],
  );

  const submitCreate = async () => {
    if (!props.subjectId || !cTitle.trim()) return;
    setBusy(true);
    try {
      await props.onCreate({
        subjectId: props.subjectId,
        title: cTitle.trim(),
        coursebookVersion: cVersion.trim() || null,
        gradeId: cGradeId === TEXTBOOK_REF_GRADE_NONE ? null : cGradeId,
        coverRegistryId: cCover.trim() || null,
        status: 1,
      });
      setCreateOpen(false);
      setCTitle("");
      setCVersion("");
      setCCover("");
      setCGradeId(TEXTBOOK_REF_GRADE_NONE);
    } finally {
      setBusy(false);
    }
  };

  const submitEdit = async () => {
    if (!editRow) return;
    setBusy(true);
    try {
      const sort = Number(eSort);
      await props.onPatch(editRow.id, {
        title: eTitle.trim(),
        coursebookVersion: eVersion.trim() || null,
        gradeId: eGradeId === TEXTBOOK_REF_GRADE_NONE ? null : eGradeId,
        coverRegistryId: eCover.trim() || null,
        sortOrder: Number.isFinite(sort) ? sort : 0,
        status: eStatus ? 1 : 0,
      });
      setEditRow(null);
    } finally {
      setBusy(false);
    }
  };

  const columns = React.useMemo(
    () =>
      buildTextbookRefBookColumns({
        selectedBookId: props.selectedBookId,
        gradeNameById,
        onSelectBook: props.onSelectBook,
        onEdit: openEdit,
        onToggleStatus: (r) => {
          void toggleStatus(r);
        },
      }),
    [props.selectedBookId, gradeNameById, props.onSelectBook, openEdit, toggleStatus],
  );

  const table = useReactTable({
    data: props.rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (r) => r.id,
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="min-w-0 flex-1 text-sm text-muted-foreground">
          当前范围：<span className="text-foreground">{props.subjectLabel || "未选择"}</span>
          。教材行对应 <span className="text-foreground">data_coursebook</span>；学科、年级、排序与封面登记 id 写入{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">comments._ref</code>。仅「启用」行参与新业务选书；停用后历史引用仍保留。
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setCGradeId(treeSelectedGradeId.trim() ? treeSelectedGradeId : TEXTBOOK_REF_GRADE_NONE);
            setCreateOpen(true);
          }}
          disabled={busy || !props.subjectId}
        >
          新增教材
        </Button>
      </div>
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="搜索教材名称或版本"
          value={props.bookQuery}
          onChange={(e) => props.onBookQueryChange(e.target.value)}
        />
      </div>
      {props.loading ? (
        <div className="flex justify-center py-10">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      ) : (
        <>
          <DataTable
            table={table}
            className="max-h-[min(50vh,440px)] w-full overflow-auto rounded-md border border-border"
            emptyText="暂无教材，请先新增"
            stickyHeader
          />
          <DataTablePagination table={table} pageSizeOptions={[10, 20, 50]} />
        </>
      )}

      <Dialog open={createOpen} onOpenChange={(o) => !busy && setCreateOpen(o)}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>新增教材</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label htmlFor="tb-c-title">教材名称</Label>
              <Input
                id="tb-c-title"
                value={cTitle}
                onChange={(e) => setCTitle(e.target.value)}
                placeholder="对应列 coursebook_name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tb-c-version">教材版本</Label>
              <Input
                id="tb-c-version"
                value={cVersion}
                onChange={(e) => setCVersion(e.target.value)}
                placeholder="对应列 coursebook_version，可选"
              />
            </div>
            <TextbookRefGradeSelect
              labelId="tb-c-grade"
              value={cGradeId}
              onValueChange={setCGradeId}
              options={gradeOptions}
            />
            <TextbookRefCoverField
              inputId="tb-c-cover"
              value={cCover}
              onChange={setCCover}
              actor={props.mediaActor}
              inputPlaceholder="可选"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={busy}>
              取消
            </Button>
            <Button type="button" onClick={() => void submitCreate()} disabled={busy}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRow} onOpenChange={(o) => !o && !busy && setEditRow(null)}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>编辑教材</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label htmlFor="tb-e-title">教材名称</Label>
              <Input id="tb-e-title" value={eTitle} onChange={(e) => setETitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tb-e-version">教材版本</Label>
              <Input id="tb-e-version" value={eVersion} onChange={(e) => setEVersion(e.target.value)} placeholder="可选" />
            </div>
            <TextbookRefGradeSelect
              labelId="tb-e-grade"
              value={eGradeId}
              onValueChange={setEGradeId}
              options={gradeOptions}
            />
            <TextbookRefCoverField
              inputId="tb-e-cover"
              value={eCover}
              onChange={setECover}
              actor={props.mediaActor}
              inputPlaceholder="留空表示清除"
            />
            <div className="space-y-1">
              <Label htmlFor="tb-e-sort">排序</Label>
              <Input id="tb-e-sort" value={eSort} onChange={(e) => setESort(e.target.value)} inputMode="numeric" />
            </div>
            <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
              <span className="text-sm">启用</span>
              <Switch checked={eStatus} onCheckedChange={(v) => setEStatus(Boolean(v))} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditRow(null)} disabled={busy}>
              取消
            </Button>
            <Button type="button" onClick={() => void submitEdit()} disabled={busy}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
