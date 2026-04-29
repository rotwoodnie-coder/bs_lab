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
  DataTableColumnHeader,
  DataTablePagination,
  Input,
  sonnerToast,
} from "@bs-lab/ui";
import type { ColumnDef } from "@bs-lab/ui/react-table";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@bs-lab/ui/react-table";
import { Plus, RefreshCw } from "@bs-lab/ui/icons";

import { V2StatusBadge } from "@/components/v2/V2StatusBadge";
import { createSerialNumberColumn } from "@/lib/data-table/serial-column";
import type { CreateV2OrgTypeInput, PatchV2OrgTypeInput, V2OrgTypeItem } from "@/lib/v2/v2-org-type-api";

import { OrgTypeFormDialog } from "./OrgTypeFormDialog";
import { OrgTypeDeleteConfirm } from "./OrgTypeDeleteConfirm";

type Ctx = {
  canMutate: boolean;
  onEdit: (row: V2OrgTypeItem) => void;
  onDelete: (row: V2OrgTypeItem) => void;
  onCopyId: (id: string) => void;
};

function buildColumns(ctx: Ctx): ColumnDef<V2OrgTypeItem>[] {
  return [
    createSerialNumberColumn<V2OrgTypeItem>(),
    {
      accessorKey: "typeName",
      meta: { label: "类型名称" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="类型名称" />,
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.typeName}</span>,
    },
    {
      accessorKey: "comments",
      meta: { label: "说明" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="说明" />,
      cell: ({ row }) => (
        <span className="line-clamp-2 text-sm text-muted-foreground">{row.original.comments ?? "—"}</span>
      ),
    },
    {
      accessorKey: "status",
      meta: { label: "状态" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
      cell: ({ row }) => <V2StatusBadge type="org" status={row.original.status} />,
    },
    {
      accessorKey: "sortOrder",
      meta: { label: "排序" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="排序" />,
      cell: ({ row }) => (
        <span className="tabular-nums text-sm text-muted-foreground">{row.original.sortOrder ?? "—"}</span>
      ),
    },
    {
      id: "actions",
      meta: { label: "操作" },
      header: () => <span className="text-muted-foreground">操作</span>,
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-1">
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => ctx.onCopyId(row.original.typeId)}>
            复制 ID
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            disabled={!ctx.canMutate}
            onClick={() => ctx.onEdit(row.original)}
          >
            编辑
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-destructive hover:text-destructive"
            disabled={!ctx.canMutate}
            onClick={() => ctx.onDelete(row.original)}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];
}

export function OrgTypesPanel(props: {
  rows: V2OrgTypeItem[];
  loading: boolean;
  submitting: boolean;
  canMutate: boolean;
  onRefreshTypes: () => void | Promise<void>;
  onCreate: (input: CreateV2OrgTypeInput) => Promise<void>;
  onPatch: (typeId: string, input: PatchV2OrgTypeInput) => Promise<void>;
  onDelete: (typeId: string) => Promise<void>;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create");
  const [editing, setEditing] = React.useState<V2OrgTypeItem | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<V2OrgTypeItem | null>(null);

  const onCopyId = React.useCallback((id: string) => {
    void navigator.clipboard.writeText(id).then(
      () => sonnerToast.success("已复制类型 ID"),
      () => sonnerToast.error("复制失败"),
    );
  }, []);

  const onEdit = React.useCallback((row: V2OrgTypeItem) => {
    setEditing(row);
    setFormMode("edit");
    setFormOpen(true);
  }, []);

  const onDelete = React.useCallback((row: V2OrgTypeItem) => setPendingDelete(row), []);

  const ctx = React.useMemo(
    () => ({ canMutate: props.canMutate, onEdit, onDelete, onCopyId }),
    [props.canMutate, onEdit, onDelete, onCopyId],
  );

  const columns = React.useMemo(() => buildColumns(ctx), [ctx]);

  const filteredRows = React.useMemo(() => {
    const q = globalFilter.trim().toLowerCase();
    if (!q) return props.rows;
    return props.rows.filter(
      (r) => r.typeName.toLowerCase().includes(q) || (r.comments ?? "").toLowerCase().includes(q),
    );
  }, [props.rows, globalFilter]);

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (r) => r.typeId,
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-4">
      <OrgTypeDeleteConfirm
        open={Boolean(pendingDelete)}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        typeName={pendingDelete?.typeName ?? ""}
        busy={props.submitting}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await props.onDelete(pendingDelete.typeId);
            setPendingDelete(null);
          } catch {
            /* Toast 由 hooks 处理 */
          }
        }}
      />
      <OrgTypeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initial={formMode === "edit" ? editing : null}
        submitting={props.submitting}
        onSubmitCreate={props.onCreate}
        onSubmitPatch={props.onPatch}
      />

      <Card className="border-border shadow-none">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-base">组织类型</CardTitle>
          <CardDescription className="text-xs">
            维护 <span className="font-mono">data_org_type</span>；新增、编辑、删除仅{" "}
            <span className="font-mono">超级管理员 / 区级管理员</span> 可用。删除前须无{" "}
            <span className="font-mono">sys_org</span> 引用。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Input
              placeholder="按类型名称或说明筛选…"
              className="max-w-sm"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => void props.onRefreshTypes()}>
                <RefreshCw className="size-4" />
                刷新列表
              </Button>
              <Button
                type="button"
                size="sm"
                className="shrink-0 gap-1"
                disabled={!props.canMutate}
                onClick={() => {
                  setEditing(null);
                  setFormMode("create");
                  setFormOpen(true);
                }}
              >
                <Plus className="size-4" />
                新增类型
              </Button>
            </div>
          </div>
          {props.loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">加载中…</p>
          ) : (
            <>
              <DataTable table={table} />
              <DataTablePagination table={table} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
