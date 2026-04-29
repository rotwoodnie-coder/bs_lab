"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
  ScrollArea,
  Separator,
  sonnerToast,
} from "@bs-lab/ui";

import { useResourceCenterPolicy } from "@/components/layout/resource-center-policy-context";
import { useDemoRole } from "@/components/layout/demo-role-context";
import { useAppMode } from "@/context/app-mode-context";
import { RESOURCE_CENTER_NAV_ID } from "@/config/resource-center-policy";
import {
  clearAllMenuConfigFromStorage,
  getManagementNavModuleIdsForRole,
  getPrimaryNavItemsForRole,
  getSystemMenuModuleCatalog,
  NAV_CONFIG,
  persistMenuConfigForRole,
  readManagementMenuCheckedIds,
  type SystemMenuModuleCatalogEntry,
} from "@/config/nav-config";
import { UserRole, userRoleLabelZh, USER_ROLE_ORDER } from "@/types/auth";

function modeLabel(mode: "portal" | "management"): string {
  return mode === "portal" ? "门户" : "管理台";
}

function loadCheckedSet(role: UserRole): Set<string> {
  return new Set(readManagementMenuCheckedIds(role));
}

export default function AdminMenuConfigPage() {
  const router = useRouter();
  const { setRole: setDemoRole } = useDemoRole();
  const { setViewMode } = useAppMode();
  const { getEffectiveForRole } = useResourceCenterPolicy();

  React.useEffect(() => {
    router.replace("/console/settings/system/roles");
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      正在跳转到「角色与权限」…
    </div>
  );
}

function ModuleMatrix({
  catalog,
  allowedIds,
  checked,
  onToggle,
}: {
  catalog: SystemMenuModuleCatalogEntry[];
  allowedIds: Set<string>;
  checked: Set<string>;
  onToggle: (id: string, next: boolean) => void;
}) {
  return (
    <ScrollArea className="h-[min(60vh,520px)] rounded-lg border border-border">
      <div className="divide-y divide-border">
        {catalog.map((row) => {
          const applicable = allowedIds.has(row.id);
          const isChecked = checked.has(row.id);
          return (
            <div
              key={row.id}
              className={
                applicable
                  ? "flex flex-wrap items-center gap-3 px-4 py-3"
                  : "flex flex-wrap items-center gap-3 bg-muted/30 px-4 py-3"
              }
            >
              <Checkbox
                id={`menu-mod-${row.id}`}
                checked={isChecked}
                disabled={!applicable}
                onCheckedChange={(v) => onToggle(row.id, v === true)}
                aria-label={row.label}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <Label
                  htmlFor={`menu-mod-${row.id}`}
                  className={
                    applicable
                      ? "cursor-pointer font-medium text-foreground"
                      : "cursor-not-allowed text-muted-foreground"
                  }
                >
                  {row.label}
                </Label>
                <span className="font-mono text-xs text-muted-foreground">{row.id}</span>
                <div className="flex flex-wrap gap-1">
                  {row.modes.map((m) => (
                    <Badge key={m} variant="outline" className="font-normal">
                      {modeLabel(m)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
