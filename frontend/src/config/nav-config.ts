export type { AppViewMode, NavIconComponent, SystemNavItemDefinition } from "@/config/nav-config.types";

export { buildPlaceholderHref, defaultViewModeForRole } from "@/config/nav-config/defaults";

export {
  DASHBOARD_FOOTER_NAV,
  NAV_CONFIG,
  NAV_ITEMS,
  NAV_ITEMS_BY_USER_ROLE,
  PORTAL_NAV_ITEMS,
  SYSTEM_NAV_BY_ROLE,
} from "@/config/nav-config/matrix";

export {
  MENU_CONFIG_CHANGED_EVENT,
  MENU_CONFIG_STORAGE_KEY,
  clearAllMenuConfigFromStorage,
  getManagementNavModuleIdsForRole,
  getNavModuleIdsForRole,
  getSystemMenuModuleCatalog,
  persistMenuConfigForRole,
  readManagementMenuCheckedIds,
  readStoredMenuConfigMap,
} from "@/config/nav-config/menu-config-storage";

export type { StoredMenuConfigMap, SystemMenuModuleCatalogEntry } from "@/config/nav-config/menu-config-storage";

export { getPrimaryNavItemsForRole } from "@/config/nav-config/primary-nav";

export { isRouteAllowedInPortal, resolveDashboardNavId } from "@/config/nav-config/dashboard-nav";

export { findDashboardNavHref, findNavHref } from "@/config/nav-config/find-nav";

export { toAppShellNavItems } from "@/config/nav-config/to-app-shell-nav";

export { getStudentAccessiblePathPrefixes, isPathAccessibleByStudent } from "@/config/nav-config/student-path-access";

export { NAV_LABELS, getNavLabel } from "@/config/nav-config/nav-labels";
export type { NavLabelId } from "@/config/nav-config/nav-labels";
