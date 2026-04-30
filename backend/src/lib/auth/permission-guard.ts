import { buildPagePermissionCode } from "./page-permissions.ts";
import { resolvePermissionCodes, type Permission } from "./role-permissions.ts";

export class PermissionDeniedError extends Error {
  readonly permission: Permission;

  constructor(permission: Permission) {
    super(`权限不足：${permission}`);
    this.name = "PermissionDeniedError";
    this.permission = permission;
  }
}

function isSysAdmin(roleId: string | null | undefined): boolean {
  const r = (roleId ?? "").trim().toLowerCase();
  return r === "role_sys_admin" || r === "system_admin";
}

export function assertPermission(roleId: string | null | undefined, permission: Permission): void {
  if (isSysAdmin(roleId)) return;
  const permissions = resolvePermissionCodes(roleId);
  if (!permissions.includes(permission)) {
    throw new PermissionDeniedError(permission);
  }
}

export function assertAnyPermission(roleId: string | null | undefined, permissions: readonly Permission[]): void {
  if (isSysAdmin(roleId)) return;
  const owned = resolvePermissionCodes(roleId);
  if (!permissions.some((permission) => owned.includes(permission))) {
    throw new PermissionDeniedError(permissions[0] ?? ("unknown" as Permission));
  }
}

export function assertPageRead(roleId: string | null | undefined, menuCode: string): void {
  assertPermission(roleId, buildPagePermissionCode(menuCode, "READ"));
}

export function assertPageWrite(roleId: string | null | undefined, menuCode: string): void {
  assertPermission(roleId, buildPagePermissionCode(menuCode, "WRITE"));
}
