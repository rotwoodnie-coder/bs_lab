"use client";

import * as React from "react";

/** 由 `ConsoleWorkbenchLayout` 提供：主内容已套一层控制台内边距，收缩侧轨时负 margin 需略大。 */
export const ConsoleWorkbenchChromeContext = React.createContext(false);

export function useInsideConsoleWorkbenchChrome(): boolean {
  return React.useContext(ConsoleWorkbenchChromeContext);
}
