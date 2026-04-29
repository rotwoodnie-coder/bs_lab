/**
 * 组织类型 `data_org_type`：仅经 V2 `/v2/sys-org-types` 读写真实库（与 `v2-sys-api` 同一 JSON 信封与请求头契约）。
 */
import { buildApiUrl, buildCoreApiJsonHeaders, buildCoreApiReadHeaders, type CoreApiActor } from "@/lib/core-api-shared";

export type V2OrgTypeItem = {
  typeId: string;
  typeName: string;
  comments: string | null;
  status: "y" | "n" | null;
  sortOrder: number | null;
};

export type CreateV2OrgTypeInput = {
  typeName: string;
  comments?: string | null;
  status?: "y" | "n";
  sortOrder?: number;
};

export type PatchV2OrgTypeInput = {
  typeName?: string;
  comments?: string | null;
  status?: "y" | "n";
  sortOrder?: number;
};

async function v2Get<T>(path: string, actor: CoreApiActor, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(buildApiUrl(path));
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), { headers: buildCoreApiReadHeaders(actor), credentials: "include" });
  const json = (await res.json()) as { success: boolean; data: T; error: { message: string } | null };
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

async function v2Post<T>(path: string, actor: CoreApiActor, body: unknown): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify(body),
    credentials: "include",
  });
  const json = (await res.json()) as { success: boolean; data: T; error: { message: string } | null };
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

async function v2Patch<T>(path: string, actor: CoreApiActor, body: unknown): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "PATCH",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify(body),
    credentials: "include",
  });
  const json = (await res.json()) as { success: boolean; data: T; error: { message: string } | null };
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

async function v2Delete<T>(path: string, actor: CoreApiActor): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "DELETE",
    headers: buildCoreApiReadHeaders(actor),
    credentials: "include",
  });
  const json = (await res.json()) as { success: boolean; data: T; error: { message: string } | null };
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

export function fetchV2OrgTypesAdmin(actor: CoreApiActor, includeInactive: boolean): Promise<V2OrgTypeItem[]> {
  return v2Get("/v2/sys-org-types", actor, includeInactive ? { includeInactive: 1 } : undefined);
}

export function createV2OrgType(actor: CoreApiActor, input: CreateV2OrgTypeInput): Promise<V2OrgTypeItem> {
  return v2Post("/v2/sys-org-types", actor, input);
}

export function patchV2OrgType(actor: CoreApiActor, typeId: string, input: PatchV2OrgTypeInput): Promise<V2OrgTypeItem> {
  return v2Patch(`/v2/sys-org-types/${encodeURIComponent(typeId)}`, actor, input);
}

export function deleteV2OrgType(actor: CoreApiActor, typeId: string): Promise<{ deleted: boolean }> {
  return v2Delete(`/v2/sys-org-types/${encodeURIComponent(typeId)}`, actor);
}
