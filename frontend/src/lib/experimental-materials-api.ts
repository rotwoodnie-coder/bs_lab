"use client";

import type { ExperimentalMaterialRelatedExperiment } from "@/app/(dashboard)/experimental-materials/page.types";

export type {
  ExperimentalMaterialCategory,
  ExperimentalMaterialRecord,
  ExperimentalMaterialRiskLevel,
  ExperimentalMaterialSafetyTag,
  ExperimentalMaterialType,
} from "@/data/experimental-materials";
import {
  type ExperimentalMaterialCategory,
  type ExperimentalMaterialRecord,
  type ExperimentalMaterialRiskLevel,
  type ExperimentalMaterialSafetyTag,
} from "@/data/experimental-materials";
import type { ApiActor } from "@/lib/new-core-api";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { mediaRegistryStreamUrl } from "@/lib/media-platform/registry-ref";
import { materialStatusDbToUi, materialStatusUiToDb } from "@/lib/v2/material-status-mapping";
import {
  deleteV2Material,
  fetchV2MaterialDetail,
  fetchV2MaterialListPage,
  patchV2Material,
  postV2Material,
  type PatchV2MaterialInput,
  type V2MaterialDetail,
  type V2MaterialMsgRow,
} from "@/lib/v2/v2-material-api";
import {
  fetchV2MaterialProps,
  fetchV2MaterialSecurities,
  fetchV2MaterialTypes,
  fetchV2MaterialUnits,
} from "@/lib/v2/v2-exp-api";

type MaterialApiRow = {
  id: string;
  name: string;
  materialTypeCode: string;
  usage: string;
  numValue: string;
  unitId: string;
  suggestedAmount: string;
  homeAlternative: string;
  safetyNote: string;
  remark: string;
  displayOwnerName?: string | null;
  categoryNameProxy?: string;
  safetyTagsProxy?: string;
  coverRegistryId?: string | null;
  coverSnapshotUrl?: string | null;
  status?: "ACTIVE" | "ARCHIVED";
  version?: number;
  createdByActorId?: string;
  updatedByActorId?: string;
  createdAt: string;
  updatedAt: string;
  riskLevel?: ExperimentalMaterialRiskLevel;
  favorited?: boolean;
};

