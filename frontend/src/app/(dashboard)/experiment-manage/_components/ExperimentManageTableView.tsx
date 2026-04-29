"use client";

import * as React from "react";
import Link from "next/link";

import {
  Badge,
  Button,
  Checkbox,
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableViewOptions,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bs-lab/ui";
import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@bs-lab/ui/react-table";

import {
  EDITOR_PEER_MANDATORY_LABEL,
  EDITOR_PEER_WORKFLOW_LABEL,
  editorPeerIsPendingReviewStatus,
  type EditorPeerMandatory,
  type EditorPeerWorkflowStatus,
} from "@/app/(dashboard)/teacher/experiment-editor/utils/editor-peer-row-types";

export type ExperimentManageTableViewProps<Row extends { id: string }> = {
  tableData: Row[];
  standardId: string | null;
  canShelf: boolean;
  onUpdateRow: (id: string, patch: Partial<Row>) => void;
  onRowSelectionChange?: (ids: string[]) => void;
};

export function ExperimentManageTableView<Row extends { id: string }>(props: ExperimentManageTableViewProps<Row>) {
  const lastSelectionKeyRef = React.useRef("");
  const [tableSorting, setTableSorting] = React.useState<SortingState>([]);
  const [tableColumnVisibility, setTableColumnVisibility] = React.useState<VisibilityState>({});
  const [tableRowSelection, setTableRowSelection] = React.useState<RowSelectionState>({});

  const columns = React.useMemo<ColumnDef<Row>[]>(
    () =>
      [
        ...(props.standardId
          ? ([
              {
                id: "select",
                header: ({ table }) => (
                  <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="全选本页"
                  />
                ),
                cell: ({ row }) => (
                  <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label={`选择 ${(row.original as any).title}`}
                  />
                ),
                enableSorting: false,
                enableHiding: false,
              },
            ] satisfies ColumnDef<Row>[])
          : []),
        {
          accessorKey: "title",
          meta: { label: "实验名称" },
          header: ({ column }) => <DataTableColumnHeader column={column} title="实验名称" />,
          cell: ({ row }) => <div className="font-medium text-foreground">{(row.original as any).title}</div>,
        },
        {
          accessorKey: "subjectLabel",
          meta: { label: "学科" },
          header: ({ column }) => <DataTableColumnHeader column={column} title="学科" />,
          cell: ({ row }) => (
            <div className="max-w-[180px] text-sm text-foreground">
              {(() => {
                const raw = String((row.original as any).subjectLabel || "").trim();
                const parts = raw.split("·").map((s) => s.trim()).filter(Boolean);
                const phaseSet = new Set(["小学", "初中", "高中"]);
                const subject = parts.length >= 2 && phaseSet.has(parts[0]!) ? parts[1]! : parts[0];
                return subject || "—";
              })()}
            </div>
          ),
        },
        {
          id: "gradeLabels",
          accessorFn: (row) => ((row as any).gradeLabels ?? []).join("、"),
          meta: { label: "年级" },
          header: ({ column }) => <DataTableColumnHeader column={column} title="年级" />,
          cell: ({ row }) => <span className="text-sm text-foreground">{((row.original as any).gradeLabels ?? []).join("、") || "—"}</span>,
        },
        {
          accessorKey: "authorName",
          meta: { label: "指导老师" },
          header: ({ column }) => <DataTableColumnHeader column={column} title="指导老师" />,
          cell: ({ row }) => <span className="text-sm text-foreground">{(row.original as any).authorName || "—"}</span>,
        },
        {
          accessorKey: "mandatory",
          meta: { label: "实验类型" },
          header: ({ column }) => <DataTableColumnHeader column={column} title="实验类型" />,
          cell: ({ row }) => (
            <Badge variant="outline" className="font-normal">
              {EDITOR_PEER_MANDATORY_LABEL[((row.original as any).mandatory ?? "optional") as EditorPeerMandatory]}
            </Badge>
          ),
        },
        {
          accessorKey: "workflowStatus",
          meta: { label: "课程状态" },
          header: ({ column }) => <DataTableColumnHeader column={column} title="课程状态" />,
          cell: ({ row }) => (
            <Select
              value={(row.original as any).workflowStatus}
              disabled={!props.canShelf}
              onValueChange={(v) => props.onUpdateRow((row.original as any).id, { workflowStatus: v } as any)}
            >
              <SelectTrigger size="sm" className="h-8 w-full min-w-[132px]" aria-label={`${(row.original as any).title} 课程状态`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(EDITOR_PEER_WORKFLOW_LABEL) as EditorPeerWorkflowStatus[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {EDITOR_PEER_WORKFLOW_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ),
        },
        {
          id: "actions",
          meta: { label: "操作" },
          header: "操作",
          enableSorting: false,
          enableHiding: false,
          cell: ({ row }) => (
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" size="sm" variant="secondary" asChild>
                <Link href={`/experiment-manage/editor?id=${encodeURIComponent((row.original as any).id)}`}>编辑</Link>
              </Button>
              <Button type="button" size="sm" variant="outline" asChild>
                <Link href={`/console/review/experiments?expId=${encodeURIComponent((row.original as any).id)}`}>
                  {editorPeerIsPendingReviewStatus((row.original as any).workflowStatus) ? "评审" : "查看"}
                </Link>
              </Button>
            </div>
          ),
        },
      ] as ColumnDef<Row>[],
    [props.canShelf, props.onUpdateRow, props.standardId],
  );

  const table = useReactTable({
    data: props.tableData,
    columns,
    state: {
      sorting: tableSorting,
      columnVisibility: tableColumnVisibility,
      rowSelection: tableRowSelection,
    },
    onSortingChange: setTableSorting,
    onColumnVisibilityChange: setTableColumnVisibility,
    onRowSelectionChange: setTableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => (row as any).id,
    enableRowSelection: Boolean(props.standardId),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  React.useEffect(() => {
    if (!props.onRowSelectionChange) return;
    const ids = Object.entries(tableRowSelection)
      .filter(([, selected]) => selected)
      .map(([id]) => id);
    const nextKey = ids.join("|");
    if (nextKey === lastSelectionKeyRef.current) return;
    lastSelectionKeyRef.current = nextKey;
    props.onRowSelectionChange(ids);
  }, [props.onRowSelectionChange, tableRowSelection]);

  return (
    <>
      <div className="flex justify-end">
        <DataTableViewOptions table={table} />
      </div>
      <DataTable table={table} className="max-h-[68vh] overflow-auto rounded-md border border-border" emptyText="无匹配项，可放宽筛选或重置条件。" />
      <DataTablePagination table={table} pageSizeOptions={[10, 20, 50]} />
    </>
  );
}

