import * as React from "react";

import { sonnerToast } from "@bs-lab/ui";

import {
  ConsoleUsersMockError,
  createConsoleUser,
  fetchConsoleUserById,
  getConsoleUsersActor,
  updateConsoleUser,
} from "@/lib/console/users/console-users.adapter";
import { fetchV2SysOrgTree } from "@/lib/v2/v2-sys-api";
import type { ConsoleUserUpsertBody, RoleId, UserRecord } from "@/lib/console/users/types";
import type { V2SysOrgItem } from "@/lib/v2/v2-sys-api";

import { seedPermissionIds, type UserManagementStatus } from "./user-management.constants";

function buildOrgPathLabel(org: V2SysOrgItem, nameById: Map<string, string>): string {
  const path = String(org.orgPath ?? "").trim();
  const ids = path
    .split("/")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (ids.length === 0) return String(org.orgName ?? "").trim() || org.orgId;
  return ids.map((id) => nameById.get(id) ?? id).join(" - ");
}

function flattenOrgTree(tree: V2SysOrgItem[] | null | undefined, depth = 0): { orgId: string; label: string }[] {
  const rows: { orgId: string; label: string }[] = [];
  if (!Array.isArray(tree)) return rows;
  for (const node of tree) {
    rows.push({ orgId: node.orgId, label: `${"　".repeat(depth)}${node.orgName}` });
    if (node.children?.length) rows.push(...flattenOrgTree(node.children, depth + 1));
  }
  return rows;
}

function collectLeafOrgIds(tree: V2SysOrgItem[] | null | undefined): Set<string> {
  const leaves = new Set<string>();
  const walk = (nodes: V2SysOrgItem[]) => {
    for (const n of nodes) {
      const kids = Array.isArray(n.children) ? n.children : [];
      if (kids.length === 0) leaves.add(n.orgId);
      else walk(kids);
    }
  };
  if (Array.isArray(tree)) walk(tree);
  return leaves;
}

