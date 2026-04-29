import { UserRole } from "@/types/auth";

/** 实验工坊（/resources）模块能力（由超级管理员在环境中分配，可对接后续 ACL） */
export type ResourceCenterFeatures = {
  /** 侧栏显示「实验工坊」且可访问 /resources */
  moduleEnabled: boolean;
  /** 搜索与多条件筛选 */
  searchAndFilter: boolean;
  /** 打开资源预览（视频 / PDF / 压缩包） */
  preview: boolean;
  /** 导出资源目录（为 Toast） */
  exportCatalog: boolean;
  /** 显示「提交校本资源」类入口（） */
  submitResourceCta: boolean;
  /** 显示「前往资源评审」快捷入口（通常仅教研员） */
  reviewShortcut: boolean;
};

export const RESOURCE_CENTER_NAV_ID = "resource-center" as const;

/** 可使用实验工坊管理能力的身份（学生/家长默认不进入分配表） */
export const RESOURCE_CENTER_ADMIN_ROLES: readonly UserRole[] = [
  UserRole.TEACHER,
  UserRole.RESEARCHER,
  UserRole.SCHOOL_ADMIN,
  UserRole.DISTRICT_ADMIN,
  UserRole.SUPER_ADMIN,
] as const;

export type ResourceCenterPolicyOverrides = Partial<
  Record<UserRole, Partial<ResourceCenterFeatures>>
>;

export const RESOURCE_CENTER_POLICY_STORAGE_KEY = "bs-lab-resource-center-policy";

function allDisabled(): ResourceCenterFeatures {
  return {
    moduleEnabled: false,
    searchAndFilter: false,
    preview: false,
    exportCatalog: false,
    submitResourceCta: false,
    reviewShortcut: false,
  };
}

/** 系统默认矩阵：未持久化覆盖时使用 */
export function getDefaultResourceCenterFeatures(role: UserRole): ResourceCenterFeatures {
  if (!RESOURCE_CENTER_ADMIN_ROLES.includes(role)) {
    return allDisabled();
  }

  return {
    moduleEnabled: true,
    searchAndFilter: true,
    preview: true,
    exportCatalog:
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.DISTRICT_ADMIN ||
      role === UserRole.SCHOOL_ADMIN ||
      role === UserRole.RESEARCHER,
    submitResourceCta:
      role === UserRole.TEACHER ||
      role === UserRole.SCHOOL_ADMIN ||
      role === UserRole.SUPER_ADMIN,
    reviewShortcut:
      role === UserRole.RESEARCHER || role === UserRole.SUPER_ADMIN,
  };
}

export function mergeResourceCenterFeatures(
  role: UserRole,
  overrides: ResourceCenterPolicyOverrides | null,
): ResourceCenterFeatures {
  const base = getDefaultResourceCenterFeatures(role);
  const patch = overrides?.[role];
  if (!patch) return base;
  return { ...base, ...patch };
}

export function readResourceCenterPolicyOverrides(): ResourceCenterPolicyOverrides | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(RESOURCE_CENTER_POLICY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") return parsed as ResourceCenterPolicyOverrides;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeResourceCenterPolicyOverrides(overrides: ResourceCenterPolicyOverrides): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(RESOURCE_CENTER_POLICY_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    /* ignore */
  }
}

export function clearResourceCenterPolicyOverrides(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(RESOURCE_CENTER_POLICY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export const RESOURCE_CENTER_FEATURE_LABELS: {
  key: keyof ResourceCenterFeatures;
  label: string;
  description: string;
}[] = [
  { key: "moduleEnabled", label: "模块与导航", description: "侧栏入口与页面访问总开关" },
  { key: "searchAndFilter", label: "搜索与筛选", description: "关键词与学段/学科/类型筛选" },
  { key: "preview", label: "资源预览", description: "打开全屏/半屏预览" },
  { key: "exportCatalog", label: "导出目录", description: "导出当前列表（）" },
  { key: "submitResourceCta", label: "提交资源入口", description: "校本/校级提交入口（）" },
  { key: "reviewShortcut", label: "评审快捷入口", description: "跳转实验评审工作台" },
];
