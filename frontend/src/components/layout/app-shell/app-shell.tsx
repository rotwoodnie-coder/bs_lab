"use client";

import * as React from "react";

import { AppShellDesktop } from "./app-shell-desktop";
import { AppShellMobile } from "./app-shell-mobile";
import type { AppShellProps } from "./types";

/**
 * 响应式应用壳：lg 以下使用顶栏 + Sheet 抽屉；lg 及以上使用顶栏 + 可折叠侧栏。
 * 不包含任何数据请求逻辑；导航与 Slot 均由调用方注入。
 */
export function AppShell(props: AppShellProps) {
  return (
    <>
      <div className="block lg:hidden">
        <AppShellMobile {...props} />
      </div>
      <div className="hidden lg:block">
        <AppShellDesktop {...props} />
      </div>
    </>
  );
}
