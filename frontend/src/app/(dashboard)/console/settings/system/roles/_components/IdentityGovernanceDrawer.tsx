"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  ScrollArea,
  sonnerToast,
} from "@bs-lab/ui";
import { AlertTriangle, Search, RefreshCw, Shield } from "@bs-lab/ui/icons";

import { useAuth } from "@/hooks/use-auth";
import { getConsoleUsersActor } from "@/lib/console/users/console-users.adapter";
import { USER_ROLE_OPTIONS, type RoleId } from "@/lib/console/users/types";
import {
  fetchV2AdminUserRoles,
  fixV2AdminUserIdentity,
  forceReloginAfterRoleSync,
  mapAdminUserRoleSyncErrorToToast,
  searchV2AdminUserIdentity,
  syncV2AdminUserRoles,
  type V2AdminIdentitySearchItem,
  type V2AdminUserRoleItem,
  type V2AdminUserRoleSyncItem,
} from "@/lib/v2/v2-admin-user-api";

function roleLabel(roleId: string | null | undefined): string {
  const found = USER_ROLE_OPTIONS.find((r) => r.id === roleId);
  return found?.label ?? String(roleId ?? "—");
}

export function IdentityGovernanceDrawer(props: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const auth = useAuth();
  const [keyword, setKeyword] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [items, setItems] = React.useState<V2AdminIdentitySearchItem[]>([]);
  const [selected, setSelected] = React.useState<V2AdminIdentitySearchItem | null>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [roles, setRoles] = React.useState<V2AdminUserRoleItem[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [resetOpen, setResetOpen] = React.useState(false);
  const [scanBusy, setScanBusy] = React.useState(false);

  const hasTeacher = roles.some((r) => r.roleId === "Role_Teacher" && r.isEnabled);
  const hasStudent = roles.some((r) => r.roleId === "Role_Student" && r.isEnabled);

  const loadSearch = React.useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setItems([]);
      return;
    }
    setSearching(true);
    try {
      const data = await searchV2AdminUserIdentity(getConsoleUsersActor(), trimmed);
      setItems(data.items);
    } catch (err) {
      sonnerToast.error("搜索失败", { description: err instanceof Error ? err.message : "请稍后重试" });
    } finally {
      setSearching(false);
    }
  }, []);

  React.useEffect(() => {
    if (!props.open) return;
    void loadSearch(keyword);
  }, [keyword, loadSearch, props.open]);

  const loadDetail = React.useCallback(async (item: V2AdminIdentitySearchItem) => {
    setSelected(item);
    setLoadingDetail(true);
    try {
      const data = await fetchV2AdminUserRoles(getConsoleUsersActor(), item.userId);
      setRoles(data.roles);
    } catch (err) {
      sonnerToast.error("加载身份详情失败", { description: err instanceof Error ? err.message : "请稍后重试" });
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const buildNextRoles = React.useCallback((override?: { removeSeqId?: string; add?: { roleId: RoleId; orgId: string | null }; defaultSeqId?: string; disableSeqId?: string }) => {
    const next: V2AdminUserRoleSyncItem[] = [];
    for (const r of roles) {
      if (!r.isEnabled) continue;
      if (override?.removeSeqId && r.seqId === override.removeSeqId) continue;
      if (override?.disableSeqId && r.seqId === override.disableSeqId) {
        next.push({ roleId: r.roleId as RoleId, orgId: r.orgId, isEnabled: false });
        continue;
      }
      next.push({ roleId: r.roleId as RoleId, orgId: r.orgId, isEnabled: true, setAsDefault: override?.defaultSeqId ? r.seqId === override.defaultSeqId : r.roleId === selected?.userRoleId });
    }
    if (override?.add) next.push({ roleId: override.add.roleId, orgId: override.add.orgId, isEnabled: true, setAsDefault: next.length === 0 });
    return next;
  }, [roles, selected?.userRoleId]);

  const syncRoles = async (nextRoles: V2AdminUserRoleSyncItem[]) => {
    if (!selected) return;
    setSaving(true);
    try {
      const result = await syncV2AdminUserRoles(getConsoleUsersActor(), selected.userId, nextRoles);
      sonnerToast.success("角色绑定已同步，账号将重新登录");
      await loadDetail(selected);
      forceReloginAfterRoleSync(result);
    } catch (err) {
      sonnerToast.error("保存失败", { description: mapAdminUserRoleSyncErrorToToast(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleResetTeacher = async () => {
    const teacher = roles.find((r) => r.roleId === "Role_Teacher" && r.isEnabled);
    if (!teacher) {
      sonnerToast.error("当前用户没有可保留的教师角色");
      return;
    }
    await syncRoles([{ roleId: "Role_Teacher", orgId: teacher.orgId, isEnabled: true, setAsDefault: true }]);
  };

  const handleFixIdentity = async () => {
    if (!selected) return;
    setScanBusy(true);
    try {
      const result = await fixV2AdminUserIdentity(getConsoleUsersActor(), selected.userId);
      sonnerToast.success("已清理学生绑定项");
      await loadDetail(selected);
      forceReloginAfterRoleSync(result);
    } catch (err) {
      sonnerToast.error("修复失败", { description: err instanceof Error ? err.message : "请稍后重试" });
    } finally {
      setScanBusy(false);
    }
  };

  const hasConflict = hasTeacher && hasStudent;

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="flex h-[calc(100vh-2rem)] max-w-[min(96rem,calc(100vw-1rem))] flex-col overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>身份治理</DialogTitle>
          <DialogDescription>搜索用户并查看其当前身份与角色绑定，保存后会强制作废旧会话。</DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[360px_1fr]">
          <div className="min-h-0 border-r border-border p-4">
            <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="按姓名或账号搜索" className="border-0 p-0 shadow-none focus-visible:ring-0" />
            </div>
            <ScrollArea className="mt-4 h-[calc(100vh-12rem)] pr-2">
              <div className="space-y-2">
                {searching ? <p className="px-1 text-sm text-muted-foreground">搜索中…</p> : null}
                {items.map((item) => (
                  <button
                    key={item.userId}
                    type="button"
                    onClick={() => void loadDetail(item)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${selected?.userId === item.userId ? "border-foreground bg-muted" : "border-border hover:bg-muted/50"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.userName}</span>
                      <Badge variant="secondary">{roleLabel(item.userRoleId)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.loginName} · {item.orgName ?? "未绑定组织"}</p>
                  </button>
                ))}
                {keyword.trim() && !searching && items.length === 0 ? <p className="px-1 text-sm text-muted-foreground">没有找到匹配用户</p> : null}
              </div>
            </ScrollArea>
          </div>

          <div className="min-h-0 p-4">
            {!selected ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">先搜索并选择一个用户</div>
            ) : (
              <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
                <div className="rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{selected.userName}</h3>
                      <p className="text-sm text-muted-foreground">{selected.loginName} · {selected.orgName ?? "未绑定组织"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">当前身份 {roleLabel(selected.userRoleId)}</Badge>
                      <Badge variant="secondary">绑定项 {roles.filter((r) => r.isEnabled).length}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                    <div>可登录身份：{selected.availableContexts?.length ? selected.availableContexts.map((c) => `${c.orgName ?? c.orgId ?? "—"} / ${c.roleName ?? c.roleId}`).join("；") : "暂无"}</div>
                    <div className="mt-1">角色绑定项：{selected.attachedRoleNames ?? "无"}</div>
                  </div>
                </div>

                {loadingDetail ? <div className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">加载身份中…</div> : null}

                <ScrollArea className="min-h-0 flex-1 pr-2">
                  <div className="space-y-3">
                    {roles.map((r) => (
                      <div key={r.seqId} className="rounded-2xl border border-border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{r.roleName ?? r.roleId}</span>
                              <Badge variant={r.isEnabled ? "secondary" : "outline"}>{r.isEnabled ? "启用" : "禁用"}</Badge>
                              {r.roleId === selected.userRoleId ? <Badge>默认登录角色</Badge> : null}
                            </div>
                            <p className="text-sm text-muted-foreground">绑定组织：{r.orgName ?? r.orgId ?? "—"}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => void syncRoles(roles.filter((x) => x.isEnabled).map((x) => ({ roleId: x.roleId as RoleId, orgId: x.orgId, isEnabled: true, setAsDefault: x.seqId === r.seqId }))) }>设为默认</Button>
                            <Button size="sm" variant="outline" onClick={() => void syncRoles(buildNextRoles({ disableSeqId: r.seqId }))}>禁用</Button>
                            <Button size="sm" variant="destructive" onClick={() => void syncRoles(buildNextRoles({ removeSeqId: r.seqId }))}>移除身份</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                  <Button variant="destructive" onClick={() => setResetOpen(true)} disabled={!hasTeacher || saving}>
                    <RefreshCw className="mr-2 size-4" /> 重置为教师纯净态
                  </Button>
                  <Button variant="outline" onClick={() => void loadDetail(selected)} disabled={saving}>刷新身份</Button>
                  <Button variant="outline" onClick={() => void handleFixIdentity()} disabled={!hasConflict || scanBusy}>
                    <Shield className="mr-2 size-4" /> 异常身份扫描并修复
                  </Button>
                </div>

                {hasConflict ? (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    当前用户已同时存在教师与学生身份，建议立即执行修复并重新登录。
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>关闭</Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent className="border-destructive/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="size-4" /> 危险操作：重置为教师纯净态</AlertDialogTitle>
            <AlertDialogDescription>
              该操作将仅保留教师角色并清除所有角色绑定，执行后会强制该用户重新登录。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setResetOpen(false); void handleResetTeacher(); }}>确认重置</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
