/**
 * V2 角色 ID 常量定义
 *
 * 唯一真源：`data_role` 表（迁移 + 种子保证）：
 *   - 7 个宪法身份（Role_* 前缀）
 *   - Subj_* 影子角色（学科标签，由触发器自动同步）
 *
 * 使用规约：
 *   1. 所有业务代码中比较 role_id 时仅引用此文件常量，禁止硬编码字符串。
 *   2. 对小写旧格式（如 "teacher"）的兼容仅在 resolvePermissionCodes 中处理，
 *      新代码一律使用 Role_ 前缀格式。
 *   3. 职称（prefTitle）不是角色，不在本文件定义。
 */

// ─── 7 个宪法身份 ─────────────────────────────────────────
export const ROLE_IDS = {
  SYS_ADMIN: "Role_Sys_Admin",
  DISTRICT_ADMIN: "Role_District_Admin",
  SCHOOL_ADMIN: "Role_School_Admin",
  RESEARCHER: "Role_Researcher",
  TEACHER: "Role_Teacher",
  STUDENT: "Role_Student",
  PARENT: "Role_Parent",
} as const;

export type RoleId = (typeof ROLE_IDS)[keyof typeof ROLE_IDS];

/** 所有宪法身份 ID 的 Set（用于快速判准） */
export const ROLE_ID_SET = new Set<string>(Object.values(ROLE_IDS));

/** Subj_ 前缀正则 */
export const SUBJ_ROLE_RE = /^Subj_/;

/** 判断是否为宪法身份 */
export function isCoreRole(roleId: string): boolean {
  return ROLE_ID_SET.has(roleId);
}

/** 判断是否为学科影子角色 */
export function isSubjectRole(roleId: string): boolean {
  return SUBJ_ROLE_RE.test(roleId);
}

// ─── 小写兼容映射 ─────────────────────────────────────────
/** 旧格式 → 宪法格式映射表 */
const LEGACY_ROLE_MAP: Record<string, string> = {
  system_admin: ROLE_IDS.SYS_ADMIN,
  role_sys_admin: ROLE_IDS.SYS_ADMIN,
  district_admin: ROLE_IDS.DISTRICT_ADMIN,
  role_district_admin: ROLE_IDS.DISTRICT_ADMIN,
  school_admin: ROLE_IDS.SCHOOL_ADMIN,
  role_school_admin: ROLE_IDS.SCHOOL_ADMIN,
  researcher: ROLE_IDS.RESEARCHER,
  role_researcher: ROLE_IDS.RESEARCHER,
  teacher: ROLE_IDS.TEACHER,
  role_teacher: ROLE_IDS.TEACHER,
  student: ROLE_IDS.STUDENT,
  role_student: ROLE_IDS.STUDENT,
  parent: ROLE_IDS.PARENT,
  role_parent: ROLE_IDS.PARENT,
};

/**
 * 规范化 role_id：将旧格式（小写、无前缀）统一为 Role_ 前缀格式。
 * 已符合 Role_ 前缀或 Subj_ 前缀的直接原样返回。
 * 不认识的 role_id 返回 null（不自动回退）。
 */
export function normalizeRoleId(roleId: string | null | undefined): string | null {
  if (!roleId) return null;
  const trimmed = roleId.trim();
  if (trimmed.startsWith("Role_") || trimmed.startsWith("Subj_")) return trimmed;
  const lowered = trimmed.toLowerCase();
  return LEGACY_ROLE_MAP[lowered] ?? null;
}
