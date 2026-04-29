"use client";

import * as React from "react";

import type { ExperimentViewCapabilities } from "@/types/experiment-view-permissions";
import type { UserRole } from "@/types/auth";

export type ExperimentViewPermissionsState = {
  loading: boolean;
  error: string | null;
  capabilities: ExperimentViewCapabilities | null;
  resolvedRole: UserRole | null;
};

export function useExperimentViewPermissions(experimentId: string): ExperimentViewPermissionsState {
  const [state, setState] = React.useState<ExperimentViewPermissionsState>({
    loading: true,
    error: null,
    capabilities: null,
    resolvedRole: null,
  });

  React.useEffect(() => {
    if (!experimentId) {
      setState({ loading: false, error: null, capabilities: null, resolvedRole: null });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    void fetch(`/api/experiments/${encodeURIComponent(experimentId)}/view-permissions`, {
      credentials: "include",
    })
      .then(async (res) => {
        const payload = (await res.json()) as {
          capabilities?: ExperimentViewCapabilities;
          resolvedRole?: UserRole;
        };
        if (!res.ok) {
          throw new Error(typeof payload === "object" ? JSON.stringify(payload) : res.statusText);
        }
        return payload;
      })
      .then((data) => {
        if (cancelled) return;
        setState({
          loading: false,
          error: null,
          capabilities: data.capabilities ?? null,
          resolvedRole: data.resolvedRole ?? null,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setState({
          loading: false,
          error: e instanceof Error ? e.message : "权限校验失败",
          capabilities: null,
          resolvedRole: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [experimentId]);

  return state;
}
