/**
 * 对接后端 /v2/scale/title* 与 /v2/scale/log/admin（与 v2-social 同信封）。
 * 写入请求体使用与表列一致的 snake_case。
 */
import { buildApiUrl, buildCoreApiJsonHeaders, buildCoreApiReadHeaders, type CoreApiActor } from "@/lib/core-api-shared";

export type V2ScaleTitleItem = {
  seqId: string;
  roleId: string;
  titleName: string;
  icon: string | null;
  scoreNum: number;
};

export type V2ScaleLogItem = {
  seqId: string;
  userId: string;
  scaleSource: string | null;
  scaleNum: number;
  createTime: string | null;
};

export type CreateV2ScaleTitleBody = {
  role_id: string;
  title_name: string;
  icon?: string | null;
  score_num: number;
};

export type PatchV2ScaleTitleBody = Partial<{
  role_id: string;
  title_name: string;
  icon: string | null;
  score_num: number;
}>;

export type V2ScaleLogAdminResult = {
  items: V2ScaleLogItem[];
  total: number;
};

async function parseEnvelope<T>(res: Response): Promise<T> {
  const json = (await res.json()) as { success: boolean; data: T; error: { message: string } | null };
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message ?? `请求失败（HTTP ${res.status}）`);
  }
  return json.data;
}

async function v2Get<T>(path: string, actor: CoreApiActor, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(buildApiUrl(path));
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), { headers: buildCoreApiReadHeaders(actor), credentials: "include" });
  return parseEnvelope<T>(res);
}

async function v2Post<T>(path: string, actor: CoreApiActor, body: unknown): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify(body),
    credentials: "include",
  });
  return parseEnvelope<T>(res);
}

async function v2Patch<T>(path: string, actor: CoreApiActor, body: unknown): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "PATCH",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify(body),
    credentials: "include",
  });
  return parseEnvelope<T>(res);
}

async function v2Delete<T>(path: string, actor: CoreApiActor): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "DELETE",
    headers: buildCoreApiReadHeaders(actor),
    credentials: "include",
  });
  return parseEnvelope<T>(res);
}

export function fetchV2ScaleTitles(actor: CoreApiActor, roleId?: string): Promise<V2ScaleTitleItem[]> {
  return v2Get("/v2/scale/title", actor, roleId ? { role_id: roleId } : undefined);
}

export function createV2ScaleTitle(actor: CoreApiActor, body: CreateV2ScaleTitleBody): Promise<V2ScaleTitleItem> {
  return v2Post("/v2/scale/title", actor, body);
}

export function patchV2ScaleTitle(
  actor: CoreApiActor,
  seqId: string,
  body: PatchV2ScaleTitleBody,
): Promise<V2ScaleTitleItem> {
  return v2Patch(`/v2/scale/title/${encodeURIComponent(seqId)}`, actor, body);
}

export function deleteV2ScaleTitle(actor: CoreApiActor, seqId: string): Promise<{ deleted: boolean }> {
  return v2Delete(`/v2/scale/title/${encodeURIComponent(seqId)}`, actor);
}

export function fetchV2ScaleLogAdminPage(
  actor: CoreApiActor,
  query: { page: number; page_size: number; user_id?: string; scale_source?: string },
): Promise<V2ScaleLogAdminResult> {
  return v2Get("/v2/scale/log/admin", actor, query);
}
