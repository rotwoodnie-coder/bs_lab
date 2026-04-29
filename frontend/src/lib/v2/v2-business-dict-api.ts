/**
 * 业务字典独立业务域 API
 */
import { buildApiUrl, buildCoreApiJsonHeaders, buildCoreApiReadHeaders, type CoreApiActor } from "@/lib/core-api-shared";

export type BusinessDictColumnMeta = {
  name: string;
  dataType: string;
  nullable: boolean;
  columnKey: string;
};

export type BusinessDictScreen = {
  meta: { table: string; primaryKey: string; columns: BusinessDictColumnMeta[] };
  rows: Record<string, unknown>[];
};

async function parseJson<T>(res: Response): Promise<T> {
  const json = (await res.json()) as { success: boolean; data: T; error: { message: string } | null };
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

export function fetchBusinessDictScreen(
  actor: CoreApiActor,
  tableName: string,
  opts?: { includeInactive?: boolean },
): Promise<BusinessDictScreen> {
  const url = new URL(buildApiUrl(`/v2/business-dict/${encodeURIComponent(tableName)}`));
  if (opts?.includeInactive) url.searchParams.set("includeInactive", "1");
  return fetch(url.toString(), { headers: buildCoreApiReadHeaders(actor), credentials: "include" }).then((res) => parseJson(res));
}

export function createBusinessDictRow(
  actor: CoreApiActor,
  tableName: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return fetch(buildApiUrl(`/v2/business-dict/${encodeURIComponent(tableName)}`), {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify(body),
    credentials: "include",
  }).then((res) => parseJson(res));
}

export function patchBusinessDictRow(
  actor: CoreApiActor,
  tableName: string,
  pkValue: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return fetch(
    buildApiUrl(`/v2/business-dict/${encodeURIComponent(tableName)}/${encodeURIComponent(pkValue)}`),
    {
      method: "PATCH",
      headers: buildCoreApiJsonHeaders(actor),
      body: JSON.stringify(body),
      credentials: "include",
    },
  ).then((res) => parseJson(res));
}

export function deleteBusinessDictRow(
  actor: CoreApiActor,
  tableName: string,
  pkValue: string,
): Promise<{ mode: "soft" | "hard" }> {
  return fetch(
    buildApiUrl(`/v2/business-dict/${encodeURIComponent(tableName)}/${encodeURIComponent(pkValue)}`),
    { method: "DELETE", headers: buildCoreApiReadHeaders(actor), credentials: "include" },
  ).then((res) => parseJson(res));
}
