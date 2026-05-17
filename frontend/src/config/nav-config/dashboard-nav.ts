import { getPrimaryNavItemsForRole } from "@/config/nav-config/primary-nav";
import type { AppViewMode } from "@/config/nav-config.types";
import { UserRole } from "@/types/auth";

function pathMatchesNavHref(pathname: string, href: string): boolean {
  const base = href.split("?")[0];
  if (base === "/") return pathname === "/";
  return pathname === base || pathname.startsWith(`${base}/`);
}

/**
 * 门户模式下允许停留的路由：门户四项 + 个人中心/系统设置；`/placeholder` 需 navId 属于当前角色门户菜单。
 */
export function isRouteAllowedInPortal(
  pathname: string,
  searchParams: URLSearchParams | null,
  role: UserRole,
): boolean {
  if (pathname.startsWith("/profile") || pathname.startsWith("/settings") || pathname.startsWith("/messages"))
    return true;
  if (role === UserRole.PARENT && pathname.startsWith("/parent/")) return true;
  const portal = getPrimaryNavItemsForRole(role, "portal");
  for (const item of portal) {
    const base = item.href.split("?")[0];
    if (pathMatchesNavHref(pathname, base)) return true;
  }
  if (pathname.startsWith("/placeholder")) {
    const navId = searchParams?.get("navId");
    if (!navId) return false;
    return portal.some((p) => p.id === navId);
  }
  return false;
}

/**
 * 根据当前路径解析主导航高亮 id；`/placeholder` 依赖 query `navId`。
 */
