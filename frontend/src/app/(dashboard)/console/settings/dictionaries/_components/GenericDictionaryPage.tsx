"use client";

import * as React from "react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Switch,
} from "@bs-lab/ui";
import { Plus, RefreshCw } from "@bs-lab/ui/icons";

import { getDictColumnHeaderZh } from "../_lib/dictionary-display-zh";
import { GenericDictionaryDataTable } from "./generic-dictionary-data-table";
import { useGenericDictionaryPage } from "./generic-dictionary.hooks";
import { useSessionActor } from "@/hooks/use-session-actor";

function statusDraftFromRaw(v: unknown): boolean {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "y" || s === "t" || s === "1";
}

export function GenericDictionaryPage(props: {
  tableName: string;
  title: string;
  dictKind: "admin" | "business";
  /** 嵌入其它页面时使用紧凑标题区，不渲染一级页面标题。 */
  layout?: "page" | "embedded";
  /** 为 false 时隐藏新建与行内编辑/删除（与后端字典写入角色一致）。 */
  allowMutation?: boolean;
  /** 为 true 时强制隐藏增删改，并强调查看全字段。 */
  readOnly?: boolean;
}) {
  const layout = props.layout ?? "page";
  const readOnly = props.readOnly === true;
  const allowMutation = props.allowMutation !== false && !readOnly;
  const st = useGenericDictionaryPage(props.tableName, props.dictKind);
  const { role } = useSessionActor();
  const isSysAdmin = role === "Role_Sys_Admin";

  // 这些 useCallback 必须在任何条件 return 之前声明，保持 hook 顺序一致
  const onPatchStatus = React.useCallback(
    (id: string, enabled: boolean) => {
      void st.patchStatus(id, enabled);
    },
    [st.patchStatus],
  );
  const onEditRow = React.useCallback(
    (row: Record<string, unknown>) => {
      st.openEdit(row);
    },
    [st.openEdit],
  );
  const onDeleteRow = React.useCallback(
    (id: string) => {
      void st.remove(id);
    },
    [st.remove],
  );

  if (!st.hydrated) {
    return <p className="text-sm text-muted-foreground">初始化身份上下文…</p>;
  }
  if (!st.tableOk) {
    return (
      <Alert variant="destructive">
        <AlertTitle>表名不在白名单</AlertTitle>
        <AlertDescription>仅允许后端配置的 data_* 单行字典表。</AlertDescription>
      </Alert>
    );
  }

  const pk = st.screen?.meta.primaryKey ?? "id";
  const cols = st.screen?.meta.columns ?? [];
  const rows = st.screen?.rows ?? [];

  return (
    <div className="space-y-4">
      {layout === "page" ? (
        <header className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{props.title}</h1>
          <p className="text-sm text-muted-foreground" title={`内部表名（技术标识）：${props.tableName}`}>
            下列为「{props.title}」主数据；列表不展示内部主键列，悬停单元格可查看编码类提示。
          </p>
        </header>
      ) : (
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">{props.title}</h2>
          <p className="text-xs text-muted-foreground" title={`内部表名：${props.tableName}`}>
            嵌入视图
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" size="sm" variant="outline" className="rounded-md" onClick={() => st.refresh()} disabled={st.loading}>
          <RefreshCw className="mr-1 size-4" />
          刷新
        </Button>
        {allowMutation ? (
          <Button type="button" size="sm" className="rounded-md" onClick={() => st.openCreate()} disabled={st.loading || !st.screen}>
            <Plus className="mr-1 size-4" />
            新建
          </Button>
        ) : null}
        {readOnly ? <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">只读</span> : null}
        <div className="flex items-center gap-2">
          <Switch
            id={`dict-include-inactive-${props.tableName}`}
            checked={st.includeInactive}
            onCheckedChange={(v) => st.setIncludeInactive(v === true)}
            disabled={st.loading}
          />
          <Label htmlFor={`dict-include-inactive-${props.tableName}`} className="cursor-pointer text-sm text-muted-foreground">
            含停用
          </Label>
        </div>
      </div>

      {isSysAdmin ? (
        <Alert className="border-primary/20 bg-primary/5">
          <AlertTitle>超管全字段视图</AlertTitle>
          <AlertDescription>
            已显示所有字段（含内部 ID / Key / Sort / IsSystem），便于直接定位底层数据；相关单元格使用等宽字体。
          </AlertDescription>
        </Alert>
      ) : null}

      {st.error ? (
        <Alert variant="destructive">
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{st.error}</AlertDescription>
        </Alert>
      ) : null}

      <GenericDictionaryDataTable
        dictKind={props.dictKind}
        tableName={props.tableName}
        primaryKey={pk}
        columns={cols}
        rows={rows}
        fkDisplayMaps={st.fkDisplayMaps}
        allowMutation={allowMutation}
        loading={st.loading}
        patchingPk={st.patchingPk}
        isSysAdmin={isSysAdmin}
        onPatchStatus={onPatchStatus}
        onEdit={onEditRow}
        onDelete={onDeleteRow}
      />

      <Dialog open={allowMutation && st.editorOpen} onOpenChange={st.setEditorOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{st.editorMode === "create" ? "新建字典行" : "编辑字典行"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {cols.map((c) => (
              <div key={c.name} className="grid gap-1">
                <Label className="text-xs text-muted-foreground" title={c.name}>
                  {getDictColumnHeaderZh(props.tableName, c.name)}
                  {c.columnKey === "PRI" ? "（主键，不可改）" : ""}
                </Label>
                {c.name === "status" ? (
                  <div className="flex items-center gap-2 pt-1">
                    <Switch
                      checked={statusDraftFromRaw(st.draft[c.name])}
                      onCheckedChange={(v) =>
                        st.setDraft((d) => ({ ...d, [c.name]: v === true ? "y" : "n" }))
                      }
                      disabled={st.editorMode === "edit" && c.columnKey === "PRI"}
                    />
                    <span className="text-xs text-muted-foreground">{statusDraftFromRaw(st.draft[c.name]) ? "启用" : "停用"}</span>
                  </div>
                ) : (
                  <Input
                    value={st.draft[c.name] ?? ""}
                    onChange={(e) => st.setDraft((d) => ({ ...d, [c.name]: e.target.value }))}
                    disabled={st.editorMode === "edit" && c.columnKey === "PRI"}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => st.setEditorOpen(false)}>
              取消
            </Button>
            <Button type="button" onClick={() => void st.save()} disabled={st.loading}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
