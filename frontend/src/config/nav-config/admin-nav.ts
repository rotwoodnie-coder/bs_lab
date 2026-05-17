import {
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  Bot,
  Building2,
  ClipboardCheck,
  Database,
  FileQuestion,
  Images,
  LayoutDashboard,
  Layers,
  Library,
  Medal,
  Monitor,
  Package,
  RefreshCw,
  Scale,
  School,
  ScrollText,
  Server,
  ShieldCheck,
  UsersRound,
  Wrench,
} from "@bs-lab/ui/icons";

import { EXP_COURSE_NAV_ITEM } from "@/config/nav-config/exp-course-nav-item";
import { getNavLabel } from "@/config/nav-config/nav-labels";
import { MULTIMEDIA_MATERIALS_NAV_ITEM } from "@/config/nav-config/multimedia-materials-nav";
import type { SystemNavItemDefinition } from "@/config/nav-config.types";

/** 学校管理员 · 管理台（组织/用户/第三方与监控为真路由；与 RBAC 互斥教研评审） */
export const SCHOOL_ADMIN_MANAGEMENT_NAV: readonly SystemNavItemDefinition[] = [
  { id: "console-res-textbooks", label: "教材管理", href: "/console/settings/textbooks", Icon: BookMarked },
  { id: "console-res-experiments", label: getNavLabel("console-res-experiments", "实验列表"), href: "/console/settings/experiments", Icon: Library },
  { id: "exp-question-bank", label: getNavLabel("exp-question-bank", "实验题库"), href: "/console/assessment/questions", Icon: FileQuestion },
  { id: "console-cfg-sim-dev", label: "模拟开发配置", href: "/admin/simulation-dev", Icon: LayoutDashboard },
  { id: "mgmt-materials-lib", label: getNavLabel("mgmt-materials-lib", "实验材料库"), href: "/experimental-materials", Icon: Package },
  { id: "console-system-base", label: getNavLabel("console-system-base", "用户管理"), href: "/console/settings/system/users", Icon: Server },
  { id: "sys-roles", label: getNavLabel("sys-roles", "角色与权限"), href: "/console/settings/system/roles", Icon: UsersRound },
  { id: "sys-orgs", label: getNavLabel("sys-orgs", "组织架构"), href: "/console/settings/system/organizations", Icon: Building2 },
  { id: "sys-parent-bindings", label: "家长绑定审核", href: "/console/settings/system/parent-bindings", Icon: UsersRound },
  { id: "my-classes", label: "教学关系设定", href: "/system-manage/teacher-class", Icon: School },
  { id: "console-cfg-dictionaries", label: "字典设置", href: "/console/settings/dictionaries", Icon: Database },
  { id: "console-cfg-incentives", label: getNavLabel("console-cfg-incentives", "积分与激励"), href: "/console/settings/incentives", Icon: Medal },
  { id: "console-review-experiments", label: getNavLabel("console-review-experiments", "实验评审"), href: "/console/review/experiments", Icon: ClipboardCheck },
  { id: "console-review-student-works", label: "作品审核", href: "/console/review/student-works", Icon: ClipboardCheck },
  { id: "console-review-research-groups", label: "课题组审核", href: "/console/review/research-groups", Icon: ClipboardCheck },
  { id: "console-ai-strategies", label: getNavLabel("console-ai-strategies", "AI 配置"), href: "/console/operations/ai-strategies", Icon: Layers },
  { id: "ai-assistant", label: getNavLabel("ai-assistant", "AI 助教"), href: "/ai-assistant", Icon: Bot },
  { id: "console-reports-templates", label: getNavLabel("console-reports-templates", "报告模板"), href: "/console/reports/templates", Icon: ScrollText },
  { id: "console-social-review", label: getNavLabel("console-social-review", "评价与审核"), href: "/console/social/review", Icon: ClipboardCheck },
  { id: "console-social-court", label: getNavLabel("console-social-court", "实验小法庭"), href: "/console/social/court", Icon: Scale },
  MULTIMEDIA_MATERIALS_NAV_ITEM,
] as const;

/**
 * 超管管理台导航：按使用频率显式排序。
 * 高频业务在前（实验/题库/材料），字典配置居中，系统管理在后，运维类最后。
 */
