import type { AppViewMode } from "@/config/nav-config.types";
import { NAV_CONFIG } from "@/config/nav-config/matrix";
import { UserRole, USER_ROLE_ORDER } from "@/types/auth";

// —— 超管菜单配置（localStorage，用）——

export const MENU_CONFIG_STORAGE_KEY = "bs-lab-admin-menu-config-v2";

/** 与 storage 事件配合：同标签页内需手动 dispatch */
export const MENU_CONFIG_CHANGED_EVENT = "bs-lab-menu-config-changed";

export type StoredMenuConfigMap = Partial<Record<UserRole, string[]>>;

export type SystemMenuModuleCatalogEntry = {
  id: string;
  label: string;
  modes: AppViewMode[];
};

function isUserRoleString(v: string): v is UserRole {
  return (USER_ROLE_ORDER as readonly string[]).includes(v);
}

/** 某角色在门户 + 管理台中可能出现的全部导航项 id（用于配置页校验） */
export function getNavModuleIdsForRole(role: UserRole): Set<string> {
  const s = new Set<string>();
  for (const item of NAV_CONFIG[role].portal) s.add(item.id);
  for (const item of NAV_CONFIG[role].management) s.add(item.id);
  return s;
}

/** 某角色管理台默认导航项 id（菜单配置页矩阵作用域） */
export function getManagementNavModuleIdsForRole(role: UserRole): Set<string> {
  return new Set(NAV_CONFIG[role].management.map((item) => item.id));
}

/**
 * 管理台勾选状态：与 `getPrimaryNavItemsForRole(role, "management")` 一致
 *（localStorage 与默认求交后若为空则回退为完整默认顺序）。
 */
export function readManagementMenuCheckedIds(role: UserRole): string[] {
  const base = NAV_CONFIG[role].management;
  const baseIds = base.map((item) => item.id);
  const map = readStoredMenuConfigMap();
  const stored = map?.[role]?.filter((id) => baseIds.includes(id));
  if (!stored || stored.length === 0) return [...baseIds];
  const order = new Map(baseIds.map((id, i) => [id, i]));
  const unique = [...new Set(stored)].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
  const filtered = base.filter((item) => unique.includes(item.id));
  return filtered.length > 0 ? filtered.map((item) => item.id) : [...baseIds];
}

/**
 * 读取超管页写入的菜单覆盖；仅在浏览器环境有效，SSR 恒为 null。
 */
export function readStoredMenuConfigMap(): StoredMenuConfigMap | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MENU_CONFIG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const out: StoredMenuConfigMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (!isUserRoleString(k)) continue;
      if (!Array.isArray(v)) continue;
      const ids = v.filter((x): x is string => typeof x === "string" && x.length > 0);
      if (ids.length > 0) out[k] = ids;
    }
    return Object.keys(out).length > 0 ? out : null;
  } catch {
    return null;
  }
}

export function getStoredEnabledIdsForRole(role: UserRole): string[] | null {
  const map = readStoredMenuConfigMap();
  if (!map) return null;
  const ids = map[role];
  return ids && ids.length > 0 ? ids : null;
}

/**
 * 将某角色启用的主导航项 id 写入 localStorage（仅保留该角色导航中存在的 id）。
 */
export function persistMenuConfigForRole(role: UserRole, enabledIds: readonly string[]): void {
  if (typeof window === "undefined") return;
  const allowed = getNavModuleIdsForRole(role);
  const sanitized = [...new Set(enabledIds.filter((id) => allowed.has(id)))];
  const prev = readStoredMenuConfigMap() ?? {};
  const next: StoredMenuConfigMap = { ...prev };
  if (sanitized.length === 0) {
    delete next[role];
  } else {
    next[role] = sanitized;
  }
  if (Object.keys(next).length === 0) {
    window.localStorage.removeItem(MENU_CONFIG_STORAGE_KEY);
  } else {
    window.localStorage.setItem(MENU_CONFIG_STORAGE_KEY, JSON.stringify(next));
  }
  window.dispatchEvent(new Event(MENU_CONFIG_CHANGED_EVENT));
}

/** 清空全部自定义菜单配置，恢复 nav-config 默认 */
export function clearAllMenuConfigFromStorage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MENU_CONFIG_STORAGE_KEY);
  window.dispatchEvent(new Event(MENU_CONFIG_CHANGED_EVENT));
}

/** 全系统出现过的功能模块（去重），供配置页矩阵展示 */
export function getSystemMenuModuleCatalog(): SystemMenuModuleCatalogEntry[] {
  const acc = new Map<string, { label: string; modes: Set<AppViewMode> }>();
  for (const role of USER_ROLE_ORDER) {
    for (const mode of ["portal", "management"] as AppViewMode[]) {
      for (const item of NAV_CONFIG[role][mode]) {
        const cur = acc.get(item.id);
        if (!cur) {
          acc.set(item.id, { label: item.label, modes: new Set([mode]) });
        } else {
          cur.modes.add(mode);
        }
      }
    }
  }
  return [...acc.entries()]
    .map(([id, v]) => ({
      id,
      label: v.label,
      modes: [...v.modes].sort(),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "zh-Hans-CN"));
}
