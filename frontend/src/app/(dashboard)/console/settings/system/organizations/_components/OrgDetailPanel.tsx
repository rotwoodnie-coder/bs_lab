"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bs-lab/ui";
import { Download, Home, Plus, Trash2 } from "@bs-lab/ui/icons";
import { V2StatusBadge } from "@/components/v2/V2StatusBadge";
import type { DictOption } from "@/lib/v2/v2-dict-adapter";
import type { UpdateV2SysOrgInput, V2SysOrgItem } from "@/lib/v2/v2-sys-api";

import type { StructureDiffResult } from "../org-structure-diff";
import type { GradeOptionWithLevel } from "../org-school-structure-utils";
import { resolveOrgTypeModeById, resolveOrgTypeUiMode } from "../org-type-ui-mode";
import { OrgCurrentNodeForm } from "./OrgCurrentNodeForm";
import { OrgDeleteConfirm } from "./OrgDeleteConfirm";
import { OrgSchoolGradeClassPanel } from "./OrgSchoolGradeClassPanel";

function formatOrgGradeCell(org: V2SysOrgItem, gradeLabels: Record<string, string>): string {
  const sg = org.schoolGradeIds?.filter(Boolean) ?? [];
  if (sg.length > 0) {
    return sg.map((id) => gradeLabels[id] ?? "未命名年级").join("、");
  }
  if (org.gradeId) return gradeLabels[org.gradeId] ?? "未命名年级";
  return "—";
}

interface Props {
  selectedOrg: V2SysOrgItem | undefined;
  selectedPath: V2SysOrgItem[];
  childOrgs: V2SysOrgItem[];
  descendantOrgs: V2SysOrgItem[];
  orgTypeLabels: Record<string, string>;
  gradeLabels: Record<string, string>;
  orgTypeOptions: DictOption[];
  gradeOptions: GradeOptionWithLevel[];
  levelOptions: DictOption[];
  isSuperAdmin: boolean;
  submitting: boolean;
  onPatchOrg: (orgId: string, input: UpdateV2SysOrgInput) => Promise<void>;
  onApplySchoolStructure: (
    schoolOrgId: string,
    payload: StructureDiffResult,
  ) => Promise<void>;
  onClearSchoolStructure: (schoolOrgId: string) => Promise<void>;
  onSelectId: (id: string) => void;
  onCreateChild: () => void;
  onExport: () => void;
  onDeleteOrg: () => Promise<void>;
  deleteBusy: boolean;
}

