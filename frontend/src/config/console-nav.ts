import { UserRole } from "@/types/auth";

/**
 * Console 路由的导航定义（现已不再渲染二级侧栏，仅用于面包屑与查找）。
 */
export type ConsoleNavLeaf = {
  id: string;
  label: string;
  href: string;
};

export type ConsoleNavGroup = {
  id: string;
  label: string;
  items: readonly ConsoleNavLeaf[];
};

/** URL 分面：保留用于面包屑根节点（历史兼容） */
export type ConsoleFacet = "ops" | "system";

/**
 * 运营侧：教研评审、AI 引导、社区与法庭、实验报告、数据一览。
 */
export const CONSOLE_OPS_NAV_GROUPS: readonly ConsoleNavGroup[] = [
  {
    id: "governance",
    label: "教研与评审",
    items: [
      {
        id: "exp-curriculum-review",
        label: "实验评审",
        href: "/console/review/experiments",
      },
      {
        id: "student-works-review",
        label: "作品审核",
        href: "/console/review/student-works",
      },
      {
        id: "project-group-review",
        label: "课题组审核",
        href: "/console/review/research-groups",
      },
      {
        id: "teaching-research-groups",
        label: "教研组管理",
        href: "/researcher/teaching-research-groups",
      },
    ],
  },
  {
    id: "ai",
    label: "AI 实验引导",
    items: [
      {
        id: "ai-strategies",
        label: "AI 引导语与策略",
        href: "/console/operations/ai-strategies",
      },
    ],
  },
  {
    id: "community",
    label: "社区动态（法庭）",
    items: [
      {
        id: "soc-review",
        label: "评价与审核",
        href: "/console/social/review",
      },
      {
        id: "soc-feed",
        label: "实验圈动态",
        href: "/console/social/dynamics",
      },
      {
        id: "court-cases",
        label: "小法庭",
        href: "/console/social/court",
      },
      {
        id: "soc-topics-challenges",
        label: "话题与挑战",
        href: "/console/social/topics-challenges",
      },
    ],
  },
  {
    id: "reports",
    label: "实验报告",
    items: [
      {
        id: "rep-templates",
        label: "发给家长的实验报告",
        href: "/console/reports/templates",
      },
    ],
  },
  {
    id: "analytics",
    label: "数据大盘",
    items: [
      {
        id: "ana-district",
        label: "做实验数据一览",
        href: "/console/analytics/district",
      },
    ],
  },
  {
    id: "assessment",
    label: "测评与标准题库",
    items: [
      {
        id: "assessment-questions",
        label: "标准题库",
        href: "/console/assessment/questions",
      },
    ],
  },
] as const;

/**
 * 平台侧：实验目录、账号、通知与记录（与「运营中心」心智分离）。
 */
export const CONSOLE_SYSTEM_NAV_GROUPS: readonly ConsoleNavGroup[] = [
  {
    id: "resources",
    label: "实验目录",
    items: [
      { id: "res-courses", label: "实验课程", href: "/console/courses" },
      { id: "res-subject", label: "年级实验标准", href: "/console/settings/education/subject-grades" },
      { id: "res-textbooks", label: "教材书架", href: "/console/settings/textbooks" },
      { id: "res-experiments", label: "实验列表", href: "/console/settings/experiments" },
      { id: "res-cfg-teacher-material", label: "实验材料分类", href: "/console/settings/materials/teacher-materials" },
      { id: "res-dictionaries", label: "字典设置", href: "/console/settings/dictionaries" },
    ],
  },
  {
    id: "system",
    label: "账号与权限",
    items: [
      { id: "sys-users", label: "账号管理", href: "/console/settings/system/users" },
      { id: "sys-roles", label: "角色与权限", href: "/console/settings/system/roles" },
      { id: "sys-orgs", label: "学校与组织", href: "/console/settings/system/organizations" },
    ],
  },
  {
    id: "platform",
    label: "通知与校区",
    items: [
      { id: "plat-notify", label: "学校通知", href: "/console/operations/notifications" },
      { id: "plat-audit", label: "操作记录", href: "/console/operations/audit-log" },
      { id: "plat-feedback", label: "用户反馈", href: "/console/settings/feedback" },
    ],
  },
] as const;

/** 教研员 / 超管：侧栏「教研工作台」分组（与区管菜单解耦） */
export const RESEARCHER_WORKSPACE_NAV_GROUPS: readonly ConsoleNavGroup[] = [
  {
    id: "researcher-workspace",
    label: "教研工作台",
    items: [{ id: "rw-reviews", label: "实验方案评审", href: "/researcher/reviews" }],
  },
] as const;

/** 全部分组（扁平查找） */
export const CONSOLE_NAV_GROUPS: readonly ConsoleNavGroup[] = [
  ...CONSOLE_OPS_NAV_GROUPS,
  ...CONSOLE_SYSTEM_NAV_GROUPS,
] as const;

const RESEARCHER_OPS_GROUP_IDS = new Set([
  "governance",
  "ai",
  "community",
  "reports",
  "analytics",
  "assessment",
]);
const RESEARCHER_SYSTEM_GROUP_IDS = new Set(["resources", "platform"]);

const SCHOOL_ADMIN_OPS_GROUP_IDS = new Set(["governance", "ai", "community", "reports", "analytics", "assessment"]);
const SCHOOL_ADMIN_SYSTEM_GROUP_IDS = new Set(["resources", "system", "platform"]);

