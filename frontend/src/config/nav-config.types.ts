import type { ComponentType, SVGProps } from "react";

/** 工作台视域：门户（统一学习入口）与管理（按角色工作台菜单） */
export type AppViewMode = "portal" | "management";

/** 与 Lucide 图标组件一致的 props（经 @bs-lab/ui/icons 转发）。 */
export type NavIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export type SystemNavItemDefinition = {
  id: string;
  label: string;
  /** 客户端路由（可含 query，占位模块统一走 `/placeholder`） */
  href: string;
  Icon: NavIconComponent;
};
