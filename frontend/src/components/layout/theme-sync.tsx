"use client";

import * as React from "react";

import { applyStoredTheme, getStoredTheme } from "@/lib/app-theme";

/**
 * 首屏与「跟随系统」时同步 `html.dark`；与设置页 `setStoredTheme` 配合使用。
 */
export function ThemeSync() {
  React.useEffect(() => {
    applyStoredTheme();

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSchemeChange = () => {
      if (getStoredTheme() === "system") applyStoredTheme();
    };
    mq.addEventListener("change", onSchemeChange);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "bs-lab-theme") applyStoredTheme();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      mq.removeEventListener("change", onSchemeChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return null;
}
