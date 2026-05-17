import {
  Bell,
  Bot,
  FlaskConical,
  Footprints,
  Home,
  Library,
  Package,
  ScrollText,
  Settings,
  Trophy,
  User,
} from "@bs-lab/ui/icons";

import { getNavLabel } from "@/config/nav-config/nav-labels";
import {
  SCHOOL_ADMIN_MANAGEMENT_NAV,
  SUPER_ADMIN_MANAGEMENT_NAV,
} from "@/config/nav-config/admin-nav";
import type { AppViewMode, SystemNavItemDefinition } from "@/config/nav-config.types";
import {
  DISTRICT_ADMIN_MANAGEMENT_NAV,
  RESEARCHER_MANAGEMENT_NAV,
} from "@/config/nav-config/researcher-nav";
import { MULTIMEDIA_MATERIALS_NAV_ITEM } from "@/config/nav-config/multimedia-materials-nav";
import { TEACHER_MANAGEMENT_NAV } from "@/config/nav-config/teacher-nav";
import { RESOURCE_CENTER_NAV_ID } from "@/config/resource-center-policy";
import { UserRole, USER_ROLE_ORDER } from "@/types/auth";

/**
 * 门户模式：全角色统一主导航（首页、实验库、实验工坊、成长足迹）。
 */
export const PORTAL_NAV_ITEMS: readonly SystemNavItemDefinition[] = [
  { id: "home", label: getNavLabel("home", "首页"), href: "/", Icon: Home },
  { id: "class-tasks", label: getNavLabel("class-tasks", "实验库"), href: "/experiments", Icon: Library },
  {
    id: "mgmt-materials-lib",
    label: getNavLabel("mgmt-materials-lib", "实验材料库"),
    href: "/experimental-materials",
    Icon: Package,
  },
  MULTIMEDIA_MATERIALS_NAV_ITEM,
  { id: RESOURCE_CENTER_NAV_ID, label: "实验工坊", href: "/resources", Icon: Library },
  { id: "student-challenge", label: getNavLabel("student-challenge", "实验闯关"), href: "/student/experiment-challenge", Icon: Trophy },
  { id: "footprints", label: getNavLabel("footprints", "成长足迹"), href: "/student/footprints", Icon: Footprints },
  { id: "ai-assistant", label: getNavLabel("ai-assistant", "AI 助教"), href: "/ai-assistant", Icon: Bot },
] as const;

/**
 * 门户模式（学生/家长专用）：不含实验材料库、实验素材库。
 */
export const STUDENT_PARENT_PORTAL_NAV: readonly SystemNavItemDefinition[] = [
  { id: "home", label: getNavLabel("home", "首页"), href: "/", Icon: Home },
  { id: "class-tasks", label: getNavLabel("class-tasks", "实验库"), href: "/experiments", Icon: Library },
  { id: RESOURCE_CENTER_NAV_ID, label: "实验工坊", href: "/resources", Icon: Library },
  { id: "student-challenge", label: getNavLabel("student-challenge", "实验闯关"), href: "/student/experiment-challenge", Icon: Trophy },
  { id: "footprints", label: getNavLabel("footprints", "成长足迹"), href: "/student/footprints", Icon: Footprints },
  { id: "ai-assistant", label: getNavLabel("ai-assistant", "AI 助教"), href: "/ai-assistant", Icon: Bot },
] as const;

/** 学生 · 管理台 */
const STUDENT_MANAGEMENT_NAV: readonly SystemNavItemDefinition[] = [
  { id: "mgmt-my-tasks", label: getNavLabel("mgmt-my-tasks", "我的任务"), href: "/experiments", Icon: ScrollText },
  {
    id: "student-challenge",
    label: getNavLabel("student-challenge", "实验闯关"),
    href: "/student/experiment-challenge",
    Icon: Trophy,
  },
  {
    id: "mgmt-child-progress",
    label: getNavLabel("mgmt-child-progress", "孩子进度"),
    href: "/student/footprints",
    Icon: Footprints,
  },
  { id: "ai-assistant", label: getNavLabel("ai-assistant", "AI 助教"), href: "/ai-assistant", Icon: Bot },
] as const;

/** 家长 · 管理台（任务中心、家庭实验室等） */
const PARENT_MANAGEMENT_NAV: readonly SystemNavItemDefinition[] = [
  {
    id: "mgmt-parent-tasks",
    label: getNavLabel("mgmt-parent-tasks", "任务中心"),
    href: "/parent/tasks",
    Icon: Bell,
  },
  {
    id: "parent-lab",
    label: getNavLabel("parent-lab", "家庭实验室"),
    href: "/parent/lab",
    Icon: FlaskConical,
  },
  { id: "ai-assistant", label: getNavLabel("ai-assistant", "AI 助教"), href: "/ai-assistant", Icon: Bot },
] as const;

/**
 * 三维导航矩阵：NAV_CONFIG[角色][模式]。
 * - portal：统一门户四项
 * - management：按角色隔离的工作台菜单
 */
export const NAV_CONFIG: Record<UserRole, Record<AppViewMode, readonly SystemNavItemDefinition[]>> = {
  [UserRole.STUDENT]: {
    portal: STUDENT_PARENT_PORTAL_NAV,
    management: STUDENT_MANAGEMENT_NAV,
  },
  [UserRole.PARENT]: {
    portal: STUDENT_PARENT_PORTAL_NAV,
    management: PARENT_MANAGEMENT_NAV,
  },
  [UserRole.TEACHER]: {
    portal: PORTAL_NAV_ITEMS,
    management: TEACHER_MANAGEMENT_NAV,
  },
  [UserRole.RESEARCHER]: {
    portal: PORTAL_NAV_ITEMS,
    management: RESEARCHER_MANAGEMENT_NAV,
  },
  [UserRole.SCHOOL_ADMIN]: {
    portal: PORTAL_NAV_ITEMS,
    management: SCHOOL_ADMIN_MANAGEMENT_NAV,
  },
  [UserRole.DISTRICT_ADMIN]: {
    portal: PORTAL_NAV_ITEMS,
    management: DISTRICT_ADMIN_MANAGEMENT_NAV,
  },
  [UserRole.SUPER_ADMIN]: {
    portal: PORTAL_NAV_ITEMS,
    management: SUPER_ADMIN_MANAGEMENT_NAV,
  },
};

/** @deprecated 请使用 NAV_CONFIG */
export const NAV_ITEMS = NAV_CONFIG;

/** @deprecated 等价于 NAV_CONFIG[role].management */
export const NAV_ITEMS_BY_USER_ROLE: Record<UserRole, readonly SystemNavItemDefinition[]> =
  USER_ROLE_ORDER.reduce(
    (acc, role) => {
      acc[role] = NAV_CONFIG[role].management;
      return acc;
    },
    {} as Record<UserRole, readonly SystemNavItemDefinition[]>,
  );

/** @deprecated 使用 NAV_ITEMS_BY_USER_ROLE */
export const SYSTEM_NAV_BY_ROLE = {
  student: NAV_CONFIG[UserRole.STUDENT].management,
  teacher: NAV_CONFIG[UserRole.TEACHER].management,
} as const;

/** 侧栏底部：消息 / 个人中心 / 系统设置（与角色无关） */
export const DASHBOARD_FOOTER_NAV: readonly SystemNavItemDefinition[] = [
  { id: "messages", label: getNavLabel("messages", "消息"), href: "/messages", Icon: Bell },
  { id: "profile", label: getNavLabel("profile", "个人中心"), href: "/profile", Icon: User },
  { id: "settings", label: getNavLabel("settings", "系统设置"), href: "/settings", Icon: Settings },
] as const;
