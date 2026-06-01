"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { setDefaultMediaDisplaySrcResolver, SonnerToaster, TooltipProvider } from "@bs-lab/ui";

import { materialStorageBrowserHref } from "@/lib/material-asset-url";
import { AuthProvider } from "@/lib/v2/auth-context";
import { CatalogSeedProvider } from "@/components/providers/catalog-seed-provider";
import { MobileProvider } from "@/contexts/MobileContext";

/** `@bs-lab/ui` 内所有 `MediaPreview` / 表单缩略图等展示前统一走私有桶→同源代理 */
setDefaultMediaDisplaySrcResolver(materialStorageBrowserHref);
import { ClosedLoopDevBridge } from "@/components/dev/closed-loop-dev-bridge";
import { LongTaskLogger } from "@/components/dev/long-task-logger";
import { ResourceCenterPolicyProvider } from "@/components/layout/resource-center-policy-context";
import { ThemeSync } from "@/components/layout/theme-sync";
import { AppModeProvider } from "@/context/app-mode-context";

function MswBootstrap() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development" && process.env.NEXT_PUBLIC_MOCKS !== "enabled") return;
    void import("@/mocks/browser")
      .then(({ enableMocking }) => enableMocking())
      .then(() => console.info("[MSW] Mocking enabled."))
      .catch((err) => console.error("[MSW] Mocking failed.", err));
  }, []);
  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CatalogSeedProvider>
      <AuthProvider>
      <AppModeProvider>
        <ResourceCenterPolicyProvider>
          <TooltipProvider delayDuration={0}>
            <MswBootstrap />
            <ThemeSync />
            <ClosedLoopDevBridge />
            <LongTaskLogger />
            {children}
            <SonnerToaster position="top-center" richColors closeButton />
          </TooltipProvider>
        </ResourceCenterPolicyProvider>
      </AppModeProvider>
      </AuthProvider>
    </CatalogSeedProvider>
  );
}
