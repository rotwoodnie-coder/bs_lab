"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Switch,
  sonnerToast,
} from "@bs-lab/ui";
import { Minus, Plus, UsersRound } from "@bs-lab/ui/icons";

import type { TeacherGroupRow } from "../page.hooks";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { fetchV2SchoolSubjects } from "@/lib/v2/v2-exp-api";
import { TeacherSearchDialog, type UserSearchSelection } from "@/components/business/user/TeacherSearchDialog";
import type { SubjectGroupMemberRecord } from "@/lib/v2/v2-group-api";

// ─── 编辑教研组弹窗 ────────────────────────────────

export function EditResearchGroupDialog(props: {
  target: TeacherGroupRow | null;
  onOpenChange: (open: boolean) => void;
  submitting: boolean;
  onSubmit: (groupId: string, input: { groupName: string; comments: string | null; status: "Y" | "N"; subjectId: string | null }) => void | Promise<void>;
  actor: CoreApiActor;
}) {
  const { target, onOpenChange, submitting, onSubmit, actor } = props;
  const open = Boolean(target);
  const [editName, setEditName] = React.useState("");
  const [editComments, setEditComments] = React.useState("");
  const [editStatus, setEditStatus] = React.useState<"Y" | "N">("Y");
  const [editSubjectId, setEditSubjectId] = React.useState<string>("__none__");
  const [subjectList, setSubjectList] = React.useState<{ id: string; name: string }[]>([]);

  React.useEffect(() => {
    if (target) {
      setEditName(target.groupName);
      setEditComments(target.comments ?? "");
      setEditStatus((target.status ?? "Y") === "Y" ? "Y" : "N");
      setEditSubjectId(target.subjectId ?? "__none__");
    }
  }, [target]);

  // 打开时加载学科列表
  React.useEffect(() => {
    if (open) {
      fetchV2SchoolSubjects(actor)
        .then((list) => setSubjectList(list.map((s) => ({ id: s.id, name: s.name }))))
        .catch(() => setSubjectList([]));
    }
  }, [open, actor]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑教研组</DialogTitle>
        </DialogHeader>
        {target ? (
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="rg-edit-name">名称</Label>
              <Input
                id="rg-edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={60}
                placeholder="请输入教研组名称"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rg-edit-comments">介绍说明</Label>
              <Input
                id="rg-edit-comments"
                value={editComments}
                onChange={(e) => setEditComments(e.target.value)}
                maxLength={100}
                placeholder="教研组说明/备注"
              />
            </div>
            <div className="grid gap-2">
              <Label>状态</Label>
              <div className="flex items-center gap-3">
                <Switch
                  id="rg-edit-status"
                  checked={editStatus === "Y"}
                  onCheckedChange={(v) => setEditStatus(v ? "Y" : "N")}
                />
                <Label htmlFor="rg-edit-status" className="text-sm text-muted-foreground">
                  {editStatus === "Y" ? "启用" : "停用"}
                </Label>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rg-edit-subject">学科</Label>
              <Select value={editSubjectId} onValueChange={setEditSubjectId}>
                <SelectTrigger id="rg-edit-subject">
                  <SelectValue placeholder="请选择学科（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">未设置</SelectItem>
                  {subjectList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            type="button"
            disabled={submitting || !target || !editName.trim()}
            onClick={() =>
              target &&
              void onSubmit(target.groupId, {
                groupName: editName.trim(),
                comments: editComments.trim() || null,
                status: editStatus,
                subjectId: editSubjectId && editSubjectId !== "__none__" ? editSubjectId : null,
              })
            }
          >
            {submitting ? "保存中…" : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 新建教研组弹窗 ──────────────────────────────────────

export function CreateResearchGroupDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submitting: boolean;
  onSubmit: (input: { groupName: string; comments: string | null; subjectId: string | null }) => void | Promise<void>;
}) {
  const { open, onOpenChange, submitting, onSubmit } = props;
  const [groupName, setGroupName] = React.useState("");
  const [comments, setComments] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setGroupName("");
      setComments("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>新建教研组</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="rg-create-name">
              名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="rg-create-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={60}
              placeholder="请输入教研组名称"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rg-create-comments">介绍说明</Label>
            <Input
              id="rg-create-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              maxLength={100}
              placeholder="教研组说明/备注（选填）"
            />
          </div>
          <div className="rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            创建后你将自动成为该教研组的负责人，可在详情中添加成员。
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            type="button"
            disabled={submitting || !groupName.trim()}
            onClick={() => void onSubmit({ groupName: groupName.trim(), comments: comments.trim() || null, subjectId: null })}
          >
            {submitting ? "创建中…" : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 添加成员弹窗（基于 UserSearchDialog） ─────────────────

export function AddMemberDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actor: CoreApiActor;
  excludeUserIds?: string[];
  onConfirm: (userId: string) => Promise<boolean>;
}) {
  const { open, onOpenChange, actor, excludeUserIds, onConfirm } = props;

  return (
    <TeacherSearchDialog
      open={open}
      onOpenChange={onOpenChange}
      actor={actor}
      excludeUserIds={excludeUserIds}
      title="添加成员"
      description="搜索姓名、账号或手机号后选择要添加的成员。"
      confirmLabel="添加"
      placeholder="输入姓名 / 账号 / 手机号"
      onConfirm={async (user) => {
        const ok = await onConfirm(user.userId);
        if (ok) onOpenChange(false);
      }}
    />
  );
}

// ─── 确认删除弹窗 ────────────────────────────────────────

export function ConfirmRemoveMemberDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberUserId: string;
  onConfirm: () => void | Promise<void>;
}) {
  const { open, onOpenChange, memberUserId, onConfirm } = props;
  const [submitting, setSubmitting] = React.useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>确认移除</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          确定将成员 <span className="font-medium text-foreground">{memberUserId}</span> 移出教研组？
        </p>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="button" variant="destructive" disabled={submitting} onClick={handleConfirm}>
            {submitting ? "移除中…" : "确认移除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 教研组详情 Sheet ────────────────────────────────────

export function GroupDetailSheet(props: {
  group: TeacherGroupRow | null;
  onOpenChange: (open: boolean) => void;
  members: SubjectGroupMemberRecord[];
  membersLoading: boolean;
  currentUserId: string;
  actor: CoreApiActor;
  onAddMember: (groupId: string, userId: string) => Promise<boolean>;
  onRemoveMember: (seqId: string) => Promise<boolean>;
}) {
  const { group, onOpenChange, members, membersLoading, currentUserId, actor, onAddMember, onRemoveMember } = props;
  const open = Boolean(group);
  const [addMemberOpen, setAddMemberOpen] = React.useState(false);
  const [removeTarget, setRemoveTarget] = React.useState<{ seqId: string; userId: string } | null>(null);

  const isAdmin =
    group != null &&
    (group.ownerId === currentUserId ||
      members.some((m) => m.userId === currentUserId && m.role === "ADMIN"));

  const handleRemove = async () => {
    if (!removeTarget) return;
    if (removeTarget.userId === currentUserId) {
      sonnerToast.error("不能移除自己");
      return;
    }
    await onRemoveMember(removeTarget.seqId);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle className="flex items-center gap-2">
              <UsersRound className="size-5 text-primary" />
              {group?.groupName ?? "教研组详情"}
            </SheetTitle>
          </SheetHeader>

          {group ? (
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4">
              {/* 基本信息 */}
              <section className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">基本信息</h4>
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/20 p-3 text-sm">
                  <div className="text-muted-foreground">负责人</div>
                  <div className="text-right font-medium">{group.ownerName ?? group.ownerId ?? "—"}</div>
                  <div className="text-muted-foreground">学科</div>
                  <div className="text-right">{group.subjectName ?? group.subjectId ?? "未设置"}</div>
                  <div className="text-muted-foreground">状态</div>
                  <div className="text-right">
                    <Badge variant={(group.status ?? "Y") === "Y" ? "secondary" : "outline"}>
                      {(group.status ?? "Y") === "Y" ? "启用" : "停用"}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">创建时间</div>
                  <div className="text-right">{group.createTime ?? "—"}</div>
                </div>
              </section>

              {/* 成员列表 */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">
                    成员列表
                    <span className="ml-1 text-xs text-muted-foreground">（{members.length} 人）</span>
                  </h4>
                  {isAdmin ? (
                    <Button size="sm" variant="outline" onClick={() => setAddMemberOpen(true)}>
                      <Plus className="mr-1 size-4" />
                      添加
                    </Button>
                  ) : null}
                </div>
                {membersLoading ? (
                  <p className="text-xs text-muted-foreground">加载中…</p>
                ) : members.length === 0 ? (
                  <p className="text-xs text-muted-foreground">暂无成员</p>
                ) : (
                  <ScrollArea className="max-h-52 rounded-lg border border-border">
                    <ul className="divide-y divide-border">
                      {members.map((m) => {
                        const badge = (m.userId ?? "?").slice(0, 2).toUpperCase();
                        return (
                          <li key={m.seqId} className="flex items-center gap-3 px-3 py-2">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {badge}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-foreground">{m.userId}</div>
                              <div className="text-xs text-muted-foreground">
                                {m.role === "ADMIN" ? "管理员" : "成员"}
                                {" · "}
                                {m.status === "Y" ? "已加入" : "已退出"}
                              </div>
                            </div>
                            {isAdmin && m.userId !== currentUserId ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="size-8 shrink-0 p-0 text-destructive hover:text-destructive"
                                onClick={() => setRemoveTarget({ seqId: m.seqId, userId: m.userId })}
                              >
                                <Minus className="size-4" />
                              </Button>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </ScrollArea>
                )}
              </section>

              {/* 组内共享资源列表（骨架） */}
              <section className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">组内共享资源</h4>
                <div className="rounded-lg border border-dashed border-border bg-muted/10 p-4 text-center text-xs text-muted-foreground">
                  <p>资源汇聚模块开发中</p>
                  <p className="mt-1">一期将接入实验列表、实验素材、实验材料库、实验课程、参考教材和实验题库。</p>
                </div>
              </section>

              {/* 共享记录（占位） */}
              <section className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">共享记录</h4>
                <div className="rounded-lg border border-dashed border-border bg-muted/10 p-4 text-center text-xs text-muted-foreground">
                  暂无共享记录
                </div>
              </section>
            </div>
          ) : null}

          <SheetFooter className="border-t border-border pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AddMemberDialog
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        actor={actor}
        excludeUserIds={members.map((m) => m.userId)}
        onConfirm={async (userId) => {
          if (!group) return false;
          return onAddMember(group.groupId, userId);
        }}
      />

      <ConfirmRemoveMemberDialog
        open={Boolean(removeTarget)}
        onOpenChange={(v) => { if (!v) setRemoveTarget(null); }}
        memberUserId={removeTarget?.userId ?? ""}
        onConfirm={handleRemove}
      />
    </>
  );
}
