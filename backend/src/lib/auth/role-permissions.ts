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

export function resolvePermissionCodes(roleId: string | null | undefined): readonly Permission[] {
  const role = (roleId ?? "").trim().toLowerCase();
  if (!role) return [];
  // 兼容新格式 Role_* （migration_v2_role_id_fix）和旧格式（纯小写）
  if (role === "system_admin" || role === "role_sys_admin") return Object.values(PERMISSIONS);
  if (role === "district_admin" || role === "role_district_admin") return ROLE_PERMISSIONS_MAP.DISTRICT_ADMIN;
  if (role === "school_admin" || role === "role_school_admin") return ROLE_PERMISSIONS_MAP.SCHOOL_ADMIN;
  if (role === "researcher" || role === "role_researcher") return ROLE_PERMISSIONS_MAP.RESEARCHER;
  if (role === "teacher" || role === "role_teacher") return ROLE_PERMISSIONS_MAP.TEACHER;
  if (role === "student" || role === "role_student") return ROLE_PERMISSIONS_MAP.STUDENT;
  if (role === "parent" || role === "role_parent") return ROLE_PERMISSIONS_MAP.PARENT;
  return [];
}
