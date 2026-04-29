import { Images } from "@bs-lab/ui/icons";

import type { SystemNavItemDefinition } from "@/config/nav-config.types";

import { getNavLabel } from "./nav-labels";

/** 各角色共用的多媒体/实验素材库入口（路由仍为历史路径 `/teacher/materials`）。 */
export const MULTIMEDIA_MATERIALS_NAV_ITEM: SystemNavItemDefinition = {
  id: "teacher-materials",
  label: getNavLabel("teacher-materials", "实验素材库"),
  href: "/teacher/materials",
  Icon: Images,
};
