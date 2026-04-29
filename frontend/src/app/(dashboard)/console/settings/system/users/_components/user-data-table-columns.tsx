"use client";

import * as React from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Checkbox,
  DataTableColumnHeader,
} from "@bs-lab/ui";
import { PenLine } from "@bs-lab/ui/icons";
import type { ColumnDef } from "@bs-lab/ui/react-table";

import { createSerialNumberColumn } from "@/lib/data-table/serial-column";
import {
  formatExpireDate,
  formatLastActive,
  initials,
  roleLabel,
} from "@/lib/console/users/format";
import { formatZhDateTime } from "@/lib/datetime/format-zh";
import type { UserRecord } from "@/lib/console/users/types";

function cellDateTime(iso: string | null | undefined): string {
  return formatZhDateTime(iso);
}

export type UserDataTableColumnsProps = {
  usersLength: number;
  listLoading: boolean;
  tableBusy: boolean;
  selectedIds: Set<string>;
  headerCheckboxState: boolean | "indeterminate";
  onToggleSelectAllVisible: (checked: boolean) => void;
  onToggleRowSelected: (id: string, checked: boolean) => void;
  onEdit: (row: UserRecord) => void;
};

export function useUserDataTableColumns(props: UserDataTableColumnsProps): ColumnDef<UserRecord>[] {
  return React.useMemo(
    () => [
      createSerialNumberColumn<UserRecord>(),
      {
        id: "select",
        meta: { label: "选择" },
        header: () => (
          <Checkbox
            checked={props.headerCheckboxState}
            onCheckedChange={(c) => props.onToggleSelectAllVisible(c === true)}
            disabled={props.usersLength === 0 || props.tableBusy}
            aria-label="全选已加载的全部用户"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={props.selectedIds.has(row.original.id)}
            onCheckedChange={(c) => props.onToggleRowSelected(row.original.id, c === true)}
            aria-label={`选择 ${row.original.username}`}
            disabled={props.tableBusy}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "avatar",
        meta: { label: "头像" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="头像" />,
        cell: ({ row }) => (
          <Avatar className="size-8">
            {row.original.userLogo ? <AvatarImage src={row.original.userLogo} alt="" /> : null}
            <AvatarFallback className="text-xs">{initials(row.original.realName)}</AvatarFallback>
          </Avatar>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "username",
        meta: { label: "登录账号" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="登录账号" />,
        cell: ({ row }) => (
          <span className="min-w-[12rem] font-medium text-foreground" title={row.original.username}>
            {row.original.username}
          </span>
        ),
      },
      {
        accessorKey: "realName",
        meta: { label: "姓名" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="姓名" />,
        cell: ({ row }) => <span className="min-w-[8rem]" title={row.original.realName}>{row.original.realName || "—"}</span>,
      },
      {
        accessorKey: "nickname",
        meta: { label: "昵称" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="昵称" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground" title={row.original.nickname}>
            {row.original.nickname || "—"}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        meta: { label: "手机号" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="手机号" />,
        cell: ({ row }) => <span title={row.original.phone}>{row.original.phone || "—"}</span>,
      },
      {
        accessorKey: "email",
        meta: { label: "电子邮箱" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="电子邮箱" />,
        cell: ({ row }) => (
          <span className="min-w-[14rem] line-clamp-2" title={row.original.email}>
            {row.original.email || "—"}
          </span>
        ),
      },
      {
        accessorKey: "orgName",
        meta: { label: "所属组织" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="所属组织" />,
        cell: ({ row }) => (
          <span className="min-w-[12rem] line-clamp-2 text-muted-foreground" title={row.original.orgName}>
            {row.original.orgName || "—"}
          </span>
        ),
      },
      {
        accessorKey: "orgPath",
        meta: { label: "组织路径" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="组织路径" />,
        cell: ({ row }) => (
          <span className="min-w-[16rem] line-clamp-2 text-muted-foreground" title={row.original.orgPath}>
            {row.original.orgPath || "—"}
          </span>
        ),
      },
      {
        id: "roleIds",
        accessorFn: (r) => r.roleIds.join(","),
        meta: { label: "用户类别" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="用户类别" />,
        cell: ({ row }) => (
          <div className="flex max-h-20 flex-wrap gap-1 overflow-hidden">
            {row.original.roleIds.length ? (
              row.original.roleIds.map((id) => {
                const toneClass =
                  id === "Role_School_Admin"
                    ? "border-sky-200 bg-sky-600 text-white"
                    : id === "Role_District_Admin"
                      ? "border-indigo-200 bg-indigo-600 text-white"
                      : id === "Role_Sys_Admin"
                        ? "border-slate-200 bg-slate-800 text-white"
                        : id === "Role_Teacher"
                          ? "border-violet-200 bg-violet-600 text-white"
                          : id === "Role_Researcher"
                            ? "border-cyan-200 bg-cyan-600 text-white"
                            : id === "Role_Parent"
                              ? "border-amber-200 bg-amber-600 text-white"
                              : "border-emerald-200 bg-emerald-600 text-white";
                return (
                  <Badge
                    key={id}
                    variant="outline"
                    className={`max-w-full truncate border px-2.5 py-1 font-medium shadow-sm ${toneClass}`}
                  >
                    {roleLabel(id)}
                  </Badge>
                );
              })
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "roleName",
        meta: { label: "角色名称" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="角色名称" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground" title={row.original.roleName ?? ""}>
            {row.original.roleName?.trim() || "—"}
          </span>
        ),
      },
      {
        accessorKey: "expireDate",
        meta: { label: "账号到期时间" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="账号到期时间" />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatExpireDate(row.original.expireDate)}
          </span>
        ),
      },
      {
        accessorKey: "lastLoginTime",
        meta: { label: "最近登录" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="最近登录" />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {row.original.lastLoginTime ? formatLastActive(row.original.lastLoginTime) : "—"}
          </span>
        ),
      },
      {
        accessorKey: "updateTime",
        meta: { label: "资料更新时间" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="资料更新时间" />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">{cellDateTime(row.original.updateTime)}</span>
        ),
      },
      {
        accessorKey: "comments",
        meta: { label: "备注" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="备注" />,
        cell: ({ row }) => (
          <span className="min-w-[12rem] line-clamp-2 text-muted-foreground" title={row.original.comments ?? ""}>
            {row.original.comments?.trim() || "—"}
          </span>
        ),
      },
      {
        id: "status",
        accessorFn: (r) => r.status,
        meta: { label: "启用状态" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="启用状态" />,
        cell: ({ row }) => {
          const on = row.original.status === "正常";
          return (
            <div className="flex flex-col gap-1">
              <Badge
                variant={on ? "secondary" : "outline"}
                className={on ? "w-fit rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 font-medium" : "w-fit rounded-full px-3 py-1 font-medium"}
              >
                {row.original.status}
              </Badge>
              <span className="text-[11px] text-muted-foreground">点「编辑」在弹窗中修改</span>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "actions",
        meta: { label: "操作" },
        header: "操作",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-end min-w-[7rem]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => props.onEdit(row.original)}
              disabled={props.listLoading && props.usersLength === 0}
            >
              <PenLine className="size-4" />
              编辑
            </Button>
          </div>
        ),
      },
    ],
    [
      props.headerCheckboxState,
      props.listLoading,
      props.onEdit,
      props.onToggleRowSelected,
      props.onToggleSelectAllVisible,
      props.selectedIds,
      props.tableBusy,
      props.usersLength,
    ],
  );
}
