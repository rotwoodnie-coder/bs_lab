"use client";

import type { ReactNode } from "react";
import { setDefaultMediaDisplaySrcResolver, SonnerToaster, TooltipProvider } from "@bs-lab/ui";

import { materialStorageBrowserHref } from "@/lib/material-asset-url";
import { CatalogSeedProvider } from "@/components/providers/catalog-seed-provider";

/** `@bs-lab/ui` 内所有 `MediaPreview` / 表单缩略图等展示前统一走私有桶→同源代理 */
setDefaultMediaDisplaySrcResolver(materialStorageBrowserHref);
import { ClosedLoopDevBridge } from "@/components/dev/closed-loop-dev-bridge";
import { LongTaskLogger } from "@/components/dev/long-task-logger";
import { ResourceCenterPolicyProvider } from "@/components/layout/resource-center-policy-context";
import { ThemeSync } from "@/components/layout/theme-sync";
import { AppModeProvider } from "@/context/app-mode-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CatalogSeedProvider>
      <AppModeProvider>
        <ResourceCenterPolicyProvider>
          <TooltipProvider delayDuration={0}>
            <ThemeSync />
            <ClosedLoopDevBridge />
            <LongTaskLogger />
            {children}
            <SonnerToaster position="top-center" richColors closeButton />
          </TooltipProvider>
        </ResourceCenterPolicyProvider>
      </AppModeProvider>
    </CatalogSeedProvider>
  );
}
