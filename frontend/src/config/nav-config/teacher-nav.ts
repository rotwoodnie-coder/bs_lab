import {
  BookOpen,
  FileQuestion,
  Library,
  ListChecks,
  Package,
  Scale,
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
    id: "console-res-experiments",
    label: getNavLabel("console-res-experiments", "实验列表"),
    href: "/console/settings/experiments",
    Icon: Library,
  },
  {
    id: "teacher-assignments",
    label: getNavLabel("teacher-assignments", "作业任务"),
    href: "/teacher/assignments",
    Icon: ListChecks,
  },
  {
    id: "console-res-textbooks",
    label: "教材管理",
    href: "/console/settings/textbooks",
    Icon: BookOpen,
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
