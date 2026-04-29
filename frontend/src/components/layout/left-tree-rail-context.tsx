"use client";

import * as React from "react";

/** 由 `LeftTreeRightTableLayout` 提供：左侧轨折叠态与手动/自动偏好。 */
export type LeftTreeRailContextValue = {
  collapsed: boolean;
  /** `null` 表示随容器宽度自动；`true`/`false` 为手动固定展开或收缩 */
  manualExpanded: boolean | null;
  setManualExpanded: React.Dispatch<React.SetStateAction<boolean | null>>;
  /** 在「当前实际展开/收缩」基础上切换为相反的手动固定态 */
  togglePinned: () => void;
  /** 恢复随宽度自动折叠 */
  resetAuto: () => void;
};

export const LeftTreeRailContext = React.createContext<LeftTreeRailContextValue | null>(null);

export function useLeftTreeRail(): LeftTreeRailContextValue {
  const v = React.useContext(LeftTreeRailContext);
  if (!v) {
    throw new Error("useLeftTreeRail 必须在 LeftTreeRightTableLayout 内使用");
  }
  return v;
}

export function useOptionalLeftTreeRail(): LeftTreeRailContextValue | null {
  return React.useContext(LeftTreeRailContext);
}