export const SUPER_ADMIN_MANAGEMENT_NAV: readonly SystemNavItemDefinition[] = [
  // ── 资源管理（高频） ──
  { id: "console-res-experiments", label: getNavLabel("console-res-experiments", "实验列表"), href: "/console/settings/experiments", Icon: Library },
  { id: "exp-question-bank", label: getNavLabel("exp-question-bank", "实验题库"), href: "/console/assessment/questions", Icon: FileQuestion },
  { id: "mgmt-materials-lib", label: getNavLabel("mgmt-materials-lib", "实验材料库"), href: "/experimental-materials", Icon: Package },
  MULTIMEDIA_MATERIALS_NAV_ITEM,
  EXP_COURSE_NAV_ITEM,
  { id: "console-res-textbooks", label: "教材管理", href: "/console/settings/textbooks", Icon: BookMarked },
  { id: "console-res-subject", label: getNavLabel("console-res-subject", "教学架构管理"), href: "/console/settings/education/subject-grades", Icon: School },

  // ── 字典与配置（中频） ──
  { id: "console-cfg-dictionaries", label: "字典设置", href: "/console/settings/dictionaries", Icon: Database },
  { id: "console-cfg-incentives", label: getNavLabel("console-cfg-incentives", "积分与激励"), href: "/console/settings/incentives", Icon: Medal },
  { id: "console-cfg-sim-dev", label: "模拟开发配置", href: "/admin/simulation-dev", Icon: LayoutDashboard },
  { id: "ai-prompt-templates", label: "提示词管理", href: "/admin/ai-prompts", Icon: Bot },

  // ── 系统管理 ──
  { id: "console-system-base", label: getNavLabel("console-system-base", "用户管理"), href: "/console/settings/system/users", Icon: Server },
  { id: "sys-roles", label: getNavLabel("sys-roles", "角色与权限"), href: "/console/settings/system/roles", Icon: UsersRound },
  { id: "sys-orgs", label: getNavLabel("sys-orgs", "组织架构"), href: "/console/settings/system/organizations", Icon: Building2 },
  { id: "sys-parent-bindings", label: "家长绑定审核", href: "/console/settings/system/parent-bindings", Icon: UsersRound },
  { id: "my-classes", label: "教学关系设定", href: "/system-manage/teacher-class", Icon: School },

  // ── 评审与质控 ──
  { id: "console-review-experiments", label: getNavLabel("console-review-experiments", "实验评审"), href: "/console/review/experiments", Icon: ClipboardCheck },
  { id: "console-review-student-works", label: "作品审核", href: "/console/review/student-works", Icon: ClipboardCheck },
  { id: "console-review-research-groups", label: "课题组审核", href: "/console/review/research-groups", Icon: ClipboardCheck },
  { id: "console-reports-templates", label: getNavLabel("console-reports-templates", "报告模板"), href: "/console/reports/templates", Icon: ScrollText },
  { id: "console-ai-strategies", label: getNavLabel("console-ai-strategies", "AI 引导语与策略"), href: "/console/operations/ai-strategies", Icon: Layers },
  { id: "ai-assistant", label: getNavLabel("ai-assistant", "AI 助教"), href: "/ai-assistant", Icon: Bot },

  // ── 教研组管理 ──
  { id: "researcher-teaching-research-groups", label: "教研组管理", href: "/researcher/teaching-research-groups", Icon: School },

  // ── 社交与运营 ──
  { id: "console-social-review", label: getNavLabel("console-social-review", "评价与审核"), href: "/console/social/review", Icon: ClipboardCheck },
  { id: "console-social-court", label: getNavLabel("console-social-court", "小法庭"), href: "/console/social/court", Icon: Scale },

  // ── 数据与分析 ──
  { id: "console-analytics-district", label: getNavLabel("console-analytics-district", "做实验数据一览"), href: "/console/analytics/district", Icon: BarChart3 },
  { id: "plat-notify", label: getNavLabel("plat-notify", "学校通知"), href: "/console/operations/notifications", Icon: Bell },
  { id: "plat-audit", label: getNavLabel("plat-audit", "操作记录"), href: "/console/operations/audit-log", Icon: ScrollText },

  // ── 运维中心 ──
  { id: "ops-dashboard", label: getNavLabel("ops-dashboard", "运维概览"), href: "/console/operations/dashboard", Icon: Monitor },
  { id: "ops-dict-sync", label: getNavLabel("ops-dict-sync", "业务字典同步"), href: "/console/operations/dict-sync", Icon: RefreshCw },
  { id: "ops-data-export", label: getNavLabel("ops-data-export", "数据导出"), href: "/console/operations/data-export", Icon: Database },
  { id: "ops-cache-mgmt", label: getNavLabel("ops-cache-mgmt", "缓存管理"), href: "/console/operations/cache-mgmt", Icon: Layers },
  { id: "ops-consistency", label: getNavLabel("ops-consistency", "数据一致性检查"), href: "/console/operations/consistency", Icon: ShieldCheck },
  { id: "ops-auto-heal", label: getNavLabel("ops-auto-heal", "自动修复"), href: "/admin/auto-heal", Icon: Wrench },
];
