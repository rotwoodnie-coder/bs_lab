/**
 * V2 AI Prompt 模板管理 API
 */
import { buildApiUrl, buildCoreApiJsonHeaders, buildCoreApiReadHeaders, type CoreApiActor } from "@/lib/core-api-shared";
import type { V2ApiEnvelope } from "@/lib/v2/apiService";

// ─── 类型 ────────────────────────────────────────────────

export interface AiPromptTemplate {
  templateId: string;
  code: string;
  name: string;
  role: string;
  content: string;
  version: number;
  isActive: "y" | "n";
  description: string | null;
  createUserId: string | null;
  updateUserId: string | null;
  createTime: string | null;
  updateTime: string | null;
}

export interface CreateAiPromptInput {
  code: string;
  name: string;
  role: string;
  content: string;
  version?: number;
  is_active?: "y" | "n";
  description?: string;
}

export interface UpdateAiPromptInput {
  name?: string;
  content?: string;
  version?: number;
  is_active?: "y" | "n";
  description?: string;
}

// ─── API ─────────────────────────────────────────────────

async function parseJson<T>(res: Response): Promise<T> {
  const json = (await res.json()) as V2ApiEnvelope<T>;
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data as T;
}

/**
 * 列出所有 Prompt 模板
 */
export function listAiPrompts(actor: CoreApiActor): Promise<AiPromptTemplate[]> {
  return fetch(buildApiUrl("/v2/ai/prompts"), {
    headers: buildCoreApiReadHeaders(actor),
    credentials: "include",
  }).then((res) => parseJson(res));
}

/**
 * 查询单个 Prompt 模板
 */
export function getAiPromptById(actor: CoreApiActor, templateId: string): Promise<AiPromptTemplate> {
  return fetch(buildApiUrl(`/v2/ai/prompts/${encodeURIComponent(templateId)}`), {
    headers: buildCoreApiReadHeaders(actor),
    credentials: "include",
  }).then((res) => parseJson(res));
}

/**
 * 创建 Prompt 模板
 */
export function createAiPrompt(actor: CoreApiActor, input: CreateAiPromptInput): Promise<{ templateId: string }> {
  return fetch(buildApiUrl("/v2/ai/prompts"), {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify(input),
    credentials: "include",
  }).then((res) => parseJson(res));
}

/**
 * 更新 Prompt 模板
 */
export function updateAiPrompt(actor: CoreApiActor, templateId: string, input: UpdateAiPromptInput): Promise<{ updated: boolean }> {
  return fetch(buildApiUrl(`/v2/ai/prompts/${encodeURIComponent(templateId)}`), {
    method: "PUT",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify(input),
    credentials: "include",
  }).then((res) => parseJson(res));
}

/**
 * 删除 Prompt 模板
 */
export function deleteAiPrompt(actor: CoreApiActor, templateId: string): Promise<{ deleted: boolean }> {
  return fetch(buildApiUrl(`/v2/ai/prompts/${encodeURIComponent(templateId)}`), {
    method: "DELETE",
    headers: buildCoreApiReadHeaders(actor),
    credentials: "include",
  }).then((res) => parseJson(res));
}
