"use client";

import * as React from "react";

import { loadAllExperimentCatalogSeedRows } from "@/data/experiment-teaching-catalog.seed";
import { setExperimentCatalogSeedRowsCache } from "@/lib/catalog-seed-cache";
import { persistInitialCatalogSeedIfStorageEmpty } from "@/lib/curriculum-standards-storage";

/**
 * 首屏前拉取课标种子分片并写入内存缓存；若 localStorage 为空则落盘一份初始快照。
 */
export function CatalogSeedProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const rows = await loadAllExperimentCatalogSeedRows();
      if (cancelled) return;
      setExperimentCatalogSeedRowsCache(rows);
      persistInitialCatalogSeedIfStorageEmpty();
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-muted-foreground">
        正在加载数据…
      </div>
    );
  }

  return <>{children}</>;
}
