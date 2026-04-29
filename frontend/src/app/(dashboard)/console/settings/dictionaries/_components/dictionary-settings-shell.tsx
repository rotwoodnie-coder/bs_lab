"use client";

import * as React from "react";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { can, PERMISSIONS } from "@/lib/auth/role-permissions";

import {
  TEACHING_BASIC_OPTIONS,
  MATERIAL_CONFIG_OPTIONS,
  ASSESSMENT_CONFIG_OPTIONS,
  SYSTEM_DICT_OPTIONS,
  INCENTIVE_CONFIG_OPTIONS,
} from "../admin-dict-tables";

const DICT_SECTIONS = [
  { title: "教学基础数据", items: TEACHING_BASIC_OPTIONS },
  { title: "实验与材料配置", items: MATERIAL_CONFIG_OPTIONS },
  { title: "题库与评测配置", items: ASSESSMENT_CONFIG_OPTIONS },
  { title: "系统级字典（只读）", items: SYSTEM_DICT_OPTIONS },
  { title: "激励与规则", items: INCENTIVE_CONFIG_OPTIONS },
] as const;

export function DictionarySettingsShell(props: {
  currentTable: string | null;
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const user = auth.user;

  const hasDictAccess = React.useMemo(() => {
    if (auth.loading) return false;
    return can(user, PERMISSIONS.SYSTEM_DICT_WRITE);
  }, [auth.loading, user]);

  /**
   * 可见所有字典表的条件：
   * - 加载完成
   * - 拥有 SYSTEM_DICT_WRITE 权限（超管自动满足）
   */
  const showAll = !auth.loading && hasDictAccess;

  // 不满足条件时，所有条目均不可见
  const visibleSections = React.useMemo(() => {
    if (!showAll) return [];
    return DICT_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((o) => o.table),
    })).filter((section) => section.items.length > 0);
  }, [showAll]);

  if (auth.loading) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-4 lg:flex-row lg:gap-6">
        <aside className="w-full shrink-0 border-border lg:w-72 lg:border-r lg:pr-4">
          <p className="text-sm text-muted-foreground">加载中…</p>
        </aside>
        <div className="min-w-0 flex-1">{props.children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-4 lg:flex-row lg:gap-6">
      <aside className="w-full shrink-0 border-border lg:w-72 lg:border-r lg:pr-4">
        <nav className="space-y-4" aria-label="字典表列表">
          {visibleSections.map((section) => (
            <div key={section.title} className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {section.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.items.map((o) => {
                  const active = props.currentTable === o.table;
                  return (
                    <Link
                      key={o.table}
                      href={`/console/settings/dictionaries/${encodeURIComponent(o.table)}`}
                      className={cn(
                        "rounded-md border border-transparent px-2.5 py-2 text-sm transition-colors",
                        active
                          ? "border-border bg-muted/80 font-medium text-foreground"
                          : "text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      <span className="block leading-snug">{o.title}</span>
                      <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground/90">
                        {o.table}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          {visibleSections.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              暂无权限访问字典设置。需要 `SYSTEM_DICT_WRITE` 权限。
            </p>
          ) : null}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{props.children}</div>
    </div>
  );
}
