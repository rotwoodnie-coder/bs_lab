"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useResourceCenterPolicy } from "@/components/layout/resource-center-policy-context";
import { RESOURCE_CENTER_NAV_ID } from "@/config/resource-center-policy";
import {
  getPrimaryNavItemsForRole,
  type AppViewMode,
} from "@/config/nav-config";
import { useAppMode } from "@/context/app-mode-context";
import { useSessionActor } from "@/hooks/use-session-actor";

function pathOnly(href: string): string {
  return href.split("?")[0] || href;
}

/**
 * 切换门户 / 管理台并跳到该模式下的首个可用路由。
 * 先 `router.push` 再异步 `setViewMode`，避免当前 URL 仍为「仅管理台」页面时子页面 effect 与路由守卫把模式立即打回，触发 Switch 受控态重入死循环。
 */
export function useNavigateViewMode() {
  const router = useRouter();
  const { role } = useSessionActor();
  const { viewMode, setViewMode, menuConfigRevision } = useAppMode();
  const { getEffectiveForRole } = useResourceCenterPolicy();

  /** 避免把 `viewMode` 放进 `useCallback` 依赖：否则每次切换模式回调引用都变，Radix Switch 可能因 `onCheckedChange` 抖动重复触发，造成「Maximum update depth exceeded」。 */
  const viewModeRef = React.useRef(viewMode);
  viewModeRef.current = viewMode;

  return React.useCallback(
    (next: AppViewMode) => {
      if (next === viewModeRef.current) return;

      let defs = getPrimaryNavItemsForRole(role, next);
      if (next !== "portal") {
        const rc = getEffectiveForRole(role);
        defs = defs.filter((d) => d.id !== RESOURCE_CENTER_NAV_ID || rc.moduleEnabled);
      }
      const first = defs[0]?.href;
      if (first) {
        const dest = pathOnly(first);
        const current =
          typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : "";
        if (current && pathOnly(current) !== dest) {
          router.push(first);
        }
      }

      queueMicrotask(() => {
        setViewMode(next, { overlay: true });
      });
    },
    [setViewMode, role, router, getEffectiveForRole, menuConfigRevision],
  );
}
