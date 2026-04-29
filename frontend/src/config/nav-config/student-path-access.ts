import { DASHBOARD_FOOTER_NAV, NAV_CONFIG } from "@/config/nav-config/matrix";
import { UserRole } from "@/types/auth";

function stripHrefQuery(href: string): string {
  return href.split("?")[0];
}

/**
 * 学生默认可访问的路由前缀（来自门户 + 学生管理台 + 底部导航，不含 localStorage 菜单裁剪）。
 * 用于拦截学生手动输入教师/管理员等「管理类」URL。
 */
export function getStudentAccessiblePathPrefixes(): string[] {
  const s = new Set<string>();
  for (const mode of ["portal", "management"] as const) {
    for (const item of NAV_CONFIG[UserRole.STUDENT][mode]) {
      s.add(stripHrefQuery(item.href));
    }
  }
  for (const item of DASHBOARD_FOOTER_NAV) {
    s.add(stripHrefQuery(item.href));
  }
  return [...s];
}

/** 占位页在环境中对学生开放（内容由 query 约束） */
export function isPathAccessibleByStudent(pathname: string): boolean {
  const path = pathname.split("?")[0] || pathname;
  if (path.startsWith("/placeholder")) return true;
  const prefixes = getStudentAccessiblePathPrefixes();
  for (const p of prefixes) {
    if (p === "/") {
      if (path === "/" || path === "") return true;
      continue;
    }
    if (path === p || path.startsWith(`${p}/`)) return true;
  }
  return false;
}
