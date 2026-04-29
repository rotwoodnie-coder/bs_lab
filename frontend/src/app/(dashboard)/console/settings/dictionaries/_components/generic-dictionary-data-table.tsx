"use client";

import * as React from "react";

import {
  Button,
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableViewOptions,
  Switch,
} from "@bs-lab/ui";
import { Pencil, Trash2 } from "@bs-lab/ui/icons";
import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@bs-lab/ui/react-table";

import { createSerialNumberColumn } from "@/lib/data-table/serial-column";

import { getDictColumnHeaderZh, type FkDisplayMaps } from "../_lib/dictionary-display-zh";

export type DictTableRow = Record<string, unknown>;

type DictColumnMeta = {
  name: string;
  dataType: string;
  nullable: boolean;
  columnKey: string;
};

function statusTriStateOn(v: unknown): boolean {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "y" || s === "t" || s === "1";
}

type Props = {
  dictKind: "admin" | "business";
  tableName: string;
  primaryKey: string;
  columns: DictColumnMeta[];
  rows: DictTableRow[];
  fkDisplayMaps: FkDisplayMaps;
  allowMutation: boolean;
  loading: boolean;
  patchingPk: string | null;
  isSysAdmin?: boolean;
  onPatchStatus: (pkValue: string, enabled: boolean) => void | Promise<void>;
  onEdit: (row: DictTableRow) => void;
  onDelete: (pkValue: string) => void | Promise<void>;
};

export function GenericDictionaryDataTable(props: Props) {
  const { primaryKey: pk } = props;
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const dataColumns = React.useMemo(() => {
    // 规则：
    // - 超管：两类字典均"全字段显示"（含内部 id/key/sort/is_system 等）
    // - 主数据字典：admin 非超管也"全字段显示"
    // - 业务字典：business 非超管隐藏"无意义内部字段"（但不刻意隐藏业务主键列，如 type_id 等）
    const hidden = new Set<string>();
    if (!props.isSysAdmin && props.dictKind === "business") {
      ["id", "uuid", "dict_key", "is_system"].forEach((k) => hidden.add(k));
      // 若业务表的主键就是通用 `id`，则按"无意义内部字段"隐藏
      if (pk === "id") hidden.add("id");
    }
    /** 只读种子字典（如 data_rating_scale）：非超管隐藏内部技术列 */
    if (!props.isSysAdmin && !props.allowMutation) {
      hidden.add("sort_order");
      // 隐藏 `*_id` 主键列（如 scale_id），避免内部编码挤占可读空间
      if (pk.endsWith("_id")) hidden.add(pk);
    }
    // DataTable 列集合必须与数据库真实字段一致：只允许"隐藏显示"而不能做"删字段映射"。
    // 因此列始终来自后端 meta.columns（INFORMATION_SCHEMA），这里仅做"可选隐藏"的 UI 策略。
    return props.columns.filter((c) => !hidden.has(c.name));
  }, [props.columns, pk, props.dictKind, props.isSysAdmin, props.allowMutation]);

  const tableColumns = React.useMemo<ColumnDef<DictTableRow>[]>(() => {
    const defs: ColumnDef<DictTableRow>[] = [createSerialNumberColumn<DictTableRow>()];

    for (const c of dataColumns) {
      if (c.name === "status") {
        defs.push({
          id: "status",
          accessorFn: (row) => String(row.status ?? ""),
          meta: { label: getDictColumnHeaderZh(props.tableName, "status") },
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={getDictColumnHeaderZh(props.tableName, "status")} />
          ),
          cell: ({ row }) => {
            const id = String(row.original[pk] ?? "");
            const checked = statusTriStateOn(row.original.status);
            const busy = props.patchingPk === id;
            return (
              <Switch
                checked={checked}
                disabled={!props.allowMutation || props.loading || busy}
                aria-label={checked ? "停用" : "启用"}
                onCheckedChange={(v) => {
                  void props.onPatchStatus(id, v === true);
                }}
              />
            );
          },
          enableSorting: false,
        });
        continue;
      }

      defs.push({
        id: c.name,
        accessorFn: (row) => {
          return row?.[c.name] === null || row?.[c.name] === undefined ? "" : String(row[c.name]);
        },
        meta: { label: getDictColumnHeaderZh(props.tableName, c.name) },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={getDictColumnHeaderZh(props.tableName, c.name)} />
        ),
        cell: ({ row }) => {
          const v = row.original?.[c.name];
          const text = v === null || v === undefined ? "" : String(v);
          const mono = props.isSysAdmin && ["id", "uuid", "dict_key", "sort_order", "is_system"].includes(c.name);
          return (
            <span
              className={mono ? "min-w-[12rem] font-mono line-clamp-2 text-sm text-foreground" : "min-w-[12rem] line-clamp-2 text-sm text-foreground"}
              title={text}
            >
              {text}
            </span>
          );
        },
      });
    }

    if (props.allowMutation) {
      defs.push({
        id: "actions",
        meta: { label: "操作" },
        header: "操作",
        enableSorting: false,
        cell: ({ row }) => {
          const id = String(row.original[pk] ?? "");
          return (
            <div className="flex min-w-[7rem] justify-end gap-1">
              <Button type="button" size="sm" variant="ghost" aria-label="编辑" onClick={() => props.onEdit(row.original)}>
                <Pencil className="size-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive"
                aria-label="删除或停用"
                onClick={() => void props.onDelete(id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        },
      });
    }

    return defs;
  }, [
    dataColumns,
    pk,
    props.allowMutation,
    props.dictKind,
    props.fkDisplayMaps,
    props.isSysAdmin,
    props.loading,
    props.onDelete,
    props.onEdit,
    props.onPatchStatus,
    props.patchingPk,
    props.tableName,
  ]);

  const table = useReactTable({
    data: props.rows,
    columns: tableColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => String(row[pk] ?? ""),
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <DataTableViewOptions table={table} />
      </div>
      <DataTable
        table={table}
        stickyHeader
        className="max-h-[min(72vh,640px)] overflow-auto rounded-md border border-border"
        emptyText={props.loading ? "加载中…" : "暂无数据"}
      />
      <DataTablePagination table={table} pageSizeOptions={[10, 15, 25, 50]} />
    </div>
  );
}
