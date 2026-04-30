import type { CoreApiActor } from "@/lib/core-api-shared";
import { createV2ApiService } from "@/lib/v2/apiService";

export type SysMenuRecord = {
  menuId: number;
  parentId: number | null;
  menuName: string;
  menuCode: string;
  menuType: string;
  path: string | null;
  component: string | null;
  sortOrder: number | null;
  status: string | null;
  comments: string | null;
};

export type RoleMenuPermissionRecord = {
  seqId: string;
  roleId: string;
  menuId: number;
  menuCode: string;
  menuName: string;
  path: string | null;
  canRead: boolean;
  canWrite: boolean;
};

export async function listSysMenus(actor: CoreApiActor): Promise<SysMenuRecord[]> {
  return createV2ApiService(actor).get<SysMenuRecord[]>("/v2/sys-menu");
}

export async function getRoleMenuPermissions(actor: CoreApiActor, roleId: string): Promise<{ roleId: string; items: RoleMenuPermissionRecord[] }> {
  return createV2ApiService(actor).get<{ roleId: string; items: RoleMenuPermissionRecord[] }>(`/v2/sys-role/${encodeURIComponent(roleId)}/permissions`);
}

export async function saveRoleMenuPermissions(actor: CoreApiActor, roleId: string, items: Array<{ menuId: number; canRead: boolean; canWrite: boolean }>): Promise<{ roleId: string; updated: number }> {
  return createV2ApiService(actor).put<{ roleId: string; updated: number }>(`/v2/sys-role/${encodeURIComponent(roleId)}/permissions`, { items });
}
