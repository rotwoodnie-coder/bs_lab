import { DASHBOARD_FOOTER_NAV } from "@/config/nav-config/matrix";
import { getPrimaryNavItemsForRole } from "@/config/nav-config/primary-nav";
import type { AppViewMode, SystemNavItemDefinition } from "@/config/nav-config.types";
import type { UserRole } from "@/types/auth";

export function findNavHref(
  definitions: readonly SystemNavItemDefinition[],
  navId: string,
): string | undefined {
  return definitions.find((d) => d.id === navId)?.href;
}

export function findDashboardNavHref(
  role: UserRole,
  navId: string,
  viewMode: AppViewMode = "management",
): string | undefined {
  const primary = getPrimaryNavItemsForRole(role, viewMode);
  return findNavHref(primary, navId) ?? findNavHref(DASHBOARD_FOOTER_NAV, navId);
}
