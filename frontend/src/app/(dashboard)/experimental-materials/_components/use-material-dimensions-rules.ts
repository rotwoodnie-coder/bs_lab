"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";
import { useDemoRole } from "@/components/layout/demo-role-context";
import {
  createMaterialDimensionCategoryApi,
  createMaterialDimensionSafetyTagApi,
  createMaterialDimensionTypeApi,
  deleteMaterialDimensionCategoryApi,
  deleteMaterialDimensionSafetyTagApi,
  deleteMaterialDimensionTypeApi,
  fetchExperimentalMaterialDimensions,
  type ExperimentalMaterialDimensionsApiResponse,
  updateMaterialDimensionCategoryApi,
  updateMaterialDimensionSafetyTagApi,
  updateMaterialDimensionTypeApi,
} from "@/lib/experimental-materials-api";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import { canMaintainExperimentalMaterialsLibrary } from "@/lib/rbac/management-access";

export function useMaterialDimensionsRules() {
  const { role, orgId, hydrated } = useDemoRole();
  const actor = React.useMemo(() => buildMaterialsApiActor(role, orgId, "material-config"), [role, orgId]);
  const canMaintain = canMaintainExperimentalMaterialsLibrary({
    role,
    roleId: role,
    userId: "demo",
    userName: "demo",
    loginName: "demo",
    orgId,
    orgName: "demo",
    tenantId: "district-001",
    appId: "materials",
  } as any);
  const [dimensions, setDimensions] = React.useState<ExperimentalMaterialDimensionsApiResponse | null>(null);
  const [loading, setLoading] = React.useState(false);

  const reload = React.useCallback(async () => {
    if (!hydrated) return;
    setLoading(true);
    try {
      const data = await fetchExperimentalMaterialDimensions(actor);
      setDimensions(data);
    } catch (error) {
      console.warn("[MaterialDimensionsRules] 维表 API 请求失败，错误：", error);
      sonnerToast.error(error instanceof Error ? error.message : "加载规则维表失败");
    } finally {
      setLoading(false);
    }
  }, [actor, hydrated]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  return {
    canMaintain,
    loading,
    dimensions,
    reload,
    createType: async (body: { code: string; name: string; displayName: string; sortOrder: number }) => {
      await createMaterialDimensionTypeApi(actor, body);
      sonnerToast.success("已新增材料属性");
      await reload();
    },
    updateType: async (code: string, body: { name: string; displayName: string; sortOrder: number }) => {
      await updateMaterialDimensionTypeApi(actor, code, body);
      sonnerToast.success("已更新材料属性");
      await reload();
    },
    deleteType: async (code: string) => {
      await deleteMaterialDimensionTypeApi(actor, code);
      sonnerToast.success("已删除材料属性");
      await reload();
    },
    createCategory: async (body: { code: string; name: string; sortOrder: number; parentCode?: string | null }) => {
      await createMaterialDimensionCategoryApi(actor, { ...body, subjectId: null });
      sonnerToast.success("已新增材料分类");
      await reload();
    },
    updateCategory: async (code: string, body: { name: string; sortOrder: number; parentCode?: string | null }) => {
      await updateMaterialDimensionCategoryApi(actor, code, { ...body, subjectId: null });
      sonnerToast.success("已更新材料分类");
      await reload();
    },
    deleteCategory: async (code: string) => {
      await deleteMaterialDimensionCategoryApi(actor, code);
      sonnerToast.success("已删除材料分类");
      await reload();
    },
    createSafetyTag: async (body: { code: string; name: string; riskLevel: "none" | "low" | "medium" | "high"; sortOrder: number }) => {
      await createMaterialDimensionSafetyTagApi(actor, body);
      sonnerToast.success("已新增风险提示");
      await reload();
    },
    updateSafetyTag: async (code: string, body: { name: string; riskLevel: "none" | "low" | "medium" | "high"; sortOrder: number }) => {
      await updateMaterialDimensionSafetyTagApi(actor, code, body);
      sonnerToast.success("已更新风险提示");
      await reload();
    },
    deleteSafetyTag: async (code: string) => {
      await deleteMaterialDimensionSafetyTagApi(actor, code);
      sonnerToast.success("已删除风险提示");
      await reload();
    },
  };
}

