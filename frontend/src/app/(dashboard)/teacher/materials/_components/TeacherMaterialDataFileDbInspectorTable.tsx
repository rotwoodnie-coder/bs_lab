"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
} from "@bs-lab/ui";
import type { ColumnDef } from "@bs-lab/ui/react-table";
import { getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type SortingState } from "@bs-lab/ui/react-table";

import { createSerialNumberColumn } from "@/lib/data-table/serial-column";
import type { ApiActor } from "@/lib/new-core-api";
import { teacherMaterialsDataFileListBaseQuery } from "@/lib/teacher-materials-api";
import { fetchV2FilesAll, type V2DataFileRecord } from "@/lib/v2/v2-file-api";

/**
 * 与表 `data_file` 及联表展示字段对应；单元格值为 `GET /v2/file` 列表 JSON（camelCase）。
 * `fileTypeName` / `fileTypeLogoClass` 来自 `LEFT JOIN data_file_type`。
 */
const DATA_FILE_DB_COLUMNS: { key: keyof V2DataFileRecord; db: string }[] = [
  { key: "fileId", db: "file_id" },
  { key: "fileName", db: "file_name" },
  { key: "fileUrl", db: "file_url" },
  { key: "fileTypeId", db: "file_type_id" },
  { key: "fileTypeName", db: "data_file_type.type_name" },
  { key: "fileTypeLogoClass", db: "data_file_type.logo_class" },
  { key: "status", db: "status" },
  { key: "ownerUserId", db: "owner_user_id" },
  { key: "logoUrl", db: "logo_url" },
  { key: "fileSize", db: "file_size" },
  { key: "fileExt", db: "file_ext" },
];

function cellDisplay(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string" && v.trim() === "") return "—";
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return String(v);
}

function formatInspectorCell(key: keyof V2DataFileRecord, raw: unknown): string {
  if (raw === null || raw === undefined) return "—";
  if (typeof raw === "string" && raw.trim() === "") return "—";
  return cellDisplay(raw);
}

function cellClassForKey(key: keyof V2DataFileRecord): string {
  const base = "break-words px-2 py-1 align-top font-mono text-xs text-foreground";
  if (key === "fileId") return `${base} min-w-[280px] max-w-[360px]`;
  if (key === "fileUrl" || key === "logoUrl") return `${base} min-w-[360px] max-w-[min(720px,90vw)] whitespace-pre-wrap`;
  if (key === "fileName") return `${base} min-w-[140px] max-w-[320px]`;
  return `${base} min-w-[96px] max-w-[200px]`;
}

function buildColumns(): ColumnDef<V2DataFileRecord>[] {
  const cols: ColumnDef<V2DataFileRecord>[] = [createSerialNumberColumn<V2DataFileRecord>()];
  for (const { key, db } of DATA_FILE_DB_COLUMNS) {
    cols.push({
      id: key,
      accessorKey: key,
      meta: { label: db },
      header: ({ column }) => <DataTableColumnHeader column={column} title={db} />,
      cell: ({ row }) => {
        const raw = row.getValue(key) as unknown;
        const text = formatInspectorCell(key, raw);
        return <div className={cellClassForKey(key)}>{text}</div>;
      },
    });
  }
  return cols;
}

export function TeacherMaterialDataFileDbInspectorTable(props: {
  actor: ApiActor;
  /** 与主列表搜索一致，传给 `GET /v2/file?keyword=` */
  keyword: string;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rows, setRows] = React.useState<V2DataFileRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const uid = props.actor.userId?.trim();
    if (!uid) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    const core = {
      role: props.actor.role,
      userId: props.actor.userId,
      userName: props.actor.userName,
      orgId: props.actor.orgId,
      tenantId: props.actor.tenantId,
      appId: props.actor.appId,
    };
    void fetchV2FilesAll(core, {
      ...teacherMaterialsDataFileListBaseQuery(props.actor),
      keyword: props.keyword.trim() || undefined,
    })
      .then(setRows)
      .catch((e) => {
        setError(e instanceof Error ? e.message : "加载失败");
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [props.actor, props.keyword]);

  const columns = React.useMemo(() => buildColumns(), []);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (r) => r.fileId,
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <Card className="border-dashed border-amber-500/40 shadow-none">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-base">data_file 库字段检视</CardTitle>
        <CardDescription>
          数据源：<span className="font-mono">GET /v2/file</span> 列表 JSON（字段名为 API camelCase；表头括号内为库表或联表列语义）。
          筛选范围与主列表一致（启用态、归属人/平台范围）；关键词与上方搜索框同步。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="w-full overflow-x-auto rounded-md border border-border">
          <DataTable
            table={table}
            className="max-h-[min(55vh,480px)] min-w-[1400px] w-max overflow-auto"
            emptyText={loading ? "加载中…" : "暂无行"}
            stickyHeader
          />
        </div>
        <DataTablePagination table={table} pageSizeOptions={[10, 20, 50]} />
        {rows[0] ? (
          <details className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
            <summary className="cursor-pointer select-none font-medium text-foreground">首行原始 JSON（与接口 data.items[] 元素一致）</summary>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-muted-foreground">
              {JSON.stringify(rows[0], null, 2)}
            </pre>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}
