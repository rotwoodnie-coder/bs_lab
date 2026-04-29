"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";

import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import { fetchV2MaterialTypes } from "@/lib/v2/v2-exp-api";
import { useSessionActor } from "@/hooks/use-session-actor";

import { normalizeMaterialCategoryRows, type MaterialCategoryRow } from "./_lib/material-category-catalog";

export function useMaterialCategoryCatalogScreen() {
  const { role, orgId, hydrated } = useSessionActor();
  const actor = React.useMemo(() => buildMaterialsApiActor(role, orgId, "material-config"), [orgId, role]);
  const [ready, setReady] = React.useState(false);
  const [rows, setRows] = React.useState<MaterialCategoryRow[]>([]);

  React.useEffect(() => {
    if (!hydrated) return;
    const coreActor = {
      role: actor.role,
      orgId: actor.orgId,
      userId: actor.userId,
      userName: actor.userName,
    };
    void fetchV2MaterialTypes(coreActor)
      .then((list) => {
        setRows(normalizeMaterialCategoryRows(list));
      })
      .catch((e) => {
        sonnerToast.error(e instanceof Error ? e.message : "加载材料分类失败");
        setRows([]);
      })
      .finally(() => setReady(true));
  }, [actor, hydrated]);

  return { ready, rows };
}

export type { MaterialCategoryRow };
