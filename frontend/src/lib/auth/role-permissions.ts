import { type AuthUser } from "@/hooks/use-auth";

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

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS_MAP = {
  Role_Student: [PERMISSIONS.EXP_VIEW],
  Role_Parent: [PERMISSIONS.EXP_VIEW],
  Role_Teacher: [
    PERMISSIONS.EXP_VIEW,
    PERMISSIONS.EXP_CREATE,
    PERMISSIONS.EXP_EDIT,
    PERMISSIONS.TASK_GRADE,
    PERMISSIONS.QUESTION_CREATE,
    PERMISSIONS.AI_GEN_QUESTION,
    PERMISSIONS.COURSEBOOK_MANAGE,
  ],
  Role_Researcher: [
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
  Role_School_Admin: [
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
  Role_District_Admin: [
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
  Role_Sys_Admin: Object.values(PERMISSIONS),
} as const satisfies Record<string, readonly Permission[]>;

export function resolvePermissions(user: AuthUser | null | undefined): readonly Permission[] {
  if (!user) return [];
  const fromRole = ROLE_PERMISSIONS_MAP[user.role] ?? [];
  const fromApi = user.permissions?.length ? (user.permissions as readonly Permission[]) : null;
  /** 后端若只返回部分 capability，与角色基线求并，避免教师等丢失 `exp_view` 导致无法使用实验列表等只读能力 */
  if (!fromApi) return fromRole;
  return [...new Set([...fromRole, ...fromApi])];
}

export function can(user: AuthUser | null | undefined, permission: Permission): boolean {
  return resolvePermissions(user).includes(permission);
}

export function hasAnyPermission(
  user: AuthUser | null | undefined,
  permissions: readonly Permission[],
): boolean {
  const owned = resolvePermissions(user);
  return permissions.some((permission) => owned.includes(permission));
}

export function hasAllPermissions(
  user: AuthUser | null | undefined,
  permissions: readonly Permission[],
): boolean {
  const owned = resolvePermissions(user);
  return permissions.every((permission) => owned.includes(permission));
}
