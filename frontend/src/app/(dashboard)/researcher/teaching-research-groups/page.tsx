"use client";

import * as React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bs-lab/ui";
import { Grid2X2, List, MoreHorizontal, Plus, RefreshCw, School } from "@bs-lab/ui/icons";

import { UserRole } from "@/types/auth";
import { addSubjectGroupMember, patchSubjectGroup, removeSubjectGroupMember, transferSubjectGroupOwner } from "@/lib/v2/v2-group-api";
import { UserSearchDialog, type UserSearchSelection } from "@/components/business/user/UserSearchDialog";
import { sonnerToast } from "@bs-lab/ui";

import { TeachingResearchGroupCreateDialog } from "./_components/TeachingResearchGroupCreateDialog";
import { useTeachingResearchGroupsList } from "./page.hooks";

function statusLabel(status: string | null | undefined): string {
  return String(status ?? "Y").toUpperCase() === "N" ? "停用" : "启用";
}

function ActionMenuButton({ onEdit, onDelete, onMemberManage }: { onEdit: () => void; onDelete: () => void; onMemberManage: () => void; }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative inline-flex justify-end">
      <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => setOpen((v) => !v)}>
        <MoreHorizontal className="size-4" />
      </Button>
      {open ? (
        <div className="absolute right-0 top-9 z-10 min-w-32 rounded-md border border-border bg-background p-1 shadow-md">
          <button type="button" className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => { setOpen(false); onEdit(); }}>编辑</button>
          <button type="button" className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => { setOpen(false); onMemberManage(); }}>成员管理</button>
          <button type="button" className="block w-full rounded px-3 py-2 text-left text-sm text-destructive hover:bg-accent" onClick={() => { setOpen(false); onDelete(); }}>删除</button>
        </div>
      ) : null}
    </div>
  );
}

