import { can, PERMISSIONS } from "@/lib/auth/role-permissions";
import type { AuthUser } from "@/hooks/use-auth";
import type { UserRole } from "@/types/auth";

/**
 * 归一化路径：解析 `..` 和 `.` 片段，防止 URL 参数绕过（如 /console/operations/../settings/system/users）。
 */
export function normalizePath(pathname: string): string {
  const path = pathname.split("?")[0] || pathname;
  const segments = path.split("/").filter(Boolean);
  const resolved: string[] = [];
  for (const seg of segments) {
    if (seg === ".") continue;
    if (seg === "..") {
      resolved.pop();
      continue;
    }
    resolved.push(seg);
  }
  return "/" + resolved.join("/");
}

/** 超级管理员：与治理场景下视为全站最高操作权限（与后端 Role_Sys_Admin 策略对齐）。 */
export function isSuperUserRole(role: UserRole): boolean {
  return role === "Role_Sys_Admin";
}

/** 与后端 `v2-admin-dict` 写入校验一致：仅区级管理员、超级管理员可增删改万能字典行。 */
export function canMutateAdminDict(user: AuthUser | null | undefined): boolean {
  return can(user, PERMISSIONS.SYSTEM_DICT_WRITE);
}

/** 实验材料库列表/卡片：学生与家长只读，其余身份可使用维护类按钮（写操作仍由接口校验）。 */
export function canMaintainExperimentalMaterialsLibrary(user: AuthUser | null | undefined): boolean {
  return can(user, PERMISSIONS.EXP_EDIT) || can(user, PERMISSIONS.EXP_CREATE);
}

/**
 * 管理工作台 RBAC：教研员 vs 校级管理员在「资源评审 / 校级治理」路由上互斥，
 * 其它角色（区管、超管等）为方便默认放行。
 */
export function canSeeAiConfig(role: UserRole): boolean {
  return role === "Role_Sys_Admin";
}

export function isManagementPathAllowedForRole(pathname: string, role: UserRole): boolean {
  // 注：先归一化路径，防止 `..` 绕过客户端守卫
  const path = normalizePath(pathname);

  // 运维中心：仅超管可访问
  if (path.startsWith("/console/operations/")) {
    return role === "Role_Sys_Admin";
  }

  if (role === "Role_School_Admin") {
    if (path.startsWith("/researcher")) return false;
    // 校管可审核学生作品，不可审核实验/课题组（05 方案）
    if (path.startsWith("/console/review/") && !path.startsWith("/console/review/student-works")) return false;
    return true;
  }

  if (role === "Role_Researcher") {
    if (path.startsWith("/console/settings/system")) return false;
    return true;
  }

  return true;
}

export function getManagementDeniedRedirectPath(role: UserRole): string {
  switch (role) {
    case "Role_School_Admin":
      return "/console/settings/system/organizations";
    case "Role_Researcher":
      return "/console/review/experiments";
    default:
      return "/";
  }
}

/** 实验流程「上架 / 下架」等治理操作（Mock 行内改状态） */
export function canManageExperimentShelfWorkflow(user: AuthUser | null | undefined): boolean {
  return can(user, PERMISSIONS.EXP_PUBLISH);
}

/** 实验课程管理页是否可编辑/删除（与后端 DELETE 路由权限一致：EXP_EDIT || EXP_DELETE） */
export function canMutateExperimentInManage(user: AuthUser | null | undefined): boolean {
  return can(user, PERMISSIONS.EXP_EDIT) || can(user, PERMISSIONS.EXP_DELETE);
}

/** 教材书架写入（与后端 `edu-textbooks:write` 对齐）：教研员、区级管理员、超级管理员 */
export function canWriteEduTextbooks(user: AuthUser | null | undefined): boolean {
  return can(user, PERMISSIONS.EXP_EDIT) || can(user, PERMISSIONS.EXP_PUBLISH);
}

/**
 * 材料名称（materials JSON）、步骤内容：教研员可改；区管/超管放行；教师与其它身份只读。
 */
export function canEditMaterialsAndStepContent(user: AuthUser | null | undefined): boolean {
  return can(user, PERMISSIONS.EXP_EDIT) || can(user, PERMISSIONS.EXP_CREATE);
}