/**
 * V2 材料库 API 薄封装
 * 仅保留：类型声明 + 路径常量 + 对 apiService 的调用
 *
 * 常见错误码预留：
 * - 4001 内容超过字符上限
 * - 4002 名称不能为空
 */
import { createV2ApiService, type V2ApiListPage } from "@/lib/v2/apiService";
import type { CoreApiActor } from "@/lib/core-api-shared";

export interface V2MaterialPicRow {
  seqId: string;
  materialId: string;
  materialUrl: string | null;
  sortOrder: number | null;
  createTime: string | null;
}

export interface V2MaterialSecurityRow {
  seqId: string;
  materialId: string;
  securityId: string;
  sortOrder: number | null;
  createTime: string | null;
}

export interface V2MaterialMsgRow {
  materialId: string;
  materialName: string;
  materialPropId: string | null;
  materialTypeId: string | null;
  materialNum: string | null;
  mainPicUrl: string | null;
  logoUrl?: string | null;
  expPurpose: string | null;
  additionalComments: string | null;
  comments: string | null;
  status: string | null;
  createUserId: string | null;
  displayOwnerName?: string | null;
  createTime: string | null;
  updateUserId: string | null;
  updateTime: string | null;
  isDeleted: 0 | 1;
  pics?: V2MaterialPicRow[];
  securities?: V2MaterialSecurityRow[];
}

export type V2MaterialDetail = V2MaterialMsgRow & {
  displayOwnerName: string | null;
  pics: V2MaterialPicRow[];
  securities: V2MaterialSecurityRow[];
};

export type V2MaterialListPage = V2ApiListPage<V2MaterialMsgRow>;

export type V2MaterialListQuery = {
  keyword?: string;
  materialTypeId?: string;
  materialPropId?: string;
  status?: string;
  createUserId?: string;
  page?: number;
  pageSize?: number;
};

export type PatchV2MaterialInput = Partial<{
  materialName: string;
  materialPropId: string | null;
  materialTypeId: string | null;
  materialNum: string | null;
  mainPicUrl: string | null;
  expPurpose: string | null;
  additionalComments: string | null;
  comments: string | null;
  status: string | null;
}>;

export type PostV2MaterialInput = {
  materialName: string;
  materialPropId?: string;
  materialTypeId?: string;
  materialNum?: string;
  mainPicUrl?: string;
  expPurpose?: string;
  additionalComments?: string;
  comments?: string;
  status?: string;
  picUrls?: string[];
  securityIds?: string[];
};

const MATERIAL_PATH = "/v2/material";

export function fetchV2MaterialListPage(actor: CoreApiActor, query: V2MaterialListQuery = {}): Promise<V2MaterialListPage> {
  return createV2ApiService(actor).get<V2MaterialListPage>(MATERIAL_PATH, query);
}

export async function fetchV2MaterialsAll(
  actor: CoreApiActor,
  baseQuery: Omit<V2MaterialListQuery, "page" | "pageSize"> = {},
): Promise<V2MaterialMsgRow[]> {
  const api = createV2ApiService(actor);
  const pageSize = 100;
  let page = 1;
  const out: V2MaterialMsgRow[] = [];
  while (true) {
    const pageData = await api.get<V2MaterialListPage>(MATERIAL_PATH, { ...baseQuery, page, pageSize });
    out.push(...pageData.items);
    if (pageData.items.length < pageSize || out.length >= pageData.total) break;
    page += 1;
  }
  return out;
}

export function postV2Material(actor: CoreApiActor, body: PostV2MaterialInput): Promise<V2MaterialMsgRow> {
  return createV2ApiService(actor).post<V2MaterialMsgRow>(MATERIAL_PATH, body);
}

export function deleteV2Material(actor: CoreApiActor, materialId: string): Promise<{ materialId: string; deleted: boolean }> {
  return createV2ApiService(actor).delete<{ materialId: string; deleted: boolean }>(`${MATERIAL_PATH}/${encodeURIComponent(materialId)}`);
}

export function fetchV2MaterialDetail(actor: CoreApiActor, materialId: string): Promise<V2MaterialDetail> {
  return createV2ApiService(actor).get<V2MaterialDetail>(`${MATERIAL_PATH}/${encodeURIComponent(materialId)}`);
}

export function patchV2Material(actor: CoreApiActor, materialId: string, body: PatchV2MaterialInput): Promise<V2MaterialMsgRow> {
  return createV2ApiService(actor).patch<V2MaterialMsgRow>(`${MATERIAL_PATH}/${encodeURIComponent(materialId)}`, body);
}
