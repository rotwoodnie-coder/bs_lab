import * as React from "react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from "@bs-lab/ui";
import {
  ChevronDown,
  Download,
  Plus,
  RefreshCw,
  Upload,
  UserCheck,
} from "@bs-lab/ui/icons";

import type { RoleId } from "@/lib/console/users/types";
import { USER_ROLE_OPTIONS } from "@/lib/console/users/types";

import type { UserManagementCohort } from "../use-user-management";

export function UserHeader(props: {
  juryConfigFocus: boolean;
  listLoading: boolean;
  usersLength: number;
  listError: string | null;
  q: string;
  onQChange: (next: string) => void;
  roleFilter: RoleId | "all";
  onRoleFilterChange: (next: RoleId | "all") => void;
  searchDebounceMs: number;
  onRefresh: () => void;
  onRetry: () => void;
  onCreate: () => void;
  canCreate: boolean;
  onExport: (cohort: UserManagementCohort | "all") => void;
  onPickImport: () => void;
  canImport: boolean;
  fileInput: React.ReactNode;
  selectedCount: number;
  onBatchFreeze: () => void;
  onBatchUnfreeze: () => void;
  canBatchOperate: boolean;
  onExportSelected: () => void;
  onClearSelected: () => void;
}) {
  const disabledWhenEmptyLoading = props.listLoading && props.usersLength === 0;
  const createDisabled = disabledWhenEmptyLoading || !props.canCreate;
  const importDisabled = !props.canImport;
  const batchDisabled = !props.canBatchOperate;

  return (
    <div className="min-w-0 space-y-4">
      {props.juryConfigFocus ? (
        <Alert className="border-primary/30 bg-primary/5">
          <UserCheck className="size-4" />
          <AlertTitle>实验小法庭 · 法官资格</AlertTitle>
          <AlertDescription>
            您从「实验小法庭」跳转而来，可在此按用户类别与组织归属管理账号；当前已切换为真实 V2 数据源。
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-1">
        <h2 className="text-base font-semibold tracking-tight text-foreground">用户管理</h2>
        <p className="text-sm text-muted-foreground">
          当前页面已接入 <strong className="font-medium text-foreground">V2 `sys_user`</strong>
          ，左侧可按组织结构筛选直属成员；新建或编辑用户在屏幕居中对话框中完成，账号状态在对话框内通过开关修改，保存后再刷新列表。
        </p>
      </div>

      <CardContent className="min-w-0 space-y-4">
        {props.listError ? (
          <Alert variant="destructive">
            <AlertTitle>列表不可用</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{props.listError}</span>
              <Button type="button" size="sm" variant="outline" onClick={props.onRetry}>
                <RefreshCw className="size-4" />
                重试
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="sticky top-0 z-10 space-y-3 border-b border-border bg-card pb-3">
          <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                placeholder="搜索用户名、姓名、昵称、手机、邮箱、组织…"
                value={props.q}
                onChange={(e) => props.onQChange(e.target.value)}
                className="min-w-0 w-full max-w-full rounded-md sm:max-w-[28rem]"
                disabled={disabledWhenEmptyLoading}
              />

              <Select
                value={props.roleFilter}
                onValueChange={(v) => props.onRoleFilterChange(v as RoleId | "all")}
                disabled={disabledWhenEmptyLoading}
              >
                <SelectTrigger size="sm" className="w-full min-w-0 rounded-md sm:w-[200px]">
                  <SelectValue placeholder="筛选用户类别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类别</SelectItem>
                  {USER_ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {props.listLoading && props.usersLength > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Spinner className="size-3.5" />
                  更新列表…
                </span>
              ) : null}

              <Button type="button" variant="outline" size="sm" className="rounded-md" disabled={props.listLoading} onClick={props.onRefresh}>
                <RefreshCw className="size-4" />
                刷新
              </Button>

              <Button type="button" size="sm" className="rounded-md" onClick={props.onCreate} disabled={createDisabled}>
                <Plus className="size-4" />
                新建用户
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="rounded-md gap-1">
                    <Download className="size-4" />
                    导出
                    <ChevronDown className="size-3.5 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-44">
                  <DropdownMenuItem onClick={() => void props.onExport("all")}>导出全部</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void props.onExport("student")}>导出学生</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void props.onExport("researcher")}>导出教研员</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void props.onExport("school_admin")}>导出校级管理</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button type="button" variant="secondary" size="sm" className="rounded-md" onClick={props.onPickImport} disabled={importDisabled}>
                <Upload className="size-4" />
                导入
              </Button>

              {props.fileInput}
            </div>
          </div>

          {props.selectedCount > 0 ? (
            <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between" role="region" aria-label="批量操作">
              <p className="text-sm text-muted-foreground">
                已选择 <span className="font-medium text-foreground">{props.selectedCount}</span> 名用户
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={props.onBatchFreeze} disabled={batchDisabled}>批量冻结</Button>
                <Button type="button" size="sm" variant="outline" onClick={props.onBatchUnfreeze} disabled={batchDisabled}>批量解冻</Button>
                <Button type="button" size="sm" variant="secondary" onClick={props.onExportSelected}>导出所选</Button>
                <Button type="button" size="sm" variant="ghost" onClick={props.onClearSelected}>清除选择</Button>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </div>
  );
}
