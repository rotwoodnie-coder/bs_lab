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

import type { CreateV2OrgTypeInput, PatchV2OrgTypeInput, V2OrgTypeItem } from "@/lib/v2/v2-org-type-api";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "create" | "edit";
  initial: V2OrgTypeItem | null;
  submitting: boolean;
  onSubmitCreate: (input: CreateV2OrgTypeInput) => Promise<void>;
  onSubmitPatch: (typeId: string, input: PatchV2OrgTypeInput) => Promise<void>;
}

export function OrgTypeFormDialog(props: Props) {
  const [typeName, setTypeName] = React.useState("");
  const [comments, setComments] = React.useState("");
  const [status, setStatus] = React.useState<"y" | "n">("y");
  const [sortOrder, setSortOrder] = React.useState("0");

  React.useEffect(() => {
    if (!props.open) return;
    if (props.mode === "edit" && props.initial) {
      setTypeName(props.initial.typeName);
      setComments(props.initial.comments ?? "");
      setStatus(props.initial.status === "n" ? "n" : "y");
      setSortOrder(props.initial.sortOrder != null ? String(props.initial.sortOrder) : "0");
    } else {
      setTypeName("");
      setComments("");
      setStatus("y");
      setSortOrder("0");
    }
  }, [props.open, props.mode, props.initial]);

  const submit = async () => {
    if (!typeName.trim()) return;
    const so = Number.parseInt(sortOrder, 10);
    const sort = Number.isFinite(so) ? so : 0;
    try {
      if (props.mode === "create") {
        await props.onSubmitCreate({
          typeName: typeName.trim(),
          comments: comments.trim() || null,
          status,
          sortOrder: sort,
        });
      } else if (props.initial) {
        await props.onSubmitPatch(props.initial.typeId, {
          typeName: typeName.trim(),
          comments: comments.trim() || null,
          status,
          sortOrder: sort,
        });
      }
      props.onOpenChange(false);
    } catch {
      /* Toast 由 hooks 处理 */
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{props.mode === "create" ? "新增组织类型" : "编辑组织类型"}</DialogTitle>
          <DialogDescription>
            对应表 <span className="font-mono">data_org_type</span>
            {props.mode === "create" ? (
              <>
                ；主键 <span className="font-mono">type_id</span> 由系统自动生成。
              </>
            ) : (
              <>；当前编辑 <span className="font-mono">type_id</span> 不可改。</>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="ot-name">类型名称 *</Label>
            <Input id="ot-name" value={typeName} onChange={(e) => setTypeName(e.target.value)} maxLength={60} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ot-comments">说明</Label>
            <Input id="ot-comments" value={comments} onChange={(e) => setComments(e.target.value)} maxLength={100} />
          </div>
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
            <Label htmlFor="ot-sort">排序</Label>
            <Input
              id="ot-sort"
              inputMode="numeric"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value.replace(/[^\d-]/g, ""))}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
            取消
          </Button>
          <Button type="button" disabled={!typeName.trim() || props.submitting} onClick={() => void submit()}>
            {props.submitting ? "提交中…" : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
