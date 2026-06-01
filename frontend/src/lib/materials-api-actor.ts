import type { ApiActor } from "@/lib/new-core-api";
import { UserRole } from "@/types/auth";

/** 材料相关 API 与媒体归属的统一身份上下文（材料列表页 / 实验编辑器内表单与选择器）。 */
export type MaterialsApiActorContext =
  | "materials-page"
  | "material-config"
  | "admin-dict"
  | "business-dict"
  | "sys-role"
  | "editor-material-form"
  | "editor-material-picker"
  | "catalog-experiment-detail"
  | "edu-textbooks";

const suffixByContext: Record<MaterialsApiActorContext, string> = {
  "materials-page": "materials",
  "material-config": "material-config",
  "admin-dict": "admin-dict",
  "business-dict": "business-dict",
  "sys-role": "sys-role",
  "editor-material-form": "editor-material",
  "editor-material-picker": "materials-picker",
  "catalog-experiment-detail": "catalog-exp",
  "edu-textbooks": "edu-textbooks",
};

const ownerKeyByContext: Record<MaterialsApiActorContext, string> = {
  "materials-page": "materials-page",
  "material-config": "material-config",
  "admin-dict": "admin-dict",
  "business-dict": "business-dict",
  "sys-role": "sys-role",
  "editor-material-form": "editor-form",
  "editor-material-picker": "editor-picker",
  "catalog-experiment-detail": "catalog-exp-detail",
  "edu-textbooks": "edu-textbooks",
};

/** 与 `edu_experimental_materials.tenant_id` 对齐；种子见 database/migrations/0007_*（默认 org-school-east）。 */
const MATERIALS_SEED_TENANT_ORG_ID = "org-school-east";

/**
 * 材料主档按 tenant_id 隔离。数据中区级根节点 `org-district-xh` 与种子不在同一 tenant，列表会为空。
 * 超管/区管/教研员默认 org 为区级时，映射到写入种子的校级租户。
 */
export function resolveExperimentalMaterialsOrgId(orgId: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_EXPERIMENTAL_MATERIALS_TENANT_ID?.trim();
  if (fromEnv) return fromEnv;
  if (orgId === "org-district-xh") return MATERIALS_SEED_TENANT_ORG_ID;
  return orgId;
}

/** 材料库数据的访问与写入身份。优先使用真实用户标识，兜底用合成 ID（兼容旧场景）。 */
export function buildMaterialsApiActor(
  role: UserRole,
  orgId: string,
  context: MaterialsApiActorContext,
  realUserId?: string,
  realUserName?: string,
): ApiActor {
  const suffix = suffixByContext[context];
  const resolvedOrg = resolveExperimentalMaterialsOrgId(orgId);
  const syntheticId = `${role.toLowerCase()}-${suffix}`;
  return {
    role,
    orgId: resolvedOrg,
    userId: realUserId ?? syntheticId,
    userName: realUserName ?? syntheticId,
  };
}

/** 媒体库等资源侧使用的归属用户标识，与 ApiActor 同源构造，避免各处手写前缀。 */
export function buildMaterialsMediaOwnerUserId(orgId: string, role: UserRole, context: MaterialsApiActorContext): string {
  const resolvedOrg = resolveExperimentalMaterialsOrgId(orgId);
  return `${resolvedOrg}:${role}:${ownerKeyByContext[context]}`;
}
