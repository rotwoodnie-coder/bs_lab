import {
  ClipboardCheck,
  FileQuestion,
  LayoutDashboard,
  ListChecks,
  Package,
  Scale,
  School,
  Users,
  UsersRound,
} from "@bs-lab/ui/icons";

import { EXP_COURSE_NAV_ITEM } from "@/config/nav-config/exp-course-nav-item";
import { getNavLabel } from "@/config/nav-config/nav-labels";
import { MULTIMEDIA_MATERIALS_NAV_ITEM } from "@/config/nav-config/multimedia-materials-nav";
import type { SystemNavItemDefinition } from "@/config/nav-config.types";

/** 教师 · 管理台 */
export const TEACHER_MANAGEMENT_NAV: readonly SystemNavItemDefinition[] = [
  EXP_COURSE_NAV_ITEM,
  {
    id: "my-classes",
    label: getNavLabel("my-classes", "我的班级"),
    href: "/system-manage/teacher-class",
    Icon: School,
  },
  {
    id: "teacher-assignments",
    label: getNavLabel("teacher-assignments", "实验列表"),
    href: "/experiment-manage",
    Icon: ListChecks,
  },
  {
    id: "teacher-research-project-groups",
    label: getNavLabel("teacher-research-project-groups", "教研组管理"),
    href: "/teacher/research-project-groups",
    Icon: UsersRound,
  },
  {
    id: "exp-question-bank",
    label: getNavLabel("exp-question-bank", "实验题库"),
    href: "/teacher/question-bank",
    Icon: FileQuestion,
  },
  {
    id: "community-court",
    label: getNavLabel("community-court", "实验小法庭"),
    href: "/teacher/social",
    Icon: Scale,
  },
  MULTIMEDIA_MATERIALS_NAV_ITEM,
  {
    id: "mgmt-materials-lib",
    label: getNavLabel("mgmt-materials-lib", "实验材料库"),
    href: "/experimental-materials",
    Icon: Package,
  },
] as const;
