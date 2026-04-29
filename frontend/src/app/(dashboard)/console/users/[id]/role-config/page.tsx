"use client";

import * as React from "react";
import { useParams } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  sonnerToast,
} from "@bs-lab/ui";
import { AlertTriangle, Plus, RefreshCw, Trash2 } from "@bs-lab/ui/icons";

import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/hooks/use-auth";
import { PERMISSIONS } from "@/lib/auth/role-permissions";
import { USER_ROLE_OPTIONS, type RoleId } from "@/lib/console/users/types";
import { fetchV2SysOrgTree, type V2SysOrgItem } from "@/lib/v2/v2-sys-api";
import { fetchV2AdminUserRoles, forceReloginAfterRoleSync, mapAdminUserRoleSyncErrorToToast, syncV2AdminUserRoles, type V2AdminUserRoleItem, type V2AdminUserRoleSyncItem } from "@/lib/v2/v2-admin-user-api";
import { getConsoleUsersActor } from "@/lib/console/users/console-users.adapter";
import { can } from "@/lib/auth/role-permissions";

function buildOrgPathLabel(org: V2SysOrgItem, nameById: Map<string, string>): string {
  const ids = String(org.orgPath ?? "").split("/").map((s) => s.trim()).filter(Boolean);
  if (ids.length === 0) return org.orgName;
  return ids.map((id) => nameById.get(id) ?? id).join(" - ");
}

