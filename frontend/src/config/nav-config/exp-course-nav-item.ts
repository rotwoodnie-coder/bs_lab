import { Layers } from "@bs-lab/ui/icons";

import { getNavLabel } from "@/config/nav-config/nav-labels";
import type { SystemNavItemDefinition } from "@/config/nav-config.types";

/** 各角色管理台共用的「实验课程」入口（`/experiment-manage`，数据来自 `/v2/exp`） */
export const EXP_COURSE_NAV_ITEM: SystemNavItemDefinition = {
  id: "exp-mgmt",
  label: getNavLabel("exp-mgmt", "实验课程"),
  href: "/experiment-manage",
  Icon: Layers,
};
