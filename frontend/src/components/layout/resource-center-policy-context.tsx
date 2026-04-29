"use client";

import * as React from "react";

import {
  clearResourceCenterPolicyOverrides,
  mergeResourceCenterFeatures,
  readResourceCenterPolicyOverrides,
  type ResourceCenterFeatures,
  type ResourceCenterPolicyOverrides,
  writeResourceCenterPolicyOverrides,
} from "@/config/resource-center-policy";
import type { UserRole } from "@/types/auth";

type ResourceCenterPolicyContextValue = {
  overrides: ResourceCenterPolicyOverrides;
  /** 合并默认与持久化覆盖后的能力 */
  getEffectiveForRole: (role: UserRole) => ResourceCenterFeatures;
  patchRole: (role: UserRole, patch: Partial<ResourceCenterFeatures>) => void;
  resetAllToDefaults: () => void;
};

const ResourceCenterPolicyContext = React.createContext<ResourceCenterPolicyContextValue | null>(
  null,
);

export function ResourceCenterPolicyProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = React.useState<ResourceCenterPolicyOverrides>({});

  React.useEffect(() => {
    setOverrides(readResourceCenterPolicyOverrides() ?? {});
  }, []);

  const getEffectiveForRole = React.useCallback(
    (role: UserRole) => mergeResourceCenterFeatures(role, overrides),
    [overrides],
  );

  const patchRole = React.useCallback((role: UserRole, patch: Partial<ResourceCenterFeatures>) => {
    setOverrides((prev) => {
      const next: ResourceCenterPolicyOverrides = {
        ...prev,
        [role]: { ...prev[role], ...patch },
      };
      writeResourceCenterPolicyOverrides(next);
      return next;
    });
  }, []);

  const resetAllToDefaults = React.useCallback(() => {
    clearResourceCenterPolicyOverrides();
    setOverrides({});
  }, []);

  const value = React.useMemo(
    () => ({
      overrides,
      getEffectiveForRole,
      patchRole,
      resetAllToDefaults,
    }),
    [overrides, getEffectiveForRole, patchRole, resetAllToDefaults],
  );

  return (
    <ResourceCenterPolicyContext.Provider value={value}>{children}</ResourceCenterPolicyContext.Provider>
  );
}

export function useResourceCenterPolicy(): ResourceCenterPolicyContextValue {
  const ctx = React.useContext(ResourceCenterPolicyContext);
  if (!ctx) {
    throw new Error("useResourceCenterPolicy must be used within ResourceCenterPolicyProvider");
  }
  return ctx;
}
