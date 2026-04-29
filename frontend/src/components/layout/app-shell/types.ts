import type * as React from "react";

import type { AppViewMode } from "@/config/nav-config";

/** 管理工作台顶栏身份色带：教研员偏紫、校级管理偏蓝、超管全功能调试为品牌主色带 */
export type ManagementWorkspaceTone = "default" | "researcher" | "schoolAdmin" | "superAdmin";

export type AppShellNavItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
};

export type AppShellNavGroup = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children: AppShellNavItem[];
};

export type AppShellNavEntry = AppShellNavItem | AppShellNavGroup;

/** 侧栏底部 Slot 可据此在「收起」时改为仅图标展示 */
export type AppShellSidebarContext = {
  collapsed: boolean;
  narrowViewport: boolean;
  viewMode: AppViewMode;
  /** 桌面端 hydration 完成后再应用收起态，避免首屏文案闪烁 */
  sidebarHydrated?: boolean;
};

export type AppShellProps = {
  logoSlot: React.ReactNode;
  userSlot: React.ReactNode;
  navItems: AppShellNavEntry[];
  activeNavId: string;
  onNavSelect: (id: string) => void;
  children: React.ReactNode;
  /**
   * 顶栏中部（Logo 与右侧操作区之间）：如全局搜索 / 命令面板触发器。
   */
  headerCenterSlot?: React.ReactNode;
  /** 顶栏右侧（如通知、工具按钮）；不含用户区 */
  headerTrailingSlot?: React.ReactNode;
  /**
   * 顶栏右侧、用户头像左侧：模式切换等控件。
   */
  modeSwitchSlot?: React.ReactNode;
  /** 桌面 / 移动抽屉侧栏主导航上方可选区域（留空则导航自顶栏下直接起排） */
  sidebarTopSlot?: React.ReactNode;
  /** 工作台视图模式，驱动壳层主题与主区转场 */
  viewMode?: AppViewMode;
  /** management 模式下顶栏色带（门户模式忽略） */
  managementWorkspaceTone?: ManagementWorkspaceTone;
  /** 移动端顶栏 `aria-label`，便于无障碍识别当前壳层 */
  mobileHeaderTitle?: string;
  /**
   * 侧栏主导航下方、收起按钮上方（桌面端支持函数形式以读取收起态）。
   */
  sidebarFooterSlot?:
    | React.ReactNode
    | ((ctx: AppShellSidebarContext) => React.ReactNode);
};
