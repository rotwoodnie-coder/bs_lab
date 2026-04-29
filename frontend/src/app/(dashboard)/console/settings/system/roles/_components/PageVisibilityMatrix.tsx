"use client";

import * as React from "react";
import { Check, X } from "@bs-lab/ui/icons";
import { cn } from "@/lib/utils";
import { RoleHeaderBadge } from "./RoleHeaderBadge";
import type { AuthRole, PageAccessRow } from "../page.types";

const ALL_ROLES: AuthRole[] = [
  "Role_Sys_Admin",
  "Role_District_Admin",
  "Role_School_Admin",
  "Role_Researcher",
  "Role_Teacher",
  "Role_Student",
  "Role_Parent",
];

export type PageVisibilityMatrixProps = {
  rows: PageAccessRow[];
};

/** 按 section 分组 */
function groupRows(rows: PageAccessRow[]): Map<string, PageAccessRow[]> {
  const map = new Map<string, PageAccessRow[]>();
  for (const row of rows) {
    const group = map.get(row.section) ?? [];
    group.push(row);
    map.set(row.section, group);
  }
  return map;
}

export function PageVisibilityMatrix({ rows }: PageVisibilityMatrixProps) {
  const groups = React.useMemo(() => groupRows(rows), [rows]);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="sticky top-0 z-10 whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">
              页面 / 功能
            </th>
            <th className="sticky top-0 z-10 whitespace-nowrap px-2 py-2.5 text-left text-xs font-semibold text-muted-foreground">
              路由
            </th>
            {ALL_ROLES.map((role) => (
              <th
                key={role}
                className="sticky top-0 z-10 whitespace-nowrap px-2 py-2.5 text-center"
              >
                <RoleHeaderBadge role={role} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from(groups.entries()).map(([section, sectionRows], groupIdx) => (
            <React.Fragment key={section}>
              {/* section 分隔行 */}
              <tr className="border-b border-border bg-muted/30">
                <td
                  colSpan={2 + ALL_ROLES.length}
                  className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {section}
                </td>
              </tr>
              {sectionRows.map((row) => (
                <tr
                  key={row.pageId}
                  className={cn(
                    "border-b border-border transition-colors hover:bg-muted/20",
                  )}
                >
                  <td className="px-3 py-2 font-medium">{row.pageLabel}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">
                    <code className="rounded bg-muted px-1 py-0.5">{row.pageHref}</code>
                  </td>
                  {ALL_ROLES.map((role) => {
                    const visible = row.roles[role] ?? false;
                    return (
                      <td key={role} className="px-2 py-2 text-center">
                        {visible ? (
                          <Check className="mx-auto size-4 text-emerald-600" />
                        ) : (
                          <X className="mx-auto size-4 text-muted-foreground/40" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
