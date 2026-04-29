"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/** 将 `sys_org` 路径节点展示为面包屑（V0：斜杠分隔），禁止直接展示原始 `org_path` 字符串 */
export function ProfileOrgPathBreadcrumb({
  nodes,
  className,
}: {
  nodes: readonly { orgId: string; orgName: string }[];
  className?: string;
}) {
  if (!nodes.length) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  return (
    <nav aria-label="组织路径" className={cn("flex flex-wrap items-center gap-x-1.5 text-sm leading-snug", className)}>
      {nodes.map((n, i) => (
        <React.Fragment key={n.orgId || String(i)}>
          {i > 0 ? (
            <span className="select-none text-muted-foreground/55" aria-hidden>
              /
            </span>
          ) : null}
          <span className="max-w-[14rem] truncate font-medium text-foreground" title={n.orgName || n.orgId}>
            {n.orgName?.trim() || n.orgId}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
}
