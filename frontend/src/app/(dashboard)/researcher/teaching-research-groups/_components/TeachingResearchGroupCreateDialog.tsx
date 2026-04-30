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
  Switch,
} from "@bs-lab/ui";

import type { CoreApiActor } from "@/lib/core-api-shared";
import { fetchV2SchoolSubjects, type V2DictItem } from "@/lib/v2/v2-exp-api";

import { UserPickerField } from "@/components/business/user/UserPickerField";
import type { UserSearchSelection } from "@/components/business/user/UserSearchDialog";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  actor: CoreApiActor;
  submitting: boolean;
  onSubmit: (payload: {
    groupName: string;
    comments: string | null;
    subjectId: string | null;
    ownerId: string | null;
    status: "Y" | "N";
    createUserId: string;
  }) => Promise<void>;
};

export function TeachingResearchGroupCreateDialog({ open, onOpenChange, actor, submitting, onSubmit }: Props) {
  const [groupName, setGroupName] = React.useState("");
  const [comments, setComments] = React.useState("");
  const [status, setStatus] = React.useState<"Y" | "N">("Y");
  const [subjectId, setSubjectId] = React.useState("__none__");
  const [subjectList, setSubjectList] = React.useState<V2DictItem[]>([]);
  const [owner, setOwner] = React.useState<UserSearchSelection | null>(null);
  const creator = React.useMemo<UserSearchSelection>(() => ({ userId: actor.userId, userName: actor.userName, loginName: actor.userId, userRoleId: null, roleName: null, userOrgId: actor.orgId, orgName: null }), [actor]);

  React.useEffect(() => {
    if (!open) {
      setGroupName("");
      setComments("");
      setStatus("Y");
      setSubjectId("__none__");
      setOwner(null);
      return;
    }
    void fetchV2SchoolSubjects(actor).then(setSubjectList).catch(() => setSubjectList([]));
  }, [open, actor]);

  const submit = async () => {
    const name = groupName.trim();
    if (!name) return;
    await onSubmit({
      groupName: name,
      comments: comments.trim() || null,
      subjectId: subjectId && subjectId !== "__none__" ? subjectId : null,
      ownerId: owner?.userId ?? actor.userId,
      status,
      createUserId: actor.userId,
    });
  };

  const canSubmit = Boolean(groupName.trim()) && !submitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>新建教研组</DialogTitle>
          <DialogDescription>填写组名称、说明、学科、负责人与启停状态。创建人默认取当前登录用户。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="trg-name">组名称 *</Label>
            <Input id="trg-name" placeholder="请输入组名称" value={groupName} maxLength={60} onChange={(e) => setGroupName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="trg-comments">说明 / 备注</Label>
            <Input id="trg-comments" placeholder="请输入说明 / 备注" value={comments} maxLength={100} onChange={(e) => setComments(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="trg-subject">所属学科</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger id="trg-subject" className="w-full">
                <SelectValue placeholder="请选择学科" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">全部 / 未设置</SelectItem>
                {subjectList.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>负责人</Label>
            <UserPickerField actor={actor} value={owner} onChange={setOwner} label="选择负责人" placeholder="请选择负责人" />
            <p className="text-xs text-muted-foreground">创建后负责人可再转交。</p>
          </div>
          <div className="grid gap-2">
            <Label>创建人</Label>
            <Input readOnly value={`${creator.userName}（${creator.loginName}）`} />
            <p className="text-xs text-muted-foreground">创建人默认当前登录用户，仅作只读展示。</p>
          </div>
          <div className="flex items-center justify-between rounded border px-3 py-2">
            <div className="space-y-0.5">
              <Label htmlFor="trg-status" className="text-sm">状态</Label>
              <p className="text-xs text-muted-foreground">默认启用。</p>
            </div>
            <Switch id="trg-status" checked={status === "Y"} onCheckedChange={(checked) => setStatus(checked ? "Y" : "N")} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="button" disabled={!canSubmit} onClick={() => void submit()}>{submitting ? "保存中…" : "确认创建"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
