import type { AppViewMode, SystemNavItemDefinition } from "@/config/nav-config.types";
import { NAV_CONFIG } from "@/config/nav-config/matrix";
import { getStoredEnabledIdsForRole } from "@/config/nav-config/menu-config-storage";
import { isManagementPathAllowedForRole } from "@/lib/rbac/management-access";
import { UserRole } from "@/types/auth";

/** 超管菜单裁剪未勾选时仍保留的关键入口（与默认 `base` 中的 id 一致） */
const ALWAYS_INCLUDE_PRIMARY_NAV_ITEM_IDS = new Set<string>(["teacher-materials"]);

function getBasePrimaryNavItemsForRole(
  role: UserRole,
  viewMode: AppViewMode,
): readonly SystemNavItemDefinition[] {
  return NAV_CONFIG[role][viewMode];
}

function navPathOnly(href: string): string {
  return href.split("?")[0] || href;
}

function applyManagementPathPolicy(
  role: UserRole,
  base: readonly SystemNavItemDefinition[],
  items: readonly SystemNavItemDefinition[],
): readonly SystemNavItemDefinition[] {
  const pathOk = (item: SystemNavItemDefinition) =>
    isManagementPathAllowedForRole(navPathOnly(item.href), role);
  const policyItems = items.filter(pathOk);
  if (policyItems.length > 0) return policyItems;
  const fallback = base.filter(pathOk);
  return fallback.length > 0 ? fallback : base;
}

/**
 * 主导航项：优先套用 localStorage 中该角色的启用列表（与当前 viewMode 下的默认项求交集并保持默认顺序）；
 * 管理台再按 `isManagementPathAllowedForRole` 过滤，避免侧栏展示点击即被重定向的入口。
 */
export function getPrimaryNavItemsForRole(
  role: UserRole,
  viewMode: AppViewMode = "management",
): readonly SystemNavItemDefinition[] {
  const base = getBasePrimaryNavItemsForRole(role, viewMode);
  // 超管始终显示完整菜单，忽略 localStorage 配置
  if (role === UserRole.SUPER_ADMIN) {
    if (viewMode !== "management") return base;
    return applyManagementPathPolicy(role, base, base);
  }
  const withStorage =
    typeof window !== "undefined"
      ? (() => {
          const stored = getStoredEnabledIdsForRole(role);
          if (!stored) return base;
          const allow = new Set(stored);
          const filtered = base.filter(
            (item) => allow.has(item.id) || ALWAYS_INCLUDE_PRIMARY_NAV_ITEM_IDS.has(item.id),
          );
          return filtered.length > 0 ? filtered : base;
        })()
      : base;

  if (viewMode !== "management") return withStorage;
  return applyManagementPathPolicy(role, base, withStorage);
}
