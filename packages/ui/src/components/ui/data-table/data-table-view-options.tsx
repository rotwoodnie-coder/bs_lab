"use client";
import * as React from 'react'

import { SlidersHorizontal } from "lucide-react";
import type { Table } from "@tanstack/react-table";

import { cn } from "../../../lib/utils";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu";

export interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
  /** 触发按钮文案 */
  triggerLabel?: string;
  className?: string;
}

function columnLabel<TData>(table: Table<TData>, columnId: string): string {
  const col = table.getColumn(columnId);
  const meta = col?.columnDef.meta;
  if (meta && typeof meta === "object" && "label" in meta && typeof meta.label === "string") {
    return meta.label;
  }
  return columnId;
}

function DataTableViewOptions<TData>({
  table,
  triggerLabel = "列显示",
  className,
}: DataTableViewOptionsProps<TData>) {
  const hideable = table.getAllColumns().filter((c) => c.getCanHide());

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("ml-auto h-8 gap-2", className)}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          {triggerLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>切换列显示</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hideable.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            className="capitalize"
            checked={column.getIsVisible()}
            onCheckedChange={(v) => column.toggleVisibility(!!v)}
            onSelect={(e) => e.preventDefault()}
          >
            {columnLabel(table, column.id)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { DataTableViewOptions };

