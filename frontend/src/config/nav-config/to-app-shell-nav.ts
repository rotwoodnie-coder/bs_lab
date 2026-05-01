import * as React from "react";
import {
  BarChart3,
  BookOpen,
  Building2,
  ClipboardCheck,
  Layers,
  Server,
  Settings,
} from "@bs-lab/ui/icons";

import type { AppShellNavEntry, AppShellNavItem } from "@/components/layout/app-shell/types";
import type { SystemNavItemDefinition } from "@/config/nav-config.types";

/**
 * 将导航定义转为 AppShell 可用的项（图标统一尺寸，符合 @bs-lab/ui/icons 导出）。
 */
export function toAppShellNavItems(
  definitions: readonly SystemNavItemDefinition[],
): AppShellNavEntry[] {
  const base = definitions.map(({ Icon, id, label }) => ({
    id,
    label,
    icon: React.createElement(Icon, { className: "size-4" }),
  }));

  /** 账号、组织、工作台直达 */
  const SYSTEM_ACCOUNT_NAV_IDS = new Set([
    "console-system-base",
    "wb-all",
    "wb-student",
    "wb-parent",
    "wb-teacher",
    "wb-researcher",
    "wb-school-admin",
    "wb-district-admin",
    "wb-super-admin",
    "sys-orgs",
  ]);
  /** 教学维度、实验目录/材料子表配置、素材类型与角色、账号侧角色与通知审计等 */
  const SYSTEM_CONFIG_NAV_IDS = new Set([
    "console-cfg-teacher-material",
    "console-cfg-dictionaries",
    "console-cfg-incentives",
    "console-res-subject",
    "sys-roles",
    "plat-notify",
    "plat-deploy",
    "plat-audit",
  ]);

  const ORG_RELATED_IDS = new Set([
    "mgmt-class", // 班级管理
    "teacher-assignments", // 作业任务
    "mgmt-grade", // 报告批改
    "admin-subject-config", // 实验领域管理
    "teacher-research-project-groups", // 课题组管理（教师）
    "research-project-groups-console", // 课题组管理（运营/区级）
    "community-court", // 社区与法庭
    "console-social-review",
    "console-social-dynamics",
    "console-social-court",
    "console-social-topics",
    "console-review-student-works",
    "console-review-project-groups",
    "console-review-research-groups",
  ]);

  const EXP_RELATED_IDS = new Set([
    "researcher-teaching-research-groups", // 教研组管理（教研员）
    "exp-question-bank", // 实验题库（合并入口）
    "exp-mgmt", // 实验课程（台账与流转）
    "teacher-materials", // 实验素材库
    "mgmt-materials-lib", // 实验材料库
    "admin-simulation-dev", // 实验模拟（模拟开发管理）
    "console-res-textbooks",
    "console-res-experiments",
    "console-review-research-groups",
    "console-review-student-works",
    "console-review-experiments",
    "console-ai-strategies",
    "console-reports-templates",
    "console-analytics-district",
  ]);

  const systemAccountChildren = base.filter((i) => SYSTEM_ACCOUNT_NAV_IDS.has(i.id));
  const systemConfigChildren = base.filter((i) => SYSTEM_CONFIG_NAV_IDS.has(i.id));
  const orgChildrenRaw = base.filter((i) => ORG_RELATED_IDS.has(i.id));
  const expChildrenUnsorted = base.filter(
    (i) => EXP_RELATED_IDS.has(i.id) && !("children" in i),
  ) as AppShellNavItem[];

  const uniqById = <T extends { id: string }>(items: readonly T[]): T[] => {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const it of items) {
      if (seen.has(it.id)) continue;
      seen.add(it.id);
      out.push(it);
    }
    return out;
  };

  const mergeSimilar = <T extends { id: string }>(
    items: readonly T[],
    groups: readonly (readonly string[])[],
  ): T[] => {
    let out = uniqById(items);
    for (const g of groups) {
      const present = out.filter((i) => g.includes(i.id));
      if (present.length <= 1) continue;
      const keepId = g.find((id) => present.some((p) => p.id === id));
      if (!keepId) continue;
      out = out.filter((i) => !g.includes(i.id) || i.id === keepId);
    }
    return out;
  };

  const sortByIdOrder = <T extends { id: string; label: string }>(
    items: readonly T[],
    order: readonly string[],
  ): T[] => {
    const rank = new Map(order.map((id, idx) => [id, idx]));
    return [...items].sort((a, b) => {
      const ra = rank.get(a.id) ?? 999;
      const rb = rank.get(b.id) ?? 999;
      if (ra !== rb) return ra - rb;
      return a.label.localeCompare(b.label, "zh-Hans-CN");
    });
  };

  const orgChildrenMerged = mergeSimilar(orgChildrenRaw, [
    ["console-social-court", "community-court"],
    ["console-review-research-groups", "console-review-project-groups", "research-project-groups-console"],
  ]);
  const ORG_CHILD_ORDER: string[] = [
    "mgmt-class",
    "teacher-assignments",
    "mgmt-grade",
    "admin-subject-config",
    "teacher-research-project-groups",
    "console-review-research-groups",
    "console-review-project-groups",
    "console-review-student-works",
    "research-project-groups-console",
    "console-social-review",
    "console-social-dynamics",
    "console-social-court",
    "console-social-topics",
    "community-court",
  ];
  const orgChildren = sortByIdOrder(orgChildrenMerged, ORG_CHILD_ORDER);

  const SYSTEM_ACCOUNT_CHILD_ORDER: string[] = [
    "console-system-base",
    "wb-all",
    "wb-teacher",
    "wb-researcher",
    "wb-school-admin",
    "wb-district-admin",
    "wb-super-admin",
    "wb-student",
    "wb-parent",
    "sys-orgs",
  ];
  const SYSTEM_CONFIG_CHILD_ORDER: string[] = [
    "console-cfg-teacher-material",
    "console-cfg-dictionaries",
    "console-res-subject",
    "sys-roles",
    "console-cfg-incentives",
    "plat-notify",
    "plat-deploy",
    "plat-audit",
  ];
  const systemAccountChildrenSorted = sortByIdOrder(systemAccountChildren, SYSTEM_ACCOUNT_CHILD_ORDER);
  const systemConfigChildrenSorted = sortByIdOrder(systemConfigChildren, SYSTEM_CONFIG_CHILD_ORDER);
  const EXP_CHILD_ORDER: string[] = [
    "teacher-materials",
    "mgmt-materials-lib",
    "exp-mgmt",
    "admin-simulation-dev",
    "researcher-teaching-research-groups",
    "console-res-textbooks",
    "console-res-experiments",
    "console-review-research-groups",
    "console-review-student-works",
    "console-review-experiments",
    "exp-question-bank",
    "console-ai-strategies",
    "console-reports-templates",
    "console-analytics-district",
  ];
  const expOrder = new Map(EXP_CHILD_ORDER.map((id, idx) => [id, idx]));
  const expChildrenSorted = [...expChildrenUnsorted].sort((a, b) => {
    const pa = expOrder.get(a.id) ?? 999;
    const pb = expOrder.get(b.id) ?? 999;
    if (pa !== pb) return pa - pb;
    return a.label.localeCompare(b.label, "zh-Hans-CN");
  });
  const expById = new Map<string, AppShellNavItem>(expChildrenSorted.map((item) => [item.id, item]));
  const pickExp = (ids: readonly string[]) =>
    ids.map((id) => expById.get(id)).filter((item): item is AppShellNavItem => Boolean(item));
  const expChildren = [
    { id: "__section__exp-standards", label: "标准", icon: React.createElement(BookOpen, { className: "size-4" }) },
    ...pickExp(["console-res-textbooks", "console-res-experiments"]),
    { id: "__section__exp-production", label: "生产", icon: React.createElement(Layers, { className: "size-4" }) },
    ...pickExp(["teacher-materials", "mgmt-materials-lib", "exp-mgmt", "admin-simulation-dev"]),
    { id: "__section__exp-review", label: "测评与质控", icon: React.createElement(ClipboardCheck, { className: "size-4" }) },
    ...pickExp(["researcher-teaching-research-groups", "console-review-research-groups", "console-review-student-works", "console-review-experiments", "exp-question-bank"]),
    { id: "__section__exp-data", label: "数据", icon: React.createElement(BarChart3, { className: "size-4" }) },
    ...pickExp(["console-ai-strategies", "console-reports-templates", "console-analytics-district"]),
  ];
  if (
    systemAccountChildren.length === 0 &&
    systemConfigChildren.length === 0 &&
    orgChildren.length === 0 &&
    expChildren.length === 0
  ) {
    return base;
  }

  const kept = base.filter(
    (i) =>
      !SYSTEM_ACCOUNT_NAV_IDS.has(i.id) &&
      !SYSTEM_CONFIG_NAV_IDS.has(i.id) &&
      !EXP_RELATED_IDS.has(i.id) &&
      !ORG_RELATED_IDS.has(i.id),
  );

  const systemManagementGroup: AppShellNavEntry = {
    id: "system-management",
    label: "系统管理",
    icon: React.createElement(Server, { className: "size-4" }),
    children: systemAccountChildrenSorted,
  };

  const systemConfigGroup: AppShellNavEntry = {
    id: "system-config",
    label: "系统配置",
    icon: React.createElement(Settings, { className: "size-4" }),
    children: systemConfigChildrenSorted,
  };

  const orgGroup: AppShellNavEntry = {
    id: "org-management",
    label: "教学管理",
    icon: React.createElement(Building2, { className: "size-4" }),
    children: orgChildren,
  };

  const expGroup = {
    id: "exp-management",
    label: "实验管理",
    icon: React.createElement(Layers, { className: "size-4" }),
    children: expChildren,
  } as const satisfies AppShellNavEntry;

  const insertSystemMgmtAt = base.findIndex((i) => i.id === "console-system-base");
  const insertSystemConfigAt = base.reduce((min, item, idx) => {
    if (!SYSTEM_CONFIG_NAV_IDS.has(item.id)) return min;
    if (min < 0) return idx;
    return Math.min(min, idx);
  }, -1);
  const insertOrgAt = base.findIndex((i) => i.id === "mgmt-class");
  const insertExpAt = base.findIndex((i) => EXP_RELATED_IDS.has(i.id));
  const out: AppShellNavEntry[] = [...kept];
  const systemInserts: { idx: number; entry: AppShellNavEntry }[] = [];
  if (systemConfigChildrenSorted.length > 0) {
    systemInserts.push({
      idx: insertSystemConfigAt,
      entry: systemConfigGroup,
    });
  }
  if (systemAccountChildrenSorted.length > 0) {
    systemInserts.push({
      idx: insertSystemMgmtAt,
      entry: systemManagementGroup,
    });
  }
  systemInserts.sort((a, b) => b.idx - a.idx);
  for (const { idx, entry } of systemInserts) {
    out.splice(idx < 0 ? 0 : Math.max(0, idx), 0, entry);
  }
  if (orgChildren.length > 0) {
    const idx = insertOrgAt < 0 ? out.length : Math.max(0, insertOrgAt);
    out.splice(idx, 0, orgGroup);
  }
  if (expChildren.length > 0) {
    const baseIndex = insertExpAt < 0 ? 0 : Math.max(0, insertExpAt);
    out.splice(baseIndex, 0, expGroup);
  }

  const TOP_LEVEL_PRIORITY: Record<string, number> = {
    "exp-management": 10,
    "org-management": 20,
    "system-config": 25,
    "system-management": 30,
    "dist-overview": 999,
  };
  const priorityOf = (entry: AppShellNavEntry): number =>
    TOP_LEVEL_PRIORITY[entry.id] ?? 0;

  return out
    .map((entry, idx) => ({ entry, idx }))
    .sort((a, b) => {
      const pa = priorityOf(a.entry);
      const pb = priorityOf(b.entry);
      if (pa !== pb) return pa - pb;
      return a.idx - b.idx;
    })
    .map((x) => x.entry);
}
