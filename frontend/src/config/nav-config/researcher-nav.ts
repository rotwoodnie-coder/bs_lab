import {
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Building2,
  ClipboardCheck,
  Database,
  FileQuestion,
  Images,
  Layers,
  Library,
  Medal,
  Monitor,
  Package,
  Scale,
  School,
  ScrollText,
  Server,
  UsersRound,
} from "@bs-lab/ui/icons";

import { EXP_COURSE_NAV_ITEM } from "@/config/nav-config/exp-course-nav-item";
import { getNavLabel } from "@/config/nav-config/nav-labels";
import { MULTIMEDIA_MATERIALS_NAV_ITEM } from "@/config/nav-config/multimedia-materials-nav";
import type { SystemNavItemDefinition } from "@/config/nav-config.types";

/** 区级默认「系统管理」落地；教研员走通知入口（无 `/console/settings/system/*` 权限） */
function buildDistrictResearcherManagementNav(
  systemBaseHref: string,
  options?: { includeOptionalScheduling?: boolean; includeTeachingClass?: boolean },
): readonly SystemNavItemDefinition[] {
  const includeOptionalScheduling = options?.includeOptionalScheduling ?? true;
  const includeTeachingClass = options?.includeTeachingClass ?? true;
  return [
    {
      id: "console-system-base",
      label: getNavLabel("console-system-base", "用户管理"),
      href: systemBaseHref,
      Icon: Server,
    },
    { id: "sys-orgs", label: getNavLabel("sys-orgs", "组织架构"), href: "/console/settings/system/organizations", Icon: Building2 },
    { id: "sys-roles", label: getNavLabel("sys-roles", "角色与权限"), href: "/console/settings/system/roles", Icon: UsersRound },
    ...(includeTeachingClass
      ? ([{ id: "my-classes", label: "教学关系设定", href: "/system-manage/teacher-class", Icon: School }] as const)
      : []),
    { id: "plat-notify", label: getNavLabel("plat-notify", "学校通知"), href: "/console/operations/notifications", Icon: Bell },
       { id: "plat-audit", label: getNavLabel("plat-audit", "操作记录"), href: "/console/operations/audit-log", Icon: ScrollText },
    {
      id: "console-cfg-teacher-material",
      label: "实验材料分类",
      href: "/console/settings/materials/teacher-materials",
      Icon: Images,
    },
    {
      id: "console-cfg-dictionaries",
      label: "字典设置",
      href: "/console/settings/dictionaries",
      Icon: Database,
    },
    {
      id: "console-cfg-incentives",
      label: getNavLabel("console-cfg-incentives", "积分与激励"),
      href: "/console/settings/incentives",
      Icon: Medal,
    },
    ...(includeOptionalScheduling
      ? ([{
          id: "console-res-subject",
          label: getNavLabel("console-res-subject", "排课调度（可选）"),
          href: "/console/settings/education/subject-grades",
          Icon: School,
        }] as const)
      : []),
    {
      id: "console-res-textbooks",
      label: "教材管理",
      href: "/console/settings/textbooks",
      Icon: BookOpen,
    },
    { id: "console-res-experiments", label: getNavLabel("console-res-experiments", "实验列表"), href: "/console/settings/experiments", Icon: Library },
    EXP_COURSE_NAV_ITEM,
    { id: "console-review-experiments", label: getNavLabel("console-review-experiments", "实验评审"), href: "/console/review/experiments", Icon: ClipboardCheck },
    { id: "console-ai-strategies", label: getNavLabel("console-ai-strategies", "AI 配置"), href: "/console/operations/ai-strategies", Icon: Layers },
    { id: "ai-assistant", label: getNavLabel("ai-assistant", "AI 助教"), href: "/ai-assistant", Icon: Bot },
    { id: "virtual-experiment", label: getNavLabel("virtual-experiment", "虚拟实验管理"), href: "/virtual-experiment/list", Icon: Monitor },
    { id: "console-reports-templates", label: getNavLabel("console-reports-templates", "实验报告模板"), href: "/console/reports/templates", Icon: ScrollText },
    { id: "console-analytics-district", label: getNavLabel("console-analytics-district", "统计数据"), href: "/console/analytics/district", Icon: BarChart3 },
    { id: "exp-question-bank", label: getNavLabel("exp-question-bank", "实验题库"), href: "/console/assessment/questions", Icon: FileQuestion },
    { id: "console-social-review", label: getNavLabel("console-social-review", "评价与审核"), href: "/console/social/review", Icon: ClipboardCheck },
    { id: "console-social-court", label: getNavLabel("console-social-court", "实验小法庭"), href: "/console/social/court", Icon: Scale },
    {
      id: "researcher-teaching-research-groups",
      label: getNavLabel("researcher-teaching-research-groups", "教研组管理"),
      href: "/researcher/teaching-research-groups",
      Icon: School,
    },
    MULTIMEDIA_MATERIALS_NAV_ITEM,
    {
      id: "mgmt-materials-lib",
      label: getNavLabel("mgmt-materials-lib", "实验材料库"),
      href: "/experimental-materials",
      Icon: Package,
    },
    { id: "dist-overview", label: getNavLabel("dist-overview", "全区看板"), href: "/district/overview", Icon: BarChart3 },
  ] as const;
}

export const RESEARCHER_MANAGEMENT_NAV = buildDistrictResearcherManagementNav(
  "/console/operations/notifications",
  { includeOptionalScheduling: false, includeTeachingClass: false },
);

export const DISTRICT_ADMIN_MANAGEMENT_NAV = buildDistrictResearcherManagementNav(
  "/console/settings/system/users",
  { includeOptionalScheduling: true, includeTeachingClass: true },
);