export function useUserDraft(args: { loadList: () => Promise<void>; selectedOrgId: string | null; orgTree: V2SysOrgItem[] }) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [savePending, setSavePending] = React.useState(false);

  const [draftUsername, setDraftUsername] = React.useState("");
  const [draftPassword, setDraftPassword] = React.useState("");
  const [draftExpireDate, setDraftExpireDate] = React.useState("");
  const [draftRealName, setDraftRealName] = React.useState("");
  const [draftNickname, setDraftNickname] = React.useState("");
  const [draftPhone, setDraftPhone] = React.useState("");
  const [draftEmail, setDraftEmail] = React.useState("");
  const [draftOrgId, setDraftOrgId] = React.useState("");
  const [orgOptions, setOrgOptions] = React.useState<{ orgId: string; label: string }[]>([]);
  const [draftRoles, setDraftRoles] = React.useState<RoleId[]>([]);
  const [draftStatus, setDraftStatus] = React.useState<UserManagementStatus>("正常");
  const [draftPermIds, setDraftPermIds] = React.useState<string[]>([]);

  const orgPathOptions = React.useMemo(() => flattenOrgTree(args.orgTree), [args.orgTree]);
  const leafOrgIds = React.useMemo(() => collectLeafOrgIds(args.orgTree), [args.orgTree]);
  const isStudent = draftRoles[0] === "Role_Student";
  const effectiveOrgOptions = React.useMemo(() => {
    if (!isStudent) return orgOptions;
    return orgOptions.filter((o) => leafOrgIds.has(o.orgId));
  }, [isStudent, leafOrgIds, orgOptions]);

  const resetDraftFromRow = React.useCallback((u: UserRecord) => {
    setDraftUsername(u.username);
    setDraftPassword("");
    setDraftExpireDate(u.expireDate ? String(u.expireDate).replace(" ", "T").slice(0, 16) : "");
    setDraftRealName(u.realName);
    setDraftNickname(u.nickname);
    setDraftPhone(u.phone);
    setDraftEmail(u.email);
    setDraftOrgId(u.orgId);
    setDraftRoles(u.roleIds.length ? [...u.roleIds] : ["Role_Teacher"]);
    setDraftStatus(u.status);
    setDraftPermIds(seedPermissionIds(u.roleIds));
  }, []);

  const resetDraftForCreate = React.useCallback(() => {
    setEditingId(null);
    setDraftUsername("");
    setDraftPassword("");
    setDraftExpireDate("");
    setDraftRealName("");
    setDraftNickname("");
    setDraftPhone("");
    setDraftEmail("");
    setDraftOrgId("");
    setDraftRoles(["Role_Teacher"]);
    setDraftStatus("正常");
    setDraftPermIds(seedPermissionIds(["Role_Student"]));
  }, []);

  const openForUser = React.useCallback(async (u: UserRecord | null) => {
    setDrawerOpen(true);
    if (!u) {
      resetDraftForCreate();
      setDetailLoading(false);
      return;
    }
    setEditingId(u.id);
    setDetailLoading(true);
    try {
      const row = await fetchConsoleUserById(u.id);
      if (!row) {
        sonnerToast.error("未找到该用户", { description: "可能已被删除，列表将刷新。" });
        setDrawerOpen(false);
        void args.loadList();
        return;
      }
      resetDraftFromRow(row);
    } finally {
      setDetailLoading(false);
    }
  }, [args, resetDraftForCreate, resetDraftFromRow]);

  /** sys_user.user_role_id 仅单值：以单选语义维护 draftRoles[0]。 */
  const setDraftRole = React.useCallback((id: RoleId) => {
    setDraftRoles([id]);
    setDraftPermIds(seedPermissionIds([id]));
  }, []);

  const togglePerm = React.useCallback((permId: string, checked: boolean) => {
    setDraftPermIds((prev) => {
      if (checked) return prev.includes(permId) ? prev : [...prev, permId];
      return prev.filter((x) => x !== permId);
    });
  }, []);

  const buildUpsertBody = React.useCallback((): ConsoleUserUpsertBody | null => {
    if (!draftUsername.trim()) return null;
    if (draftRoles.length === 0) return null;
    if (!draftOrgId.trim()) return null;

    return {
      username: draftUsername.trim(),
      passwordPlain: draftPassword.trim() || undefined,
      expireDate: draftExpireDate.trim() ? draftExpireDate.trim().replace("T", " ") : "",
      realName: draftRealName.trim(),
      nickname: draftNickname.trim(),
      phone: draftPhone.trim(),
      email: draftEmail.trim(),
      orgId: draftOrgId.trim(),
      roleIds: draftRoles,
      status: draftStatus,
    };
  }, [
    draftEmail,
    draftNickname,
    draftOrgId,
    draftPassword,
    draftPhone,
    draftRealName,
    draftRoles,
    draftStatus,
    draftUsername,
    draftExpireDate,
  ]);

  const saveUser = React.useCallback(async () => {
    const body = buildUpsertBody();
    if (!body) {
      if (!draftUsername.trim()) sonnerToast.error("请填写登录名");
      else if (!draftOrgId.trim()) sonnerToast.error("请选择所属组织（sys_user.user_org_id）");
      else if (draftRoles.length === 0) sonnerToast.error("请选择用户角色");
      return;
    }
    if (draftRoles[0] === "Role_Student" && !leafOrgIds.has(body.orgId)) {
      sonnerToast.error("学生必须归属到最后一层级（末级组织）");
      return;
    }

    setSavePending(true);
    try {
      if (editingId) {
        await updateConsoleUser(editingId, body);
        sonnerToast.success("用户信息已保存", { description: `已更新 ${editingId}` });
      } else {
        const created = await createConsoleUser(body);
        sonnerToast.success("用户已创建", { description: created.id });
      }
      setDrawerOpen(false);
      void args.loadList();
    } catch (err) {
      if (err instanceof ConsoleUsersMockError && err.status === 400) {
        sonnerToast.error(err.message);
        return;
      }
      if (err instanceof ConsoleUsersMockError && err.status === 409) {
        sonnerToast.error("保存失败", { description: err.message });
        return;
      }
      if (err instanceof ConsoleUsersMockError && err.status === 404) {
        sonnerToast.error("保存失败", { description: err.message });
        setDrawerOpen(false);
        void args.loadList();
        return;
      }
      sonnerToast.error("保存失败", { description: "请稍后重试。" });
    } finally {
      setSavePending(false);
    }
  }, [args, buildUpsertBody, draftOrgId, draftRoles.length, draftUsername, draftExpireDate, editingId]);

  React.useEffect(() => {
    if (!drawerOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchV2SysOrgTree(getConsoleUsersActor());
        if (cancelled) return;
        const nameById = new Map<string, string>(rows.map((r: V2SysOrgItem) => [r.orgId, String(r.orgName ?? "").trim() || r.orgId]));
        setOrgOptions(
          rows.map((r: V2SysOrgItem) => ({
            orgId: r.orgId,
            label: buildOrgPathLabel(r, nameById),
          })),
        );
      } catch {
        if (!cancelled) setOrgOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [drawerOpen]);

  React.useEffect(() => {
    if (!drawerOpen || editingId) return;
    if (draftOrgId.trim()) return;

    const preferredOrgId = args.selectedOrgId?.trim();
    if (preferredOrgId && orgPathOptions.some((o) => o.orgId === preferredOrgId)) {
      setDraftOrgId(preferredOrgId);
      return;
    }

    if (orgOptions.length > 0) {
      setDraftOrgId(orgOptions[0]!.orgId);
      return;
    }

    if (orgPathOptions.length > 0) {
      setDraftOrgId(orgPathOptions[0]!.orgId);
    }
  }, [args.selectedOrgId, draftOrgId, editingId, orgOptions, orgPathOptions, drawerOpen]);

  return {
    drawerOpen,
    setDrawerOpen,
    editingId,
    detailLoading,
    savePending,
    openForUser,
    saveUser,
    draftUsername,
    setDraftUsername,
    draftPassword,
    setDraftPassword,
    draftExpireDate,
    setDraftExpireDate,
    draftRealName,
    setDraftRealName,
    draftNickname,
    setDraftNickname,
    draftPhone,
    setDraftPhone,
    draftEmail,
    setDraftEmail,
    draftOrgId,
    setDraftOrgId,
    orgOptions: effectiveOrgOptions.length > 0 ? effectiveOrgOptions : orgPathOptions,
    draftRoles,
    draftStatus,
    setDraftStatus,
    draftPermIds,
    setDraftRole,
    togglePerm,
  };
}
