/** 与信息架构图「用户类别」分支一致（后续与后端 RBAC 对齐时可改为接口枚举） */
export const USER_ROLE_OPTIONS = [
  { id: "Role_Student", label: "学生" },
  { id: "Role_Parent", label: "家长" },
  { id: "Role_Teacher", label: "教师" },
  { id: "Role_Researcher", label: "教研员" },
  { id: "Role_School_Admin", label: "学校管理员" },
  { id: "Role_District_Admin", label: "区管理员" },
  { id: "Role_Sys_Admin", label: "超级管理员" },
] as const;

export type RoleId = (typeof USER_ROLE_OPTIONS)[number]["id"];

export type UserRecord = {
  id: string;
  username: string;
  /** 对应 sys_user.expire_date，NULL 表示永久有效 */
  expireDate: string | null;
  realName: string;
  nickname: string;
  /** 对应 sys_user.user_logo（S3 URL） */
  userLogo: string | null;
  phone: string;
  email: string;
  orgId: string;
  orgName: string;
  orgPath: string;
  roleIds: RoleId[];
  status: "正常" | "冻结";
  /** 角色字典名称（接口 JOIN） */
  roleName?: string | null;
  lastLoginTime?: string | null;
  /** 对应 sys_user.comments */
  comments?: string | null;
  /** 对应 sys_user.create_time */
  createTime?: string | null;
  /** 对应 sys_user.update_time */
  updateTime?: string | null;
};

export type ConsoleUserListQuery = {
  search?: string;
  roleId?: RoleId | "all";
  /** 与 GET /v2/sys-user 的 userOrgId 一致：仅匹配直属组织 */
  userOrgId?: string;
};

export type ConsoleUserUpsertBody = {
  username: string;
  passwordPlain?: string;
  /** 对应 sys_user.expire_date，空字符串表示不设置到期（永久有效） */
  expireDate: string;
  realName: string;
  nickname: string;
  phone: string;
  email: string;
  /** sys_user.user_org_id */
  orgId: string;
  roleIds: RoleId[];
  status: "正常" | "冻结";
};
