/**
 * 系统身份枚举（与导航、权限壳对齐；器与后续会话声明共用）。
 */
export const UserRole = {
  STUDENT: "Role_Student",
  PARENT: "Role_Parent",
  TEACHER: "Role_Teacher",
  RESEARCHER: "Role_Researcher",
  SCHOOL_ADMIN: "Role_School_Admin",
  DISTRICT_ADMIN: "Role_District_Admin",
  SUPER_ADMIN: "Role_Sys_Admin",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Select / 注册表遍历顺序 */
export const USER_ROLE_ORDER: readonly UserRole[] = [
  UserRole.STUDENT,
  UserRole.PARENT,
  UserRole.TEACHER,
  UserRole.RESEARCHER,
  UserRole.SCHOOL_ADMIN,
  UserRole.DISTRICT_ADMIN,
  UserRole.SUPER_ADMIN,
] as const;

export function userRoleLabelZh(role: UserRole): string {
  const map: Record<UserRole, string> = {
    [UserRole.STUDENT]: "学生",
    [UserRole.PARENT]: "家长",
    [UserRole.TEACHER]: "教师",
    [UserRole.RESEARCHER]: "教研员",
    [UserRole.SCHOOL_ADMIN]: "学校管理员",
    [UserRole.DISTRICT_ADMIN]: "区级管理员",
    [UserRole.SUPER_ADMIN]: "超级管理员",
  };
  return map[role];
}

export type RoleBadgeStyle = {
  variant: "default" | "secondary" | "destructive" | "outline";
  className?: string;
};

/** 顶栏身份徽标 */
export function parseUserRoleParam(value: string | null): UserRole | null {
  if (!value) return null;
  return (USER_ROLE_ORDER as readonly string[]).includes(value) ? (value as UserRole) : null;
}

export function roleBadgeStyle(role: UserRole): RoleBadgeStyle {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return { variant: "destructive" };
    case UserRole.RESEARCHER:
      return {
        variant: "outline",
        className:
          "border-violet-500/45 bg-violet-500/10 text-violet-800 dark:border-violet-400/40 dark:bg-violet-500/15 dark:text-violet-200",
      };
    case UserRole.DISTRICT_ADMIN:
      return {
        variant: "outline",
        className: "border-primary/40 bg-primary/5 text-primary",
      };
    case UserRole.SCHOOL_ADMIN:
      return { variant: "secondary" };
    case UserRole.TEACHER:
      return { variant: "default" };
    case UserRole.PARENT:
      return { variant: "outline" };
    case UserRole.STUDENT:
    default:
      return { variant: "secondary" };
  }
}
