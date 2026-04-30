"use client";

import * as React from "react";
import { Alert, AlertDescription, Badge, Button, Input } from "@bs-lab/ui";
import { buildPagePermissionCode, PAGE_PERMISSIONS } from "@/lib/permissions/page-permissions";
import type { AuthRole } from "../page.types";

export type RolePermissionMatrixState = Record<string, { read: boolean; write: boolean }>;

export function PermissionMatrix(props: {
  roleId: AuthRole | null;
  value: RolePermissionMatrixState;
  onChange: (next: RolePermissionMatrixState) => void;
}) {
  const roleId = props.roleId;
  const pages = React.useMemo(() => PAGE_PERMISSIONS ?? [], []);
  const [keyword, setKeyword] = React.useState("");
  const [mode, setMode] = React.useState<"all" | "read" | "write" | "missing">("all");

  const filteredPages = React.useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return pages.filter((page) => {
      const state = props.value?.[page.menuCode] ?? { read: false, write: false };
      const text = `${page.label} ${page.menuCode} ${page.path}`.toLowerCase();
      const keywordHit = !kw || text.includes(kw);
      const modeHit =
        mode === "all" ||
        (mode === "read" && state.read) ||
        (mode === "write" && state.write) ||
        (mode === "missing" && (!state.read || !state.write));
      return keywordHit && modeHit;
    });
  }, [keyword, mode, pages, props.value]);

  const stats = React.useMemo(() => {
    const total = pages.length;
    let readCount = 0;
    let writeCount = 0;
    for (const page of pages) {
      const state = props.value?.[page.menuCode] ?? { read: false, write: false };
      if (state.read) readCount += 1;
      if (state.write) writeCount += 1;
    }
    return { total, readCount, writeCount };
  }, [pages, props.value]);

  const toggle = React.useCallback((menuCode: string, mode: "read" | "write") => {
    const next = { ...(props.value ?? {}) };
    const current = next[menuCode] ?? { read: false, write: false };
    next[menuCode] = { ...current, [mode]: !current[mode] };
    props.onChange(next);
  }, [props]);

  const selectAll = React.useCallback(() => {
    const next: RolePermissionMatrixState = {};
    for (const page of pages) next[page.menuCode] = { read: true, write: true };
    props.onChange(next);
  }, [pages, props]);

  const selectReadOnly = React.useCallback(() => {
    const next: RolePermissionMatrixState = {};
    for (const page of pages) next[page.menuCode] = { read: true, write: false };
    props.onChange(next);
  }, [pages, props]);

  const clearAll = React.useCallback(() => props.onChange({}), [props]);

  if (!Array.isArray(pages) || pages.length === 0) {
    return (
      <div className="space-y-3 rounded-lg border border-border p-4">
        <h3 className="text-sm font-medium">页面权限矩阵</h3>
        <Alert>
          <AlertDescription>当前还没有加载到页面权限目录，请先检查 sys_menu 初始化数据是否已完成。</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">页面权限矩阵</h3>
          <p className="text-xs text-muted-foreground">当前角色：{roleId ?? "未选择"}</p>
          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            <Badge variant="secondary">总计 {stats.total}</Badge>
            <Badge variant="secondary">READ {stats.readCount}</Badge>
            <Badge variant="secondary">WRITE {stats.writeCount}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={mode === "all" ? "default" : "outline"} size="sm" onClick={() => setMode("all")}>全部</Button>
          <Button variant={mode === "read" ? "default" : "outline"} size="sm" onClick={() => setMode("read")}>已开读</Button>
          <Button variant={mode === "write" ? "default" : "outline"} size="sm" onClick={() => setMode("write")}>已开写</Button>
          <Button variant={mode === "missing" ? "default" : "outline"} size="sm" onClick={() => setMode("missing")}>未完整</Button>
          <Button variant="outline" size="sm" onClick={selectReadOnly}>全读</Button>
          <Button variant="outline" size="sm" onClick={selectAll}>全选读写</Button>
          <Button variant="outline" size="sm" onClick={clearAll}>清空</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="按页面名称 / 编码 / 路径搜索"
        />
        <div className="text-xs text-muted-foreground flex items-center justify-end">当前筛选：{filteredPages.length} / {pages.length}</div>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="sticky top-0 bg-muted/90 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
              <tr>
                <th className="px-3 py-2 text-left">页面</th>
                <th className="px-3 py-2 text-left">路径</th>
                <th className="px-3 py-2 text-center">READ</th>
                <th className="px-3 py-2 text-center">WRITE</th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.map((page) => {
                const state = props.value?.[page.menuCode] ?? { read: false, write: false };
                const readCode = buildPagePermissionCode(page.menuCode, "READ");
                const writeCode = buildPagePermissionCode(page.menuCode, "WRITE");
                return (
                  <tr key={page.menuCode} className="border-t border-border hover:bg-muted/30">
                    <td className="px-3 py-2 align-top">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{page.label}</span>
                        <Badge variant="secondary">{page.menuCode}</Badge>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground align-top break-all">{page.path}</td>
                    <td className="px-3 py-2 text-center align-top">
                      <button
                        type="button"
                        className={`rounded px-3 py-1.5 text-xs transition ${state.read ? "bg-emerald-600 text-white" : "bg-muted hover:bg-muted/80"}`}
                        onClick={() => toggle(page.menuCode, "read")}
                        aria-label={`${page.label} READ ${state.read ? "已开启" : "未开启"}`}
                      >
                        {state.read ? "已开" : "未开"}
                      </button>
                      <div className="mt-1 text-[10px] text-muted-foreground">{readCode}</div>
                    </td>
                    <td className="px-3 py-2 text-center align-top">
                      <button
                        type="button"
                        className={`rounded px-3 py-1.5 text-xs transition ${state.write ? "bg-emerald-600 text-white" : "bg-muted hover:bg-muted/80"}`}
                        onClick={() => toggle(page.menuCode, "write")}
                        aria-label={`${page.label} WRITE ${state.write ? "已开启" : "未开启"}`}
                      >
                        {state.write ? "已开" : "未开"}
                      </button>
                      <div className="mt-1 text-[10px] text-muted-foreground">{writeCode}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
