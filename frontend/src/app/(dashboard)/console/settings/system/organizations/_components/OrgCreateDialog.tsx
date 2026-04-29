"use client";

import * as React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bs-lab/ui";

import type { DictOption } from "@/lib/v2/v2-dict-adapter";
import type { CreateV2SysOrgInput } from "@/lib/v2/v2-sys-api";

import { resolveOrgTypeUiMode } from "../org-type-ui-mode";
import { OrgSchoolGradeMultiCheck } from "./OrgSchoolGradeMultiCheck";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  parentOrgName?: string;
  orgTypeOptions: DictOption[];
  gradeOptions: DictOption[];
  submitting: boolean;
  onSubmit: (input: CreateV2SysOrgInput) => Promise<void>;
}

export function OrgCreateDialog({
  open,
  onOpenChange,
  parentOrgName,
  orgTypeOptions,
  gradeOptions,
  submitting,
  onSubmit,
}: Props) {
  const [orgName, setOrgName] = React.useState("");
  const [orgTypeId, setOrgTypeId] = React.useState<string>("__none__");
  const [gradeId, setGradeId] = React.useState<string>("__none__");
  const [schoolGradeIds, setSchoolGradeIds] = React.useState<string[]>([]);
  const [status, setStatus] = React.useState<"y" | "n">("y");
  const [sortOrder, setSortOrder] = React.useState("0");

  const typeName = React.useMemo(() => {
    if (orgTypeId === "__none__") return null;
    return orgTypeOptions.find((t) => t.id === orgTypeId)?.name ?? null;
  }, [orgTypeId, orgTypeOptions]);

  const uiMode = React.useMemo(() => resolveOrgTypeUiMode(typeName), [typeName]);

  React.useEffect(() => {
    if (!open) {
      setOrgName("");
      setOrgTypeId("__none__");
      setGradeId("__none__");
      setSchoolGradeIds([]);
      setStatus("y");
      setSortOrder("0");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!orgName.trim()) return;
    const so = Number.parseInt(sortOrder, 10);
    const base: CreateV2SysOrgInput = {
      orgName: orgName.trim(),
      orgTypeId: orgTypeId === "__none__" ? undefined : orgTypeId,
      status,
      sortOrder: Number.isFinite(so) ? so : 0,
    };
    if (uiMode === "school") {
      base.gradeId = undefined;
      base.schoolGradeIds = [...schoolGradeIds];
    } else if (uiMode === "class") {
      base.gradeId = gradeId === "__none__" ? undefined : gradeId;
      base.schoolGradeIds = [];
    }
    await onSubmit(base);
  };

  const canSubmit = Boolean(orgName.trim()) && !submitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>新建组织</DialogTitle>
          <DialogDescription>
            {parentOrgName
              ? `将在「${parentOrgName}」下创建子节点。`
              : "未选中父节点时创建顶级组织。"}
            学校类可勾选多个开设年级；班级类选择单个年级。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="org-name">组织名称 *</Label>
            <Input
              id="org-name"
              placeholder="最长 60 字"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              maxLength={60}
            />
          </div>
          <div className="grid gap-2">
            <Label>组织类型</Label>
            <Select
              value={orgTypeId}
              onValueChange={(v) => {
                setOrgTypeId(v);
                const nm = v === "__none__" ? null : orgTypeOptions.find((t) => t.id === v)?.name ?? null;
                const m = resolveOrgTypeUiMode(nm);
                if (m === "school") setGradeId("__none__");
                if (m === "class") setSchoolGradeIds([]);
              }}
              disabled={orgTypeOptions.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={orgTypeOptions.length ? "可选" : "字典未加载"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">不填</SelectItem>
                {orgTypeOptions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {uiMode === "school" ? (
            <div className="grid gap-2">
              <Label>开设年级（可多选）</Label>
              <OrgSchoolGradeMultiCheck
                idPrefix="create-sg"
                gradeOptions={gradeOptions}
                value={schoolGradeIds}
                disabled={submitting}
                onChange={setSchoolGradeIds}
              />
            </div>
          ) : null}

          {uiMode === "class" ? (
            <div className="grid gap-2">
              <Label>年级</Label>
              <Select value={gradeId} onValueChange={setGradeId} disabled={gradeOptions.length === 0}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={gradeOptions.length ? "可选" : "字典未加载"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">不填</SelectItem>
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
            <p className="text-xs text-muted-foreground">当前类型不维护年级；若为学校或班级请先选择对应组织类型。</p>
          ) : null}

          <div className="grid gap-2">
            <Label>状态</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "y" | "n")}>
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
            <Label htmlFor="sort-order">排序</Label>
            <Input
              id="sort-order"
              inputMode="numeric"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value.replace(/[^\d-]/g, ""))}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="button" disabled={!canSubmit} onClick={() => void handleSubmit()}>
            {submitting ? "创建中…" : "确认创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