export default function ResearcherTeachingResearchGroupsPage() {
  const { actor, role, loading, refresh, rows, canCreate, createOpen, setCreateOpen, submitting, handleCreateSubmit, openEdit, openDelete, openMemberManage, selectedOrg, editOpen, deleteOpen, memberManageOpen, closeOrgDialogs, selectedMembers, membersLoading, reloadMembers } = useTeachingResearchGroupsList();
  const canOpenFullOrgTree = role === UserRole.DISTRICT_ADMIN || role === UserRole.SUPER_ADMIN;
  const [viewMode, setViewMode] = React.useState<"list" | "card">("list");
  const [memberPickerOpen, setMemberPickerOpen] = React.useState(false);
  const [ownerPickerOpen, setOwnerPickerOpen] = React.useState(false);
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [savingMember, setSavingMember] = React.useState(false);
  const [savingOwner, setSavingOwner] = React.useState(false);
  const [editName, setEditName] = React.useState("");
  const [editComments, setEditComments] = React.useState("");

  React.useEffect(() => {
    if (!selectedOrg) return;
    setEditName(selectedOrg.groupName);
    setEditComments(selectedOrg.comments ?? "");
  }, [selectedOrg]);

  const creatorDisplay = selectedOrg?.createUserName ?? "—";
  const ownerId = selectedOrg?.ownerId ?? null;
  const memberDisplayList = React.useMemo(() => {
    if (!selectedOrg) return { owner: null as null, rest: [] as typeof selectedMembers };
    const owner = ownerId ? selectedMembers.find((m) => m.userId === ownerId) : null;
    const rest = selectedMembers.filter((m) => !ownerId || m.userId !== ownerId);
    return { owner, rest };
  }, [ownerId, selectedMembers, selectedOrg]);
  const ownerDisplay = selectedOrg ? { userId: ownerId ?? "", userName: selectedOrg.ownerName ?? "—", loginName: selectedOrg.ownerLoginName ?? "", avatarUrl: memberDisplayList.owner?.avatarUrl ?? null } : null;

  const onEditSave = async () => {
    if (!selectedOrg) return;
    setSavingEdit(true);
    try {
      await patchSubjectGroup(actor, selectedOrg.groupId, { group_name: editName.trim(), comments: editComments.trim() || null, status: selectedOrg.status });
      sonnerToast.success("已保存教研组信息");
      closeOrgDialogs();
      await refresh();
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSavingEdit(false);
    }
  };

  const addMemberBySearch = async (user: UserSearchSelection) => {
    if (!selectedOrg) return;
    if (selectedMembers.some((m) => m.userId === user.userId)) {
      sonnerToast.warning("该成员已在当前教研组中");
      setMemberPickerOpen(false);
      return;
    }
    setSavingMember(true);
    try {
      await addSubjectGroupMember(actor, selectedOrg.groupId, user.userId);
      sonnerToast.success("已添加成员");
      await reloadMembers(selectedOrg.groupId);
      await refresh();
      setMemberPickerOpen(false);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "添加失败");
    } finally {
      setSavingMember(false);
    }
  };

  const transferOwnerBySearch = async (user: UserSearchSelection) => {
    if (!selectedOrg) return;
    setSavingOwner(true);
    try {
      await transferSubjectGroupOwner(actor, selectedOrg.groupId, user.userId);
      sonnerToast.success("已转交负责人");
      await refresh();
      setOwnerPickerOpen(false);
      closeOrgDialogs();
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "转交失败");
    } finally {
      setSavingOwner(false);
    }
  };

  const onRemoveMember = async (seqId: string) => {
    if (!selectedOrg) return;
    const target = selectedMembers.find((m) => m.seqId === seqId);
    const ok = window.confirm(`确认移除成员「${target?.userName ?? seqId}」吗？`);
    if (!ok) return;
    try {
      await removeSubjectGroupMember(actor, seqId);
      sonnerToast.success("已移除成员");
      await reloadMembers(selectedOrg.groupId);
      await refresh();
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "移除失败");
    }
  };

  const renderAvatar = (name: string, imageUrl?: string | null) => (
    <Avatar className="size-12 border border-border">
      {imageUrl ? <AvatarImage src={imageUrl} alt={name} /> : null}
      <AvatarFallback className="bg-primary/10 text-base font-medium text-primary">{name.trim().slice(0, 1) || "?"}</AvatarFallback>
    </Avatar>
  );

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <School className="size-6 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">教研组管理</h1>
          <Badge variant="secondary">弱组织化 Group</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">该页面用于维护弱组织化的业务分组，包括组基础信息、负责人、成员和状态管理，不依赖行政组织树。</p>
      </header>

      <Card className="border-border shadow-none">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">教研组列表</CardTitle>
              <CardDescription>支持列表视图和卡片视图切换，展示组名、负责人、成员管理、状态和操作。</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
                <Button type="button" variant={viewMode === "list" ? "default" : "ghost"} size="sm" className="gap-1" onClick={() => setViewMode("list")}><List className="size-4" />列表</Button>
                <Button type="button" variant={viewMode === "card" ? "default" : "ghost"} size="sm" className="gap-1" onClick={() => setViewMode("card")}><Grid2X2 className="size-4" />卡片</Button>
              </div>
              {canCreate ? <Button type="button" size="sm" className="gap-1" onClick={() => setCreateOpen(true)}><Plus className="size-4" aria-hidden />创建教研组</Button> : null}
              <Button type="button" variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}><RefreshCw className="mr-1 size-4" />刷新</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "list" ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">教研组名</TableHead>
                    <TableHead className="min-w-[160px]">负责人</TableHead>
                    <TableHead className="min-w-[140px]">成员管理</TableHead>
                    <TableHead className="w-[100px]">状态</TableHead>
                    <TableHead className="w-[88px] text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={5} className="text-sm text-muted-foreground">加载中…</TableCell></TableRow> : rows.length === 0 ? <TableRow><TableCell colSpan={5} className="text-sm text-muted-foreground">当前暂无教研组数据。{canCreate ? "可点击「创建教研组」进行创建。" : ""}</TableCell></TableRow> : rows.map((r) => (<TableRow key={r.groupId}><TableCell className="font-medium">{r.groupName}</TableCell><TableCell className="text-muted-foreground">{r.ownerName}</TableCell><TableCell className="text-muted-foreground">{r.memberCount} 人</TableCell><TableCell>{statusLabel(r.status)}</TableCell><TableCell className="text-right"><ActionMenuButton onEdit={() => openEdit(r)} onDelete={() => openDelete(r)} onMemberManage={() => openMemberManage(r)} /></TableCell></TableRow>))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {loading ? (
                <div className="col-span-full rounded-lg border border-dashed p-6 text-sm text-muted-foreground">加载中…</div>
              ) : rows.length === 0 ? (
                <div className="col-span-full rounded-lg border border-dashed p-6 text-sm text-muted-foreground">当前暂无教研组数据。{canCreate ? "可点击「创建教研组」进行创建。" : ""}</div>
              ) : rows.map((r) => (
                <Card key={r.groupId} className="border-border shadow-none">
                  <CardHeader className="space-y-2 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{r.groupName}</CardTitle>
                        <CardDescription>负责人：{r.ownerName}</CardDescription>
                      </div>
                      <Badge variant={r.status === "Y" ? "secondary" : "outline"}>{statusLabel(r.status)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                      <div>成员数</div><div className="text-right">{r.memberCount} 人</div>
                      <div>说明</div><div className="text-right">{r.comments ?? "—"}</div>
                      <div>创建人</div><div className="text-right">{creatorDisplay}</div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => openMemberManage(r)}>成员管理</Button>
                      <ActionMenuButton onEdit={() => openEdit(r)} onDelete={() => openDelete(r)} onMemberManage={() => openMemberManage(r)} /></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {canCreate ? <TeachingResearchGroupCreateDialog open={createOpen} onOpenChange={setCreateOpen} actor={actor} submitting={submitting} onSubmit={handleCreateSubmit} /> : null}
      <Dialog open={editOpen} onOpenChange={closeOrgDialogs}><DialogContent><DialogHeader><DialogTitle>编辑教研组</DialogTitle><DialogDescription>{selectedOrg ? `当前选中：${selectedOrg.groupName}` : "请选择一条记录后继续。"}</DialogDescription></DialogHeader><div className="grid gap-4 py-2"><div className="grid gap-2"><Label>组名</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div><div className="grid gap-2"><Label>说明</Label><Input value={editComments} onChange={(e) => setEditComments(e.target.value)} /></div><div className="grid gap-2"><Label>负责人</Label><Input value={selectedOrg?.ownerName ?? ""} readOnly /><Button type="button" variant="outline" onClick={() => setOwnerPickerOpen(true)}>选择负责人</Button></div></div><DialogFooter><Button type="button" variant="outline" onClick={closeOrgDialogs}>取消</Button><Button type="button" onClick={() => void onEditSave()} disabled={savingEdit}>{savingEdit ? "保存中…" : "保存"}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={memberManageOpen} onOpenChange={closeOrgDialogs}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>成员管理</DialogTitle>
            <DialogDescription>{selectedOrg ? `当前选中：${selectedOrg.groupName}` : "请选择一条记录后继续。"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" onClick={() => setMemberPickerOpen(true)} disabled={savingMember}>添加成员</Button>
              <Button type="button" variant="outline" onClick={() => setOwnerPickerOpen(true)} disabled={savingOwner}>转交负责人</Button>
            </div>

            <div className="grid gap-2">
              <Label>负责人</Label>
              <div className="rounded border p-3">
                <div className="flex items-center gap-3">
                  {renderAvatar(ownerDisplay?.userName ?? "—", ownerDisplay?.avatarUrl)}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-medium">{ownerDisplay?.userName ?? "—"}</div>
                      <Badge variant="secondary">负责人</Badge>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{ownerDisplay?.loginName ? `${ownerDisplay.loginName}` : ownerId ?? ""}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>成员（{selectedMembers.length}）</Label>
              <div className="max-h-80 overflow-y-auto rounded border p-3">
                {membersLoading ? (
                  <div className="text-sm text-muted-foreground">加载中…</div>
                ) : selectedMembers.length === 0 ? (
                  <div className="text-sm text-muted-foreground">暂无成员</div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                    {memberDisplayList.owner ? (
                      <div className="group relative rounded-lg border bg-muted/20 p-2">
                        <div className="flex flex-col items-center gap-2">
                          {renderAvatar(memberDisplayList.owner.userName, memberDisplayList.owner.avatarUrl)}
                          <div className="w-full">
                            <div className="truncate text-center text-xs font-medium">{memberDisplayList.owner.userName}</div>
                            <div className="truncate text-center text-[10px] text-muted-foreground">{memberDisplayList.owner.loginName}</div>
                          </div>
                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">负责人</Badge>
                        </div>
                      </div>
                    ) : null}
                    {memberDisplayList.rest.map((m) => (
                      <div key={m.seqId} className="group relative rounded-lg border p-2">
                        <div className="flex flex-col items-center gap-2">
                          {renderAvatar(m.userName, m.avatarUrl)}
                          <div className="w-full">
                            <div className="truncate text-center text-xs font-medium">{m.userName}</div>
                            <div className="truncate text-center text-[10px] text-muted-foreground">{m.loginName}</div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 w-full text-xs"
                            onClick={() => void onRemoveMember(m.seqId)}
                          >
                            移除
                          </Button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-2 text-muted-foreground hover:bg-accent"
                      onClick={() => setMemberPickerOpen(true)}
                      disabled={savingMember}
                    >
                      <div className="flex size-12 items-center justify-center rounded-full border bg-background">
                        <Plus className="size-5" />
                      </div>
                      <div className="text-xs">添加</div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeOrgDialogs}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteOpen} onOpenChange={closeOrgDialogs}><DialogContent><DialogHeader><DialogTitle>删除教研组</DialogTitle><DialogDescription>{selectedOrg ? `确认删除「${selectedOrg.groupName}」吗？` : "请选择一条记录后继续。"}</DialogDescription></DialogHeader><div className="py-4 text-sm text-muted-foreground">这里先保留删除确认壳，后续接入真实删除接口。</div><DialogFooter><Button type="button" variant="outline" onClick={closeOrgDialogs}>取消</Button><Button type="button" variant="destructive" onClick={closeOrgDialogs}>确认删除</Button></DialogFooter></DialogContent></Dialog>
      {selectedOrg ? <UserSearchDialog open={memberPickerOpen} onOpenChange={setMemberPickerOpen} actor={actor} title="选择成员" description="搜索姓名、账号或手机号，选择后加入当前教研组。" confirmLabel={savingMember ? "添加中…" : "添加成员"} onConfirm={(u) => void addMemberBySearch(u)} /> : null}
      {selectedOrg ? <UserSearchDialog open={ownerPickerOpen} onOpenChange={setOwnerPickerOpen} actor={actor} title="选择负责人" description="搜索姓名、账号或手机号，选择后转交负责人。" confirmLabel={savingOwner ? "转交中…" : "转交负责人"} onConfirm={(u) => void transferOwnerBySearch(u)} /> : null}
    </div>
  );
}
