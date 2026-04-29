"use client";

import * as React from "react";
import {
  Button,
  Dialog,
  DialogContent,
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
  sonnerToast,
} from "@bs-lab/ui";

import type { V2DictItem } from "@/lib/v2/v2-exp-api";
import type { CreateV2ScaleTitleBody, PatchV2ScaleTitleBody, V2ScaleTitleItem } from "@/lib/v2/v2-scale-api";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "create" | "edit";
  initial: V2ScaleTitleItem | null;
  roleOptions: V2DictItem[];
  onSubmitCreate: (body: CreateV2ScaleTitleBody) => Promise<void>;
  onSubmitPatch: (seqId: string, body: PatchV2ScaleTitleBody) => Promise<void>;
};

export function ScaleTitleEditorSheet(props: Props) {
  const [roleId, setRoleId] = React.useState("");
  const [titleName, setTitleName] = React.useState("");
  const [scoreNum, setScoreNum] = React.useState("0");
  const [icon, setIcon] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!props.open) return;
    if (props.mode === "edit" && props.initial) {
      setRoleId(props.initial.roleId);
      setTitleName(props.initial.titleName);
      setScoreNum(String(props.initial.scoreNum));
      setIcon(props.initial.icon ?? "");
    } else {
      setRoleId("");
      setTitleName("");
      setScoreNum("0");
      setIcon("");
    }
  }, [props.open, props.mode, props.initial]);

  const runSubmit = async () => {
    if (!roleId.trim()) {
      sonnerToast.error("请选择角色");
      return;
    }
    if (!titleName.trim()) {
      sonnerToast.error("请填写称号名称");
      return;
    }
    const sn = Number.parseInt(scoreNum, 10);
    if (Number.isNaN(sn)) {
      sonnerToast.error("达标积分须为整数");
      return;
    }
    const iconVal = icon.trim() ? icon.trim() : null;
    setBusy(true);
    try {
      if (props.mode === "create") {
        const body: CreateV2ScaleTitleBody = {
          role_id: roleId.trim(),
          title_name: titleName.trim(),
          score_num: sn,
          icon: iconVal,
        };
        await props.onSubmitCreate(body);
      } else if (props.initial) {
        const body: PatchV2ScaleTitleBody = {
          role_id: roleId.trim(),
          title_name: titleName.trim(),
          score_num: sn,
          icon: iconVal,
        };
        await props.onSubmitPatch(props.initial.seqId, body);
      }
      props.onOpenChange(false);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{props.mode === "create" ? "新增称号规则" : "编辑称号规则"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>角色（data_role）</Label>
            <Select value={roleId || "__pick__"} onValueChange={(v) => setRoleId(v === "__pick__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="选择角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__pick__">请选择</SelectItem>
                {props.roleOptions.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-title">称号名称</Label>
            <Input id="st-title" value={titleName} onChange={(e) => setTitleName(e.target.value)} placeholder="例如：实验新星" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-score">达标积分下限</Label>
            <Input id="st-score" type="number" inputMode="numeric" value={scoreNum} onChange={(e) => setScoreNum(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-icon">图标 URL（可选）</Label>
            <Input id="st-icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="https://…" />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
            取消
          </Button>
          <Button type="button" disabled={busy} onClick={() => void runSubmit()}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
