"use client";

import * as React from "react";

import { sonnerToast } from "@bs-lab/ui";

import { getConsoleUsersActor } from "@/lib/console/users/console-users.adapter";
import { fetchV2OrgTypes, fetchV2SysOrgTree, type V2SysOrgItem } from "@/lib/v2/v2-sys-api";
import { toDictOptions, type DictOption } from "@/lib/v2/v2-dict-adapter";

import { buildOrgTreeFromFlat } from "../organizations/org-tree-utils";

export function useUserOrgTree() {
  const [orgTree, setOrgTree] = React.useState<V2SysOrgItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedOrgId, setSelectedOrgId] = React.useState<string | null>(null);
  const [orgTypeOptions, setOrgTypeOptions] = React.useState<DictOption[]>([]);

  const orgTypeLabels = React.useMemo(
    () => Object.fromEntries(orgTypeOptions.map((o) => [o.id, o.name])),
    [orgTypeOptions],
  );

  const refreshOrgTree = React.useCallback(async () => {
    setLoading(true);
    try {
      const actor = getConsoleUsersActor();
      const [flat, types] = await Promise.all([fetchV2SysOrgTree(actor), fetchV2OrgTypes(actor)]);
      setOrgTypeOptions(toDictOptions(types));
      setOrgTree(buildOrgTreeFromFlat(flat));
    } catch (err) {
      sonnerToast.error("组织树加载失败", {
        description: err instanceof Error ? err.message : "未知错误",
      });
      setOrgTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refreshOrgTree();
  }, [refreshOrgTree]);

  return {
    orgTree,
    orgTreeLoading: loading,
    orgTypeLabels,
    selectedOrgId,
    setSelectedOrgId,
    refreshOrgTree,
  };
}
