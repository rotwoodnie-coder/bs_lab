"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bs-lab/ui";

import type { DictOption } from "@/lib/v2/v2-dict-adapter";
import type { UpdateV2SysOrgInput, V2SysOrgItem } from "@/lib/v2/v2-sys-api";
import { V2_ORG_TYPE_IDS } from "@/lib/v2/v2-org-type-constants";

import { resolveOrgTypeModeById } from "../org-type-ui-mode";

function formatZhAuditTime(iso: string | null | undefined): string {
  if (iso === null || iso === undefined || iso === "") return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("zh-CN", { hour12: false });
}

function parentDisplayName(path: V2SysOrgItem[]): string {
  if (path.length > 1) return path[path.length - 2]!.orgName;
  return "无（根节点）";
}

function hierarchyPathText(path: V2SysOrgItem[]): string {
  if (path.length === 0) return "—";
  return path.map((p) => p.orgName).join(" › ");
}

export interface OrgCurrentNodeFormProps {
  selectedOrg: V2SysOrgItem;
  selectedPath: V2SysOrgItem[];
  orgTypeOptions: DictOption[];
  gradeOptions: DictOption[];
  submitting: boolean;
  onSave: (orgId: string, input: UpdateV2SysOrgInput) => Promise<void>;
}

export function OrgCurrentNodeForm({
  selectedOrg,
  selectedPath,
  orgTypeOptions,
  gradeOptions,
  submitting,
  onSave,
}: OrgCurrentNodeFormProps) {
  const [orgName, setOrgName] = React.useState("");
  const [orgTypeId, setOrgTypeId] = React.useState<string>("__none__");
  const [gradeId, setGradeId] = React.useState<string>("__none__");
  const [status, setStatus] = React.useState<"y" | "n">("y");
  const [sortOrder, setSortOrder] = React.useState("0");
  const [dirty, setDirty] = React.useState(false);

  const uiMode = React.useMemo(() => resolveOrgTypeModeById(orgTypeId === "__none__" ? null : orgTypeId), [orgTypeId]);

  /** 当前节点原始 orgTypeId（未修改前的） */
  const initialOrgTypeIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    setOrgName(selectedOrg.orgName);
    setOrgTypeId(selectedOrg.orgTypeId ?? "__none__");
    setGradeId(selectedOrg.gradeId ?? "__none__");
    setStatus(selectedOrg.status === "n" ? "n" : "y");
    setSortOrder(selectedOrg.sortOrder != null ? String(selectedOrg.sortOrder) : "0");
    initialOrgTypeIdRef.current = selectedOrg.orgTypeId ?? null;
    setDirty(false);
  }, [selectedOrg]);

  const schoolLikeTypeIds: string[] = [V2_ORG_TYPE_IDS.school, V2_ORG_TYPE_IDS.campus];
  const gradeLikeTypeIds: string[] = [V2_ORG_TYPE_IDS.grade, V2_ORG_TYPE_IDS.level];
  const classLikeTypeIds: string[] = [V2_ORG_TYPE_IDS.class];

  const buildPayload = (): UpdateV2SysOrgInput | null => {
    if (!orgName.trim()) return null;
    const so = Number.parseInt(sortOrder, 10);
    const currentTypeId = orgTypeId === "__none__" ? null : orgTypeId;
    const base: UpdateV2SysOrgInput = {
      orgName: orgName.trim(),
      orgTypeId: currentTypeId,
      status,
      sortOrder: Number.isFinite(so) ? so : 0,
    };
    if (uiMode === "school") {
      // 保留已有的校区/学校类型，避免把 Org_School_Campus 覆盖为 Org_School
      if (!currentTypeId || !schoolLikeTypeIds.includes(currentTypeId)) {
        base.orgTypeId = V2_ORG_TYPE_IDS.school;
      }
      return base;
    }
    if (uiMode === "grade") {
      if (!currentTypeId || !gradeLikeTypeIds.includes(currentTypeId)) {
        base.orgTypeId = V2_ORG_TYPE_IDS.grade;
      }
      base.gradeId = gradeId === "__none__" ? null : gradeId;
      base.schoolGradeIds = [];
      return base;
    }
    if (uiMode === "class") {
      if (!currentTypeId || !classLikeTypeIds.includes(currentTypeId)) {
        base.orgTypeId = V2_ORG_TYPE_IDS.class;
      }
      base.gradeId = gradeId === "__none__" ? null : gradeId;
      base.schoolGradeIds = [];
      return base;
    }
    return base;
  };

  const handleSave = async () => {
    const input = buildPayload();
    if (!input) return;
    await onSave(selectedOrg.orgId, input);
  };

  const canSave = Boolean(orgName.trim()) && !submitting;

  const resetForm = () => {
    setOrgName(selectedOrg.orgName);
    setOrgTypeId(selectedOrg.orgTypeId ?? "__none__");
    setGradeId(selectedOrg.gradeId ?? "__none__");
    setStatus(selectedOrg.status === "n" ? "n" : "y");
    setSortOrder(selectedOrg.sortOrder != null ? String(selectedOrg.sortOrder) : "0");
    setDirty(false);
  };

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">基础信息</CardTitle>
        <CardDescription className="text-xs">
          学校类组织的开设年级与班额请在右侧「年级与班级」中配置；此处保存名称、类型、状态与排序。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-md border border-border/80 bg-muted/15 px-3 py-3 text-sm sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-muted-foreground">层级路径</p>
            <p className="mt-1 text-foreground">{hierarchyPathText(selectedPath)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">上级组织</p>
            <p className="mt-1 text-foreground">{parentDisplayName(selectedPath)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">创建 / 更新时间</p>
            <p className="mt-1 text-xs leading-relaxed text-foreground">
              {formatZhAuditTime(selectedOrg.createTime)} · {formatZhAuditTime(selectedOrg.updateTime)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="panel-org-name">组织名称</Label>
            <Input
              id="panel-org-name"
              value={orgName}
              onChange={(e) => {
                setOrgName(e.target.value);
                setDirty(true);
              }}
              maxLength={60}
              disabled={submitting}
            />
          </div>
          <div className="grid gap-2">
            <Label>组织类型</Label>
            <Select
              value={orgTypeId}
              onValueChange={(v) => {
                setOrgTypeId(v);
                const m = resolveOrgTypeModeById(v === "__none__" ? null : v);
                if (m === "school" || m === "grade" || m === "class") setGradeId("__none__");
                setDirty(true);
              }}
              disabled={submitting || orgTypeOptions.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={orgTypeOptions.length ? "请选择" : "字典未加载"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">未指定</SelectItem>
                {orgTypeOptions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {uiMode === "school" ? (
            <p className="rounded-md border border-dashed border-border bg-muted/10 px-3 py-2 text-xs text-muted-foreground sm:col-span-2">
              不在此展示内部编号。请在右侧勾选各年级是否开设、填写班数，并使用「全选小学 / 初中 / 高中」快速填充，再保存架构。
            </p>
          ) : null}

          {(uiMode === "grade" || uiMode === "class") ? (
            <div className="grid gap-2 sm:col-span-2">
              <Label>年级</Label>
              <Select
                value={gradeId}
                onValueChange={(v) => {
                  setGradeId(v);
                  setDirty(true);
                }}
                disabled={submitting || gradeOptions.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={gradeOptions.length ? "请选择" : "字典未加载"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">未指定</SelectItem>
                  {gradeOptions.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {uiMode === "other" ? (
            <p className="text-xs text-muted-foreground sm:col-span-2">
              当前组织类型不维护年级字段（如教研室等）。若需为学校、年级或班级，请先调整组织类型。
            </p>
          ) : null}

          <div className="grid gap-2">
            <Label>状态</Label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as "y" | "n");
                setDirty(true);
              }}
              disabled={submitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="y">启用</SelectItem>
                <SelectItem value="n">停用</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="panel-sort-order">排序（数字越小越靠前）</Label>
            <Input
              id="panel-sort-order"
              inputMode="numeric"
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value.replace(/[^\d-]/g, ""));
                setDirty(true);
              }}
              disabled={submitting}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
          <Button type="button" variant="outline" size="sm" disabled={submitting || !dirty} onClick={resetForm}>
            撤销修改
          </Button>
          <Button type="button" size="sm" disabled={!canSave || !dirty} onClick={() => void handleSave()}>
            {submitting ? "保存中…" : "保存基础信息"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
