"use client";

import * as React from "react";

import type { CatalogEdge } from "@/lib/experiment-catalog-api";
import { experimentCatalogDemoStreamActor } from "@/lib/experiment-catalog-api";
import { fetchExperimentalMaterialDetail } from "@/lib/experimental-materials-api";
import { getMediaRegistry } from "@/lib/media-platform/media-api";
import type { UserRole } from "@/types/auth";

function materialKey(id: string) {
  return `m:${id.trim()}`;
}

function mediaKey(id: string) {
  return `r:${id.trim()}`;
}

/** 为映射边补齐材料名、媒体登记标题（接口未联表返回时的兜底） */
export function useResourceEdgeDisplayNames(edges: CatalogEdge[], role: UserRole, orgId: string) {
  const [labels, setLabels] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);

  const actor = React.useMemo(() => experimentCatalogDemoStreamActor(role, orgId), [role, orgId]);

  const materialIds = React.useMemo(() => {
    const s = new Set<string>();
    for (const e of edges) {
      if (e.kind !== "material") continue;
      const mid = e.materialId?.trim();
      if (!mid) continue;
      if (e.materialDisplayName?.trim()) continue;
      s.add(mid);
    }
    return [...s];
  }, [edges]);

  const registryIds = React.useMemo(() => {
    const s = new Set<string>();
    for (const e of edges) {
      if (e.kind !== "media") continue;
      const rid = e.registryId?.trim();
      if (!rid) continue;
      if (e.mediaRegistryTitle?.trim()) continue;
      s.add(rid);
    }
    return [...s];
  }, [edges]);

  React.useEffect(() => {
    if (materialIds.length === 0 && registryIds.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const next: Record<string, string> = {};
      await Promise.all([
        ...materialIds.map(async (id) => {
          try {
            const { record } = await fetchExperimentalMaterialDetail(actor, id);
            const name = record.name?.trim();
            if (name) next[materialKey(id)] = name;
          } catch {
            /* 忽略单条失败 */
          }
        }),
        ...registryIds.map(async (id) => {
          try {
            const row = await getMediaRegistry(actor, id);
            const title = row.title?.trim();
            if (title) next[mediaKey(id)] = title;
          } catch {
            /* 忽略单条失败 */
          }
        }),
      ]);

      if (!cancelled) {
        setLabels((prev) => ({ ...prev, ...next }));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [actor, materialIds, registryIds]);

  const resolveMaterialName = React.useCallback(
    (e: CatalogEdge) => {
      if (e.kind !== "material") return null;
      const fromApi = e.materialDisplayName?.trim();
      if (fromApi) return fromApi;
      const mid = e.materialId?.trim();
      if (!mid) return null;
      return labels[materialKey(mid)] ?? null;
    },
    [labels],
  );

  const resolveMediaTitle = React.useCallback(
    (e: CatalogEdge) => {
      if (e.kind !== "media") return null;
      const fromApi = e.mediaRegistryTitle?.trim();
      if (fromApi) return fromApi;
      const rid = e.registryId?.trim();
      if (!rid) return null;
      return labels[mediaKey(rid)] ?? null;
    },
    [labels],
  );

  return { resolveMaterialName, resolveMediaTitle, namesLoading: loading };
}