export function resolveDashboardNavId(
  pathname: string,
  role: UserRole,
  searchParams: URLSearchParams | null,
  viewMode: AppViewMode = "management",
): string {
  if (pathname.startsWith("/messages")) return "messages";
  if (pathname.startsWith("/profile")) return "profile";
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/parent/tasks")) return "mgmt-parent-tasks";
  if (pathname.startsWith("/parent/sessions/")) return "parent-lab";
  if (pathname.startsWith("/parent/lab")) return "parent-lab";
  if (pathname.startsWith("/parent/child-progress")) return "parent-lab";

  /**
   * 门户模式：高亮只能来自门户主导航（与 `isRouteAllowedInPortal` 一致），
   * 否则在壳层尚未切入管理台前会解析出 `teacher-materials` 等仅存在于管理台的 id，侧栏无匹配项。
   */
  if (viewMode === "portal") {
    const portal = getPrimaryNavItemsForRole(role, "portal");
    if (pathname.startsWith("/placeholder")) {
      const navId = searchParams?.get("navId");
      if (navId && portal.some((p) => p.id === navId)) return navId;
      if (navId) return navId;
      return portal[0]?.id ?? "home";
    }
    for (const item of portal) {
      const base = item.href.split("?")[0];
      if (pathMatchesNavHref(pathname, base)) return item.id;
    }
    return portal[0]?.id ?? "home";
  }

  if (pathname.startsWith("/class/home")) return "mgmt-class";
  if (pathname.startsWith("/school/campus")) return "school-campus";
  if (pathname.startsWith("/console/settings/system/organizations")) return "sys-orgs";
  if (pathname.startsWith("/console/settings/system/users")) return "console-system-base";
  if (pathname.startsWith("/console/settings/system/roles")) return "sys-roles";
  if (pathname.startsWith("/system-manage/teacher-class")) return "my-classes";
  if (pathname.startsWith("/console/operations/notifications")) return "plat-notify";
  if (pathname.startsWith("/console/operations/deployments")) return "plat-deploy";
  if (pathname.startsWith("/console/operations/audit-log")) return "plat-audit";
  if (pathname.startsWith("/console/settings/education/subject-grades")) return "console-res-subject";
  if (pathname.startsWith("/console/settings/textbooks")) return "console-res-textbooks";
  if (pathname.startsWith("/console/settings/materials/teacher-materials")) return "console-cfg-teacher-material";
  if (pathname.startsWith("/console/settings/dictionaries")) return "console-cfg-dictionaries";
  if (pathname.startsWith("/console/settings/incentives")) return "console-cfg-incentives";
  if (pathname.startsWith("/console/settings/experiments")) return "console-res-experiments";
  if (pathname.startsWith("/console/review/experiments")) return "console-review-experiments";
  if (pathname.startsWith("/console/review/student-works")) return "console-review-student-works";
  if (pathname.startsWith("/console/review/research-groups")) return "console-review-research-groups";
  if (pathname.startsWith("/console/operations/ai-strategies")) return "console-ai-strategies";
  if (pathname.startsWith("/console/reports/templates")) return "console-reports-templates";
  if (pathname.startsWith("/console/analytics/district")) return "console-analytics-district";
  if (pathname.startsWith("/console/assessment/questions")) return "exp-question-bank";
  if (pathname.startsWith("/console/social/review")) return "console-social-review";
  if (pathname.startsWith("/console/social/dynamics")) return "console-social-dynamics";
  if (pathname.startsWith("/console/social/court")) return "console-social-court";
  if (pathname.startsWith("/console/social/topics-challenges")) return "console-social-topics";
  if (pathname.startsWith("/console/review/project-groups")) return "console-review-research-groups";
  if (pathname.startsWith("/district/overview")) return "dist-overview";
  if (pathname.startsWith("/admin/subject-config")) return "admin-subject-config";
  if (pathname.startsWith("/admin/simulation-dev")) return "admin-simulation-dev";
  if (pathname === "/workbench") return "wb-all";
  if (pathname.startsWith("/workbench/")) {
    const seg = (pathname.split("/")[2] ?? "").toUpperCase();
    if (seg === "STUDENT") return "wb-student";
    if (seg === "PARENT") return "wb-parent";
    if (seg === "TEACHER") return "wb-teacher";
    if (seg === "RESEARCHER") return "wb-researcher";
    if (seg === "SCHOOL_ADMIN") return "wb-school-admin";
    if (seg === "DISTRICT_ADMIN") return "wb-district-admin";
    if (seg === "SUPER_ADMIN") return "wb-super-admin";
    return "wb-teacher";
  }
  if (pathname.startsWith("/researcher/reviews")) return "researcher-reviews";
  if (pathname.startsWith("/researcher/teaching-research-groups")) return "researcher-teaching-research-groups";
  if (pathname.startsWith("/experimental-materials")) return "mgmt-materials-lib";
  if (pathname.startsWith("/teacher/question-bank")) return "exp-question-bank";
  if (pathname.startsWith("/student/experiment-challenge")) return "student-challenge";
  if (pathname.startsWith("/teacher/home")) return "teacher-home";
  if (pathname.startsWith("/teacher/assignments")) return "teacher-assignments";
  if (pathname.startsWith("/teacher/reports")) return "mgmt-grade";
  if (pathname.startsWith("/teacher/social")) return "community-court";
  if (pathname.startsWith("/teacher/materials")) return "teacher-materials";
  if (pathname.startsWith("/experiment-manage")) return "exp-mgmt";
  if (pathname.startsWith("/teacher/experiment-editor")) return "exp-mgmt";
  if (pathname.startsWith("/teacher/research-project-groups")) return "teacher-research-project-groups";
  if (pathname.startsWith("/admin/menu-config")) return "sys-roles";
  if (pathname.startsWith("/ai-assistant")) return "ai-assistant";

  const primary = getPrimaryNavItemsForRole(role, viewMode);

  if (pathname.startsWith("/placeholder")) {
    const navId = searchParams?.get("navId");
    if (navId && primary.some((p) => p.id === navId)) return navId;
    if (navId) return navId;
    return primary[0]?.id ?? "home";
  }

  for (const item of primary) {
    const base = item.href.split("?")[0];
    if (pathMatchesNavHref(pathname, base)) return item.id;
  }

  return primary[0]?.id ?? "home";
}