export function OrgDetailPanel({
  selectedOrg,
  selectedPath,
  childOrgs,
  descendantOrgs,
  orgTypeLabels,
  gradeLabels,
  orgTypeOptions,
  gradeOptions,
  levelOptions,
  isSuperAdmin,
  submitting,
  onPatchOrg,
  onApplySchoolStructure,
  onClearSchoolStructure,
  onSelectId,
  onCreateChild,
  onExport,
  onDeleteOrg,
  deleteBusy,
}: Props) {
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const selectedTypeId = selectedOrg?.orgTypeId ?? null;
  const selectedTypeName = selectedTypeId
    ? orgTypeOptions.find((t) => t.id === selectedTypeId)?.name ?? null
    : null;
  // ID 优先（标准 Org_School 等），名称作为兜底（自定义类型走关键词匹配）
  const orgTypeMode =
    resolveOrgTypeModeById(selectedTypeId) !== "other"
      ? resolveOrgTypeModeById(selectedTypeId)
      : resolveOrgTypeUiMode(selectedTypeName);
  const showSchoolGradeClassPanel = Boolean(selectedOrg && orgTypeMode === "school");

  const runDelete = async () => {
    try {
      await onDeleteOrg();
      setDeleteOpen(false);
    } catch {
      /* sonnerToast in hook */
    }
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
      <OrgDeleteConfirm
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        orgName={selectedOrg?.orgName ?? ""}
        busy={deleteBusy}
        onConfirm={runDelete}
      />
      <div className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            当前路径
          </p>
          <Breadcrumb>
            <BreadcrumbList className="flex-wrap gap-x-1 gap-y-1">
              {selectedPath.length === 0 ? (
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-xs">— 未选择 —</BreadcrumbPage>
                </BreadcrumbItem>
              ) : (
                selectedPath.map((p, i) => {
                  const last = i === selectedPath.length - 1;
                  return (
                    <span key={p.orgId} className="contents">
                      {i > 0 && <BreadcrumbSeparator className="hidden sm:block" />}
                      <BreadcrumbItem>
                        {last ? (
                          <BreadcrumbPage className="inline-flex items-center gap-1 truncate text-xs font-medium sm:text-sm">
                            {i === 0 && <Home className="size-3.5 shrink-0" />}
                            <span className="truncate">{p.orgName}</span>
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 truncate text-xs sm:text-sm"
                              onClick={() => onSelectId(p.orgId)}
                            >
                              {i === 0 && <Home className="size-3.5 shrink-0 text-muted-foreground" />}
                              <span className="truncate">{p.orgName}</span>
                            </button>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </span>
                  );
                })
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onExport} disabled={!selectedOrg}>
            <Download className="size-4" />
            导出子树
          </Button>
          <Button type="button" size="sm" onClick={onCreateChild} disabled={!selectedOrg}>
            <Plus className="size-4" />
            新建子节点
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={!selectedOrg || deleteBusy}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            删除
          </Button>
        </div>
      </div>

      {selectedOrg ? (
        showSchoolGradeClassPanel ? (
          <div className="grid min-h-0 gap-4 xl:grid-cols-2">
            <OrgCurrentNodeForm
              selectedOrg={selectedOrg}
              selectedPath={selectedPath}
              orgTypeOptions={orgTypeOptions}
              gradeOptions={gradeOptions}
              submitting={submitting}
              onSave={onPatchOrg}
            />
            <OrgSchoolGradeClassPanel
              school={selectedOrg}
              childOrgs={descendantOrgs}
              gradeRows={gradeOptions}
              levelOptions={levelOptions}
              orgTypeOptions={orgTypeOptions}
              orgTypeLabels={orgTypeLabels}
              gradeLabels={gradeLabels}
              isSuperAdmin={isSuperAdmin}
              submitting={submitting}
              orgTypeMode={orgTypeMode}
              onApply={(payload) => onApplySchoolStructure(selectedOrg.orgId, payload)}
              onClear={() => onClearSchoolStructure(selectedOrg.orgId)}
            />
          </div>
        ) : (
          <OrgCurrentNodeForm
            selectedOrg={selectedOrg}
            selectedPath={selectedPath}
            orgTypeOptions={orgTypeOptions}
            gradeOptions={gradeOptions}
            submitting={submitting}
            onSave={onPatchOrg}
          />
        )
      ) : null}

      <Card className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-border shadow-none">
        <CardHeader className="shrink-0 space-y-1 pb-2">
          <CardTitle className="text-base">
            {selectedOrg ? `「${selectedOrg.orgName}」的下级组织` : "下级组织一览"}
          </CardTitle>
          <CardDescription className="text-xs leading-snug">点击行可切换到对应下级节点。</CardDescription>
        </CardHeader>
        <CardContent className="min-h-0 min-w-0 flex-1 overflow-auto px-2 pb-3 sm:px-4">
          {childOrgs.length === 0 ? (
            <p className="rounded-md border border-border bg-muted/20 px-3 py-8 text-center text-xs text-muted-foreground">
              {selectedOrg ? "当前节点无下级组织" : "请在左侧选择机构节点"}
            </p>
          ) : (
            <Table className="w-full table-fixed text-xs leading-snug">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-2 font-medium">组织名称</TableHead>
                  <TableHead className="w-[24%] px-2 font-medium">组织类型</TableHead>
                  <TableHead className="w-[20%] px-2 font-medium">年级</TableHead>
                  <TableHead className="w-20 px-2 font-medium">状态</TableHead>
                  <TableHead className="w-16 px-2 text-right font-medium">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {childOrgs.map((org) => (
                  <TableRow
                    key={org.orgId}
                    className="cursor-pointer"
                    onClick={() => onSelectId(org.orgId)}
                  >
                    <TableCell className="px-2 font-medium">{org.orgName}</TableCell>
                    <TableCell className="px-2">
                      {org.orgTypeId ? (
                        <span className="text-muted-foreground">{orgTypeLabels[org.orgTypeId] ?? "未命名类型"}</span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="px-2 text-muted-foreground">{formatOrgGradeCell(org, gradeLabels)}</TableCell>
                    <TableCell className="px-2">
                      <V2StatusBadge type="org" status={org.status} />
                    </TableCell>
                    <TableCell className="px-2 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectId(org.orgId);
                        }}
                      >
                        进入
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
