import type { AppViewMode } from "@/config/nav-config.types";
import { UserRole } from "@/types/auth";

/** 学生/家长默认门户；教师、教研员及管理员默认管理台 */
export function defaultViewModeForRole(role: UserRole): AppViewMode {
  switch (role) {
    case UserRole.STUDENT:
    case UserRole.PARENT:
      return "portal";
    default:
      return "management";
  }
}

/** 占位页 query：navId 用于侧栏高亮；path/title/role 用于文案展示 */
export function buildPlaceholderHref(params: {
  navId: string;
  canonicalPath: string;
  moduleTitle: string;
  role: UserRole;
}): string {
  const q = new URLSearchParams({
    navId: params.navId,
    path: params.canonicalPath,
    title: params.moduleTitle,
    role: params.role,
  });
  return `/placeholder?${q.toString()}`;
}