export function getConsoleFacetFromPathname(pathname: string): ConsoleFacet {
  const path = pathname.split("?")[0] || pathname;
  if (
    path.startsWith("/console/settings/") ||
    path === "/console/settings" ||
    path.startsWith("/console/operations/") ||
    path === "/console/operations" ||
    path.startsWith("/console/system/") ||
    path === "/console/system" ||
    path.startsWith("/console/platform/") ||
    path === "/console/platform" ||
    path.startsWith("/console/resources/")
  ) {
    return "system";
  }
  return "ops";
}

function filterGroupsByIds(
  groups: readonly ConsoleNavGroup[],
  allowed: Set<string>,
): ConsoleNavGroup[] {
  return groups.filter((g) => allowed.has(g.id)).map((g) => ({ ...g, items: [...g.items] }));
}

/** 校管仅参与「小法庭」，不进入评价台 / 动态 / 话题运营 */
function applySchoolAdminCommunityFilter(groups: ConsoleNavGroup[]): ConsoleNavGroup[] {
  return groups.map((g) => {
    if (g.id !== "community") return g;
    return {
      ...g,
      items: g.items.filter((i) => i.id === "court-cases"),
    };
  });
}

/** 校管在「教研与评审」组仅可见作品审核 */
function applySchoolAdminGovernanceFilter(groups: ConsoleNavGroup[]): ConsoleNavGroup[] {
  return groups.map((g) => {
    if (g.id !== "governance") return g;
    return {
      ...g,
      items: g.items.filter((i) => i.id === "student-works-review"),
    };
  });
}

export function getConsoleNavGroupsForRole(
  role: UserRole,
  facet: ConsoleFacet,
): readonly ConsoleNavGroup[] {
  const pick = (source: readonly ConsoleNavGroup[], allowed: Set<string>) =>
    filterGroupsByIds(source, allowed);

  let out: ConsoleNavGroup[];

  if (role === UserRole.RESEARCHER) {
    out =
      facet === "ops"
        ? [...RESEARCHER_WORKSPACE_NAV_GROUPS, ...pick(CONSOLE_OPS_NAV_GROUPS, RESEARCHER_OPS_GROUP_IDS)]
        : pick(CONSOLE_SYSTEM_NAV_GROUPS, RESEARCHER_SYSTEM_GROUP_IDS);
  } else if (role === UserRole.SUPER_ADMIN) {
    out =
      facet === "ops"
        ? [...RESEARCHER_WORKSPACE_NAV_GROUPS, ...[...CONSOLE_OPS_NAV_GROUPS]]
        : [...CONSOLE_SYSTEM_NAV_GROUPS];
  } else if (role === UserRole.SCHOOL_ADMIN) {
    out =
      facet === "ops"
        ? pick(CONSOLE_OPS_NAV_GROUPS, SCHOOL_ADMIN_OPS_GROUP_IDS)
        : pick(CONSOLE_SYSTEM_NAV_GROUPS, SCHOOL_ADMIN_SYSTEM_GROUP_IDS);
    if (facet === "ops") {
      out = applySchoolAdminCommunityFilter(out);
      out = applySchoolAdminGovernanceFilter(out);
    }
  } else {
    out = facet === "ops" ? [...CONSOLE_OPS_NAV_GROUPS] : [...CONSOLE_SYSTEM_NAV_GROUPS];
  }

  return out.filter((g) => g.items.length > 0);
}

export function getConsoleRootHrefForRole(role: UserRole, facet: ConsoleFacet): string {
  if (facet === "system") {
    if (role === UserRole.SCHOOL_ADMIN) return "/console/settings/system/organizations";
    if (role === UserRole.RESEARCHER) return "/console/operations/notifications";
    return "/console/settings/system/users";
  }
  return "/console/analytics/district";
}

export function getConsoleFacetRootLabel(facet: ConsoleFacet): string {
  return facet === "ops" ? "实验管理" : "系统管理";
}

const FLAT: ConsoleNavLeaf[] = [
  ...RESEARCHER_WORKSPACE_NAV_GROUPS.flatMap((g) => [...g.items]),
  ...CONSOLE_NAV_GROUPS.flatMap((g) => [...g.items]),
];

export function findConsoleNavLeafByHref(pathname: string): ConsoleNavLeaf | undefined {
  const path = pathname.split("?")[0] || pathname;
  return FLAT.filter((l) => path === l.href || path.startsWith(`${l.href}/`)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];
}

function findConsoleNavGroupForLeaf(leaf: ConsoleNavLeaf): ConsoleNavGroup | undefined {
  return (
    RESEARCHER_WORKSPACE_NAV_GROUPS.find((g) => g.items.some((i) => i.id === leaf.id)) ??
    CONSOLE_NAV_GROUPS.find((g) => g.items.some((i) => i.id === leaf.id))
  );
}

export function consoleBreadcrumb(
  pathname: string,
  role?: UserRole,
): { label: string; href?: string }[] {
  const pathOnly = pathname.split("?")[0] || pathname;
  const leaf = findConsoleNavLeafByHref(pathOnly);
  const facet = getConsoleFacetFromPathname(pathOnly);
  const rootHref =
    role !== undefined
      ? getConsoleRootHrefForRole(role, facet)
      : facet === "system"
        ? "/console/settings/system/users"
        : "/console/analytics/district";
  const root = { label: getConsoleFacetRootLabel(facet), href: rootHref };
  if (!leaf) return [root];
  const group = findConsoleNavGroupForLeaf(leaf);
  const out: { label: string; href?: string }[] = [root];
  if (group) out.push({ label: group.label });
  out.push({ label: leaf.label });
  return out;
}