export type ExperimentalMaterialsListApiResponse = {
  items: MaterialApiRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type ExperimentalMaterialScopeApiRow = {
  id: string;
  subjectType: string;
  subjectKey: string;
  permissionMask: number;
  expiresAt: string | null;
  createdAt: string;
};

export type ExperimentalMaterialResourceApiRow = {
  id: string;
  registryId: string;
  slotKey: string;
  sortOrder: number;
  createdAt: string;
};

export type ExperimentalMaterialRelatedExperimentApiRow = {
  refSource: string;
  experimentId: string;
  displayName: string;
  standardCode: string;
};

/** 与后端 `MaterialCoverThumbInfo` / `coverThumb` 对齐（媒体衍生缩略图状态） */
export type MaterialCoverThumbInfo = {
  registryId: string;
  posterUrl: string | null;
  processingStatus: "READY" | "PROCESSING" | "FAILED" | "NONE" | "STALE";
  errorCode: string | null;
};

export type ExperimentalMaterialDetailApiResponse = {
  material: MaterialApiRow;
  scopes: ExperimentalMaterialScopeApiRow[];
  resources: ExperimentalMaterialResourceApiRow[];
  relatedExperiments?: ExperimentalMaterialRelatedExperimentApiRow[];
  coverThumb?: MaterialCoverThumbInfo | null;
};

export type ExperimentalMaterialDimensionsApiResponse = {
  types: { code: string; name: string; displayName: string; sortOrder: number; status: number }[];
  categories: {
    code: string;
    name: string;
    displayName: string;
    subjectId: string | null;
    parentCode: string | null;
    sortOrder: number;
    status: number;
  }[];
  units: { code: string; name: string; displayName: string; sortOrder: number; status: number }[];
  safetyTags: { code: string; name: string; riskLevel: ExperimentalMaterialRiskLevel; sortOrder: number; status: number }[];
};

export type MaterialDimensionTypeMutationPayload = {
  code: string;
  name: string;
  displayName: string;
  sortOrder: number;
};
export type MaterialDimensionCategoryMutationPayload = {
  code: string;
  name: string;
  sortOrder: number;
  subjectId?: string | null;
  parentCode?: string | null;
};
export type MaterialDimensionSafetyTagMutationPayload = {
  code: string;
  name: string;
  riskLevel: ExperimentalMaterialRiskLevel;
  sortOrder: number;
};

/** 主表 proxy 逗号分隔：保留全部非空 token，由维表/兜底文案负责展示 */
function parseCategories(raw: string | undefined): ExperimentalMaterialCategory[] {
  if (!raw?.trim()) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseSafetyTags(raw: string | undefined): ExperimentalMaterialSafetyTag[] {
  if (!raw?.trim()) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

const LIST_RISK_LEVELS = new Set<ExperimentalMaterialRiskLevel>(["none", "low", "medium", "high"]);

function parseListRiskLevel(v: unknown): ExperimentalMaterialRiskLevel | undefined {
  if (typeof v === "string" && LIST_RISK_LEVELS.has(v as ExperimentalMaterialRiskLevel)) {
    return v as ExperimentalMaterialRiskLevel;
  }
  return undefined;
}

function toRecord(row: MaterialApiRow): ExperimentalMaterialRecord {
  const catProxy = row.categoryNameProxy ?? "";
  const safeProxy = row.safetyTagsProxy ?? "";
  const categories = parseCategories(catProxy);
  const safetyTags = parseSafetyTags(safeProxy);
  const coverRegistryId =
    row.coverRegistryId != null && String(row.coverRegistryId).trim() !== "" ? String(row.coverRegistryId).trim() : null;
  const photoUrl =
    (row.coverSnapshotUrl && String(row.coverSnapshotUrl).trim()) ||
    (coverRegistryId ? mediaRegistryStreamUrl(coverRegistryId, "view") : "");
  return {
    id: row.id,
    name: row.name,
    photoUrl,
    materialType: row.materialTypeCode,
    categories,
    usage: row.usage ?? "",
    numValue: row.numValue ?? "",
    unitId: row.unitId ?? "",
    suggestedAmount: row.suggestedAmount ?? "",
    homeAlternative: row.homeAlternative ?? "",
    safetyTags,
    safetyNote: row.safetyNote ?? "",
    remark: row.remark ?? "",
    categoryNameProxy: catProxy || undefined,
    safetyTagsProxy: safeProxy || undefined,
    coverRegistryId,
    status: row.status,
    version: row.version,
    createdByActorId: row.createdByActorId ?? "system",
    createdAt: row.createdAt,
    updatedByActorId: row.updatedByActorId ?? "system",
    updatedAt: row.updatedAt,
    riskLevel: parseListRiskLevel(row.riskLevel),
    favorited: typeof row.favorited === "boolean" ? row.favorited : undefined,
    displayOwnerName: row.displayOwnerName?.trim() ? row.displayOwnerName.trim() : undefined,
  };
}

function actorCore(actor: ApiActor): CoreApiActor {
  return {
    role: actor.role,
    userId: actor.userId,
    userName: actor.userName,
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    appId: actor.appId,
  };
}

function riskFromSecurityLevel(n: unknown): ExperimentalMaterialRiskLevel {
  const v = Number(n);
  if (v >= 3) return "high";
  if (v === 2) return "medium";
  if (v === 1) return "low";
  return "none";
}

function splitMaterialNum(raw: string | null | undefined): { numValue: string; unitId: string } {
  const t = (raw ?? "").trim();
  if (!t) return { numValue: "", unitId: "" };
  const m = t.match(/^([\d.]+)\s*(.*)$/);
  if (!m) return { numValue: t, unitId: "" };
  return { numValue: m[1] ?? t, unitId: (m[2] ?? "").trim() };
}

function v2RowToApiRow(m: V2MaterialMsgRow): MaterialApiRow {
  const coverUrl = m.mainPicUrl?.trim() || null;
  const isHttp = coverUrl ? /^https?:\/\//i.test(coverUrl) : false;
  const { numValue, unitId } = splitMaterialNum(m.materialNum != null ? String(m.materialNum) : null);
  return {
    id: m.materialId,
    name: m.materialName,
    materialTypeCode: m.materialTypeId ?? "",
    usage: m.expPurpose ?? "",
    numValue,
    unitId,
    suggestedAmount: m.materialNum != null ? String(m.materialNum) : "",
    homeAlternative: m.additionalComments ?? "",
    safetyNote: "",
    remark: m.comments ?? "",
    displayOwnerName: m.displayOwnerName ?? null,
    categoryNameProxy: m.materialPropId ?? "",
    safetyTagsProxy: "",
    coverRegistryId: coverUrl && !isHttp ? coverUrl : null,
    coverSnapshotUrl: isHttp ? coverUrl : null,
    status: materialStatusDbToUi(m.status),
    createdByActorId: m.createUserId ?? "system",
    createdAt: m.createTime ?? "",
    updatedByActorId: m.updateUserId ?? "system",
    updatedAt: m.updateTime ?? m.createTime ?? "",
  };
}

function v2DetailToApiRow(m: V2MaterialDetail): MaterialApiRow {
  const base = v2RowToApiRow(m);
  const secProxy = (m.securities ?? []).map((s) => s.securityId).join(",");
  return { ...base, safetyTagsProxy: secProxy };
}

function dictDimensionUnsupported(): never {
  throw new Error("V2 材料字典请在数据库或运营后台维护，本端暂不提供增删改接口。");
}

export type ExperimentalMaterialsPageQuery = {
  page?: number;
  pageSize?: number;
  keyword?: string;
  materialTypeCode?: string;
  categoryCodes?: string[];
  hasHomeAlternative?: "all" | "has" | "none";
  riskLevel?: ExperimentalMaterialRiskLevel | "all";
  favoritesOnly?: boolean;
};

export async function fetchExperimentalMaterialDimensions(actor: ApiActor): Promise<ExperimentalMaterialDimensionsApiResponse> {
  const core = actorCore(actor);
  const [types, props, units, secs] = await Promise.all([
    fetchV2MaterialTypes(core),
    fetchV2MaterialProps(core),
    fetchV2MaterialUnits(core),
    fetchV2MaterialSecurities(core),
  ]);
  const typesOut = types.map((t, i) => ({
    code: String(t.id),
    name: String(t.name ?? ""),
    displayName: String(t.name ?? ""),
    sortOrder: Number(t.sortOrder ?? i),
    status: 1,
  }));
  const categories = props.map((p, i) => ({
    code: String(p.id),
    name: String(p.name ?? ""),
    displayName: String(p.name ?? ""),
    subjectId: null as string | null,
    parentCode: null as string | null,
    sortOrder: Number(p.sortOrder ?? i),
    status: 1,
  }));
  const unitsOut = units.map((u, i) => ({
    code: String(u.id),
    name: String(u.name ?? ""),
    displayName: String(u.name ?? ""),
    sortOrder: Number(u.sortOrder ?? i),
    status: 1,
  }));
  const safetyTags = secs.map((s, i) => ({
    code: String(s.id),
    name: String(s.name ?? ""),
    riskLevel: riskFromSecurityLevel((s as { securityLevel?: unknown }).securityLevel),
    sortOrder: Number(s.sortOrder ?? i),
    status: 1,
  }));
  return { types: typesOut, categories, units: unitsOut, safetyTags };
}

export async function createMaterialDimensionTypeApi(_actor: ApiActor, _body: MaterialDimensionTypeMutationPayload) {
  dictDimensionUnsupported();
}
export async function updateMaterialDimensionTypeApi(
  _actor: ApiActor,
  _code: string,
  _body: Partial<Omit<MaterialDimensionTypeMutationPayload, "code">>,
) {
  dictDimensionUnsupported();
}
export async function deleteMaterialDimensionTypeApi(_actor: ApiActor, _code: string): Promise<void> {
  dictDimensionUnsupported();
}
export async function createMaterialDimensionCategoryApi(_actor: ApiActor, _body: MaterialDimensionCategoryMutationPayload) {
  dictDimensionUnsupported();
}
export async function updateMaterialDimensionCategoryApi(
  _actor: ApiActor,
  _code: string,
  _body: Partial<Omit<MaterialDimensionCategoryMutationPayload, "code">>,
) {
  dictDimensionUnsupported();
}
export async function deleteMaterialDimensionCategoryApi(_actor: ApiActor, _code: string): Promise<void> {
  dictDimensionUnsupported();
}
export async function createMaterialDimensionSafetyTagApi(_actor: ApiActor, _body: MaterialDimensionSafetyTagMutationPayload) {
  dictDimensionUnsupported();
}
export async function updateMaterialDimensionSafetyTagApi(
  _actor: ApiActor,
  _code: string,
  _body: Partial<Omit<MaterialDimensionSafetyTagMutationPayload, "code">>,
) {
  dictDimensionUnsupported();
}
export async function deleteMaterialDimensionSafetyTagApi(_actor: ApiActor, _code: string): Promise<void> {
  dictDimensionUnsupported();
}

export async function fetchExperimentalMaterialsPage(
  actor: ApiActor,
  query: ExperimentalMaterialsPageQuery,
): Promise<{ items: ExperimentalMaterialRecord[]; total: number; page: number; pageSize: number }> {
  void query.categoryCodes;
  void query.hasHomeAlternative;
  void query.riskLevel;
  void query.favoritesOnly;
  const data = await fetchV2MaterialListPage(actorCore(actor), {
    page: query.page,
    pageSize: query.pageSize,
    keyword: query.keyword?.trim() || undefined,
    materialTypeId: query.materialTypeCode?.trim() || undefined,
  });
  return {
    items: data.items.map((m) => toRecord(v2RowToApiRow(m))),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  };
}

/** 拉取全部材料（分页循环），用于选择器等需全量的场景；单页 pageSize 须与后端 `/v2/material` 上限 100 一致 */
export async function fetchExperimentalMaterialsAll(actor: ApiActor): Promise<ExperimentalMaterialRecord[]> {
  const pageSize = 100;
  let page = 1;
  const out: ExperimentalMaterialRecord[] = [];
  while (true) {
    const { items, total } = await fetchExperimentalMaterialsPage(actor, { page, pageSize });
    out.push(...items);
    if (items.length < pageSize || out.length >= total) break;
    page += 1;
  }
  return out;
}

export async function fetchExperimentalMaterials(actor: ApiActor): Promise<ExperimentalMaterialRecord[]> {
  return fetchExperimentalMaterialsAll(actor);
}

export async function setExperimentalMaterialFavoriteApi(
  _actor: ApiActor,
  _materialId: string,
  _favorited: boolean,
): Promise<void> {
  /* V2 material_msg 暂无收藏字段，保留接口以兼容旧 UI。 */
}

function parseRelatedExperiments(rows: ExperimentalMaterialRelatedExperimentApiRow[] | undefined): ExperimentalMaterialRelatedExperiment[] {
  if (!rows?.length) return [];
  return rows.map((r) => ({
    refSource: r.refSource === "standard_edge" || r.refSource === "workflow_link" ? r.refSource : "workflow_link",
    experimentId: String(r.experimentId ?? "").trim(),
    displayName: String(r.displayName ?? "").trim(),
    standardCode: String(r.standardCode ?? "").trim(),
  }));
}

export async function fetchExperimentalMaterialDetail(
  actor: ApiActor,
  id: string,
): Promise<{
  record: ExperimentalMaterialRecord;
  scopesCount: number;
  resourcesCount: number;
  relatedExperiments: ExperimentalMaterialRelatedExperiment[];
  coverThumb: MaterialCoverThumbInfo | null;
}> {
  const d = await fetchV2MaterialDetail(actorCore(actor), id);
  const mat = v2DetailToApiRow(d);
  const pics = d.pics ?? [];
  const coverThumb: MaterialCoverThumbInfo | null = mat.coverRegistryId
    ? { registryId: mat.coverRegistryId, posterUrl: null, processingStatus: "NONE", errorCode: null }
    : null;
  return {
    record: toRecord(mat),
    scopesCount: 0,
    resourcesCount: pics.length,
    relatedExperiments: [],
    coverThumb,
  };
}

export async function fetchExperimentalMaterialDetailFull(
  actor: ApiActor,
  id: string,
): Promise<ExperimentalMaterialDetailApiResponse> {
  const d = await fetchV2MaterialDetail(actorCore(actor), id);
  const mat = v2DetailToApiRow(d);
  const pics = d.pics ?? [];
  const resources: ExperimentalMaterialResourceApiRow[] = pics.map((p, i) => ({
    id: p.seqId,
    registryId: p.materialUrl && !/^https?:\/\//i.test(p.materialUrl) ? (p.materialUrl ?? "") : "",
    slotKey: "AUX",
    sortOrder: String(p.sortOrder ?? i) as any,
    createdAt: p.createTime ?? "",
  }));
  return {
    material: mat,
    scopes: [],
    resources,
    relatedExperiments: [],
    coverThumb: mat.coverRegistryId
      ? { registryId: mat.coverRegistryId, posterUrl: null, processingStatus: "NONE", errorCode: null }
      : null,
  };
}

export async function createExperimentalMaterialScopeApi(
  _actor: ApiActor,
  _materialId: string,
  _body: { subjectType: string; subjectKey: string; permissionMask: number; expiresAt?: string },
): Promise<ExperimentalMaterialScopeApiRow> {
  dictDimensionUnsupported();
}

export async function deleteExperimentalMaterialScopeApi(
  _actor: ApiActor,
  _materialId: string,
  _scopeId: string,
): Promise<void> {
  dictDimensionUnsupported();
}

export type ExperimentalMaterialResourceSlotKey = ExperimentalMaterialResourceApiRow["slotKey"];

export async function attachExperimentalMaterialResourceApi(
  _actor: ApiActor,
  _materialId: string,
  _body: { registryId: string; slotKey: ExperimentalMaterialResourceSlotKey; sortOrder?: number },
): Promise<ExperimentalMaterialResourceApiRow> {
  dictDimensionUnsupported();
}

export async function deleteExperimentalMaterialResourceApi(
  _actor: ApiActor,
  _materialId: string,
  _resourceId: string,
): Promise<void> {
  dictDimensionUnsupported();
}

function coverMainPicUrl(coverRegistryId: string | null | undefined): string | undefined {
  const id = coverRegistryId?.trim();
  if (!id) return undefined;
  return `/api/media/registry-stream?registryId=${encodeURIComponent(id)}&action=view`;
}

export async function createExperimentalMaterialApi(
  actor: ApiActor,
  payload: Pick<
    ExperimentalMaterialRecord,
    | "name"
    | "materialType"
    | "usage"
    | "numValue"
    | "unitId"
    | "suggestedAmount"
    | "homeAlternative"
    | "categories"
    | "safetyTags"
  > & { coverRegistryId?: string | null; status?: "ACTIVE" | "ARCHIVED"; comments?: string },
): Promise<ExperimentalMaterialRecord> {
  const materialPropId = payload.categories?.[0]?.trim() || undefined;
  const securityIds = payload.safetyTags?.length ? payload.safetyTags.map((s) => String(s)) : undefined;
  // unitId 拼入 materialNum，存储如 "500 毫升"
  const materialNum = payload.unitId?.trim()
    ? `${payload.numValue?.trim() || ""} ${payload.unitId.trim()}`.trim()
    : (payload.suggestedAmount?.trim() || payload.numValue?.trim() || undefined);
  const row = await postV2Material(actorCore(actor), {
    materialName: payload.name,
    materialTypeId: payload.materialType || undefined,
    materialPropId,
    materialNum,
    expPurpose: payload.usage,
    additionalComments: payload.homeAlternative,
    comments: payload.comments?.trim() || undefined,
    status: materialStatusUiToDb(payload.status),
    mainPicUrl: coverMainPicUrl(payload.coverRegistryId),
    securityIds,
  });
  return toRecord(v2RowToApiRow(row));
}

export async function updateExperimentalMaterialApi(
  actor: ApiActor,
  id: string,
  payload: Partial<
    Pick<
      ExperimentalMaterialRecord,
      | "name"
      | "materialType"
      | "usage"
      | "numValue"
      | "unitId"
      | "suggestedAmount"
      | "homeAlternative"
      | "categories"
      | "safetyTags"
    >
  > & { coverRegistryId?: string | null; status?: "ACTIVE" | "ARCHIVED"; comments?: string },
): Promise<ExperimentalMaterialRecord> {
  const patch: PatchV2MaterialInput = {};
  if (typeof payload.name === "string") patch.materialName = payload.name;
  if (typeof payload.materialType === "string") patch.materialTypeId = payload.materialType || null;
  if (typeof payload.usage === "string") patch.expPurpose = payload.usage;
  if (typeof payload.numValue === "string" || typeof payload.unitId === "string" || typeof payload.suggestedAmount === "string") {
    const uv = payload.numValue?.trim() ?? "";
    const uu = payload.unitId?.trim() ?? "";
    patch.materialNum = uu ? `${uv} ${uu}`.trim() : (uv || payload.suggestedAmount?.trim() || null);
  }
  if (typeof payload.homeAlternative === "string") patch.additionalComments = payload.homeAlternative;
  if (typeof payload.comments === "string") patch.comments = payload.comments.trim() || null;
  if (payload.categories?.length) patch.materialPropId = payload.categories[0] ?? null;
  if (payload.coverRegistryId !== undefined) {
    patch.mainPicUrl = coverMainPicUrl(payload.coverRegistryId) ?? null;
  }
  if (payload.status === "ACTIVE" || payload.status === "ARCHIVED") {
    patch.status = materialStatusUiToDb(payload.status);
  }
  void payload.safetyTags;
  const row = await patchV2Material(actorCore(actor), id, patch);
  return toRecord(v2RowToApiRow(row));
}

export async function deleteExperimentalMaterialApi(actor: ApiActor, id: string): Promise<void> {
  await deleteV2Material(actorCore(actor), id);
}

export async function syncExperimentMaterialLinksApi(
  _actor: ApiActor,
  _payload: { experimentId: string; materialIds: string[] },
): Promise<{ synced: number }> {
  return { synced: 0 };
}
