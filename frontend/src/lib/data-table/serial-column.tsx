"use client";

import { DataTableColumnHeader } from "@bs-lab/ui";
import type { ColumnDef } from "@bs-lab/ui/react-table";

/** 当前页序号列（从 1 起）；分页切换后按新页重算。 */
export function createSerialNumberColumn<T>(): ColumnDef<T> {
  return {
    id: "serial",
    meta: { label: "序号" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="序号" />,
    cell: ({ row, table }) => {
      const page = table.getState().pagination.pageIndex;
      const size = table.getState().pagination.pageSize;
      return (
        <span className="tabular-nums text-muted-foreground">{page * size + row.index + 1}</span>
      );
    },
    enableSorting: false,
  };
}