export default function UserRoleConfigPage() {
  const params = useParams<{ id: string }>();
  const userId = decodeURIComponent(String(params?.id ?? ""));
  const auth = useAuth();
  const canManage = can(auth.user, PERMISSIONS.USER_MANAGE);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [user, setUser] = React.useState<{ userId: string; userName: string; loginName: string; userOrgId: string | null; userRoleId: string | null; orgName: string | null; roleName: string | null } | null>(null);
  const [roles, setRoles] = React.useState<V2AdminUserRoleItem[]>([]);
  const [orgOptions, setOrgOptions] = React.useState<{ orgId: string; label: string }[]>([]);
  const [addOpen, setAddOpen] = React.useState(false);
  const [addRoleId, setAddRoleId] = React.useState<RoleId>("Role_Teacher");
  const [addOrgId, setAddOrgId] = React.useState<string>("");
  const [pendingRemoval, setPendingRemoval] = React.useState<V2AdminUserRoleItem | null>(null);
  const [warningOpen, setWarningOpen] = React.useState(false);
  const [warningPayload, setWarningPayload] = React.useState<V2AdminUserRoleSyncItem[] | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const actor = getConsoleUsersActor();
      const [detail, tree] = await Promise.all([fetchV2AdminUserRoles(actor, userId), fetchV2SysOrgTree(actor).catch(() => [])]);
      setUser(detail.user);
      setRoles(detail.roles);
      const nameById = new Map<string, string>(tree.map((r) => [r.orgId, String(r.orgName ?? "").trim() || r.orgId]));
      setOrgOptions(tree.map((r) => ({ orgId: r.orgId, label: buildOrgPathLabel(r, nameById) })));
      if (!addOrgId && tree[0]) setAddOrgId(tree[0].orgId);
    } catch (err) {
      sonnerToast.error("加载失败", { description: err instanceof Error ? err.message : "请稍后重试" });
    } finally {
      setLoading(false);
    }
  }, [addOrgId, userId]);

  React.useEffect(() => { void load(); }, [load]);

  const hasTeacher = roles.some((r) => r.roleId === "Role_Teacher" && r.isEnabled);
  const hasStudent = roles.some((r) => r.roleId === "Role_Student" && r.isEnabled);

  const syncRoles = async (nextRoles: V2AdminUserRoleSyncItem[]) => {
    setSaving(true);
    try {
      const result = await syncV2AdminUserRoles(getConsoleUsersActor(), userId, nextRoles);
      sonnerToast.success("角色已同步，登录态已失效");
      await load();
      setAddOpen(false);
      setWarningOpen(false);
      setWarningPayload(null);
      forceReloginAfterRoleSync(result);
    } catch (err) {
      sonnerToast.error("保存失败", { description: mapAdminUserRoleSyncErrorToToast(err) });
    } finally {
      setSaving(false);
    }
  };

  const buildNextRoles = React.useCallback((override?: { removeSeqId?: string; add?: { roleId: RoleId; orgId: string | null }; defaultSeqId?: string; disableSeqId?: string }) => {
    const next: V2AdminUserRoleSyncItem[] = [];
    for (const r of roles) {
      if (!r.isEnabled) continue;
      if (override?.removeSeqId && r.seqId === override.removeSeqId) continue;
      if (override?.disableSeqId && r.seqId === override.disableSeqId) {
        next.push({ roleId: r.roleId as RoleId, orgId: r.orgId, isEnabled: false });
        continue;
      }
      next.push({ roleId: r.roleId as RoleId, orgId: r.orgId, isEnabled: true, setAsDefault: override?.defaultSeqId ? r.seqId === override.defaultSeqId : r.roleId === user?.userRoleId });
    }
    if (override?.add) next.push({ roleId: override.add.roleId, orgId: override.add.orgId, isEnabled: true, setAsDefault: next.length === 0 });
    return next;
  }, [roles, user?.userRoleId]);

  const handleAdd = async () => {
    const nextRoles = buildNextRoles({ add: { roleId: addRoleId, orgId: addOrgId || null } });
    if (hasTeacher && addRoleId === "Role_Student") {
      setWarningPayload(nextRoles);
      setWarningOpen(true);
      return;
    }
    await syncRoles(nextRoles);
  };

  const applyWarningAdd = async () => {
    if (!warningPayload) return;
    await syncRoles(warningPayload);
  };

  const removeRole = async (item: V2AdminUserRoleItem) => {
    await syncRoles(buildNextRoles({ removeSeqId: item.seqId }));
  };

  const setDefault = async (item: V2AdminUserRoleItem) => {
    await syncRoles(roles.filter((r) => r.isEnabled).map((r) => ({ roleId: r.roleId as RoleId, orgId: r.orgId, isEnabled: true, setAsDefault: r.seqId === item.seqId })));
  };

  const disableRole = async (item: V2AdminUserRoleItem) => {
    await syncRoles(buildNextRoles({ disableSeqId: item.seqId }));
  };

  const resetTeacherPureState = async () => {
    const teacher = roles.find((r) => r.roleId === "Role_Teacher" && r.isEnabled);
    if (!teacher) {
      sonnerToast.error("当前用户没有可保留的教师角色");
      return;
    }
    await syncRoles([{ roleId: "Role_Teacher", orgId: teacher.orgId, isEnabled: true, setAsDefault: true }]);
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="用户角色治理"
        description="查看并维护 sys_user 主角色与 sys_user_role 绑定角色，支持默认角色、禁用与移除。"
        actions={
          <Button variant="destructive" className="gap-2" onClick={() => setResetConfirmOpen(true)} disabled={saving || !hasTeacher}>
            <RefreshCw className="size-4" /> 危险操作：一键重置为教师纯净态
          </Button>
        }
      />

      <div className="-mt-2 px-6 text-xs text-muted-foreground md:px-8">
        提示：若用户登录角色异常，请检查其主档角色并尝试一键重置。
      </div>

      <Card
        actions={
          <Button variant="destructive" className="gap-2" onClick={() => void resetTeacherPureState()} disabled={saving || !hasTeacher}>
            <RefreshCw className="size-4" /> 危险操作：一键重置为教师纯净态
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{user?.userName ?? "用户"}</CardTitle>
          <CardDescription>
            {user?.loginName ?? ""} · {user?.orgName ?? "未绑定组织"} · 主角色 {user?.roleName ?? user?.userRoleId ?? "—"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? <p className="text-sm text-muted-foreground">加载中…</p> : roles.length === 0 ? <p className="text-sm text-muted-foreground">暂无绑定角色</p> : (
            <div className="space-y-3">
              {roles.map((r) => (
                <div key={r.seqId} className="flex flex-col gap-3 rounded-xl border border-border p-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{r.roleName ?? r.roleId}</span>
                      <Badge variant={r.isEnabled ? "secondary" : "outline"}>{r.isEnabled ? "启用" : "禁用"}</Badge>
                      {r.roleId === user?.userRoleId ? <Badge variant="default">默认登录角色</Badge> : null}
                    </div>
                    <div className="text-sm text-muted-foreground">组织：{r.orgName ?? r.orgId ?? "—"}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => void setDefault(r)}>设为默认</Button>
                    <Button size="sm" variant="outline" onClick={() => void disableRole(r)}>禁用</Button>
                    <Button size="sm" variant="destructive" onClick={() => void removeRole(r)}>移除身份</Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="size-4" /> 添加角色
          </Button>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加新角色</DialogTitle>
            <DialogDescription>选择组织并分配角色。若该用户已拥有教师角色，再添加学生角色会触发强警告。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <div className="text-sm font-medium">组织</div>
              <Select value={addOrgId} onValueChange={setAddOrgId}>
                <SelectTrigger><SelectValue placeholder="选择组织" /></SelectTrigger>
                <SelectContent>{orgOptions.map((o) => <SelectItem key={o.orgId} value={o.orgId}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">角色</div>
              <Select value={addRoleId} onValueChange={(v) => setAddRoleId(v as RoleId)}>
                <SelectTrigger><SelectValue placeholder="选择角色" /></SelectTrigger>
                <SelectContent>{USER_ROLE_OPTIONS.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {hasTeacher && addRoleId === "Role_Student" ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                当前用户已拥有教师身份，继续添加学生身份可能导致登录角色混淆，请确认业务确实需要多角色。
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>取消</Button>
            <Button onClick={() => void handleAdd()} disabled={saving}>确认添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={warningOpen} onOpenChange={setWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="size-4 text-amber-500" /> 强警告：教师账号添加学生身份</AlertDialogTitle>
            <AlertDialogDescription>该用户已经存在教师角色，再添加学生角色会增加登录角色分拣复杂度。建议先确认是否为错误绑定。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => void applyWarningAdd()}>仍然添加</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent className="border-destructive/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="size-4" /> 危险操作：重置为教师纯净态</AlertDialogTitle>
            <AlertDialogDescription>
              该操作将仅保留教师角色并清除所有角色绑定，执行后会强制该用户重新登录。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setResetConfirmOpen(false); void resetTeacherPureState(); }}>确认重置</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(pendingRemoval)} onOpenChange={(open) => !open && setPendingRemoval(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Trash2 className="size-4 text-destructive" /> 移除身份</AlertDialogTitle>
            <AlertDialogDescription>确认移除 {pendingRemoval?.roleName ?? pendingRemoval?.roleId} 吗？此操作会同步失效该用户的登录 Session。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => void commitRemoval()}>确认移除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
