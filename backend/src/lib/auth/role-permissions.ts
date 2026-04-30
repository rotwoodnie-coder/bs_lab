import { buildPagePermissionCode, PAGE_PERMISSIONS } from "./page-permissions.ts";

export const PERMISSIONS = {
  EXP_VIEW: "exp_view",
  EXP_CREATE: "exp_create",
  EXP_EDIT: "exp_edit",
  EXP_DELETE: "exp_delete",
  EXP_PUBLISH: "exp_publish",
  TASK_GRADE: "task_grade",
  QUESTION_CREATE: "question_create",
  QUESTION_AUDIT: "question_audit",
  USER_MANAGE: "user_manage",
  ROLE_MANAGE: "role_manage",
  ORG_MANAGE: "org_manage",
  SYSTEM_DICT_WRITE: "system_dict_write",
  AI_GEN_QUESTION: "ai_gen_question",
  COURSEBOOK_MANAGE: "coursebook_manage",
  SCALE_MANAGE: "scale_manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS] | string;

export type PagePermissionEntry = {
  menuCode: string;
  read: boolean;
  write: boolean;
};

const PAGE_PERMISSION_STORE = new Map<string, PagePermissionEntry[]>();

export function setRolePagePermissions(roleId: string, items: PagePermissionEntry[]): void {
  const rid = String(roleId ?? "").trim();
  if (!rid) return;
  PAGE_PERMISSION_STORE.set(rid, items.map((item) => ({ ...item })));
}

export function clearRolePagePermissions(roleId: string): void {
  const rid = String(roleId ?? "").trim();
  if (!rid) return;
  PAGE_PERMISSION_STORE.delete(rid);
}

export function getRolePagePermissions(roleId: string | null | undefined): readonly PagePermissionEntry[] {
  const rid = String(roleId ?? "").trim();
  if (!rid) return [];
  return PAGE_PERMISSION_STORE.get(rid) ?? [];
}

export const ROLE_PERMISSIONS_MAP = {
  STUDENT: [PERMISSIONS.EXP_VIEW],
  PARENT: [PERMISSIONS.EXP_VIEW],
  TEACHER: [
    PERMISSIONS.EXP_VIEW,
    PERMISSIONS.EXP_CREATE,
    PERMISSIONS.EXP_EDIT,
    PERMISSIONS.TASK_GRADE,
    PERMISSIONS.QUESTION_CREATE,
    PERMISSIONS.AI_GEN_QUESTION,
    PERMISSIONS.COURSEBOOK_MANAGE,
  ],
  RESEARCHER: [
    PERMISSIONS.EXP_VIEW,
    PERMISSIONS.EXP_CREATE,
    PERMISSIONS.EXP_EDIT,
    PERMISSIONS.EXP_DELETE,
    PERMISSIONS.EXP_PUBLISH,
    PERMISSIONS.TASK_GRADE,
    PERMISSIONS.QUESTION_CREATE,
    PERMISSIONS.QUESTION_AUDIT,
    PERMISSIONS.AI_GEN_QUESTION,
    PERMISSIONS.SYSTEM_DICT_WRITE,
    PERMISSIONS.COURSEBOOK_MANAGE,
    PERMISSIONS.SCALE_MANAGE,
  ],
  SCHOOL_ADMIN: [
    PERMISSIONS.EXP_VIEW,
    PERMISSIONS.EXP_CREATE,
    PERMISSIONS.EXP_EDIT,
    PERMISSIONS.EXP_DELETE,
    PERMISSIONS.TASK_GRADE,
    PERMISSIONS.ROLE_MANAGE,
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.ORG_MANAGE,
    PERMISSIONS.COURSEBOOK_MANAGE,
    PERMISSIONS.SCALE_MANAGE,
  ],
  DISTRICT_ADMIN: [
    PERMISSIONS.EXP_VIEW,
    PERMISSIONS.EXP_CREATE,
    PERMISSIONS.EXP_EDIT,
    PERMISSIONS.EXP_DELETE,
    PERMISSIONS.EXP_PUBLISH,
    PERMISSIONS.TASK_GRADE,
    PERMISSIONS.QUESTION_CREATE,
    PERMISSIONS.QUESTION_AUDIT,
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.ROLE_MANAGE,
    PERMISSIONS.ORG_MANAGE,
    PERMISSIONS.SYSTEM_DICT_WRITE,
    PERMISSIONS.AI_GEN_QUESTION,
    PERMISSIONS.COURSEBOOK_MANAGE,
    PERMISSIONS.SCALE_MANAGE,
  ],
  SUPER_ADMIN: Object.values(PERMISSIONS),
} as const satisfies Record<string, readonly Permission[]>;

function buildDynamicPagePermissions(roleId: string): Permission[] {
  const pagePerms = getRolePagePermissions(roleId);
  if (pagePerms.length === 0) return [];
  const out: Permission[] = [];
  for (const p of pagePerms) {
    if (p.read) out.push(buildPagePermissionCode(p.menuCode, "READ"));
    if (p.write) out.push(buildPagePermissionCode(p.menuCode, "WRITE"));
  }
  return out;
}

export function resolvePermissionCodes(roleId: string | null | undefined): readonly Permission[] {
  const role = (roleId ?? "").trim().toLowerCase();
  if (!role) return [];
  // 兼容超级管理员，无条件放行。
  if (role === "system_admin" || role === "role_sys_admin") {
    return [...Object.values(PERMISSIONS), ...PAGE_PERMISSIONS.flatMap((p) => [buildPagePermissionCode(p.menuCode, "READ"), buildPagePermissionCode(p.menuCode, "WRITE")])];
  }
  if (role === "district_admin" || role === "role_district_admin") return [...ROLE_PERMISSIONS_MAP.DISTRICT_ADMIN, ...buildDynamicPagePermissions(roleId)];
  if (role === "school_admin" || role === "role_school_admin") return [...ROLE_PERMISSIONS_MAP.SCHOOL_ADMIN, ...buildDynamicPagePermissions(roleId)];
  if (role === "researcher" || role === "role_researcher") return [...ROLE_PERMISSIONS_MAP.RESEARCHER, ...buildDynamicPagePermissions(roleId)];
  if (role === "teacher" || role === "role_teacher") return [...ROLE_PERMISSIONS_MAP.TEACHER, ...buildDynamicPagePermissions(roleId)];
  if (role === "student" || role === "role_student") return [...ROLE_PERMISSIONS_MAP.STUDENT, ...buildDynamicPagePermissions(roleId)];
  if (role === "parent" || role === "role_parent") return [...ROLE_PERMISSIONS_MAP.PARENT, ...buildDynamicPagePermissions(roleId)];
  return buildDynamicPagePermissions(roleId);
}
