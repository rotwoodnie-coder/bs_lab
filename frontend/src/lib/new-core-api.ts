"use client";

import { UserRole } from "@/types/auth";

import { buildApiUrl, buildCoreApiJsonHeaders } from "./core-api-shared";

export type ApiActor = {
  role: UserRole;
  userId: string;
  userName: string;
  orgId: string;
  tenantId?: string;
  appId?: string;
};

type Envelope<T> = {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
};

const NEW_CORE_API_TIMEOUT_MS = 30_000;

export async function callNewCoreApi<T>(
  actor: ApiActor,
  path: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  body?: Record<string, unknown>,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NEW_CORE_API_TIMEOUT_MS);
  try {
    response = await fetch(buildApiUrl(path), {
      method,
      headers: { ...buildCoreApiJsonHeaders(actor), ...extraHeaders },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("请求超时，请稍后重试");
    }
    throw new Error(e instanceof Error ? `网络异常：${e.message}` : "网络异常");
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  let payload: Envelope<T>;
  try {
    payload = JSON.parse(text) as Envelope<T>;
  } catch {
    throw new Error(
      response.ok ? "服务返回了无效数据" : `请求失败（HTTP ${response.status}）`,
    );
  }

  if (!payload.success || !response.ok) {
    throw new Error(payload.error?.message ?? "请求失败");
  }
  return payload.data;
}

export {
  buildApiUrl,
  getExperimentCatalogTenantId,
  getMediaSubjectKey,
  roleToHeader,
  toAsciiHeaderValue,
} from "./core-api-shared";
