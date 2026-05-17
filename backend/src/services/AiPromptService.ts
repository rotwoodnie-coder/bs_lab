/**
 * AiPromptService：系统提示词模板管理服务
 *
 * 职责：
 * 1. 从 DB 获取活性 prompt 模板（按角色），带 LRU 缓存（60s TTL）
 * 2. 渲染模板变量（{{userName}} 等占位符插值）
 * 3. 查询失败时返回 null，由调用方决定 fallback
 *
 * 缓存策略：
 * - code → rendered prompt 的简单 LRU，最大 32 条
 * - 60s TTL，避免每次对话都查 DB
 */
import {
  getActiveAiPromptByRole,
  listAiPromptTemplates,
  getAiPromptTemplateById,
  insertAiPromptTemplate,
  updateAiPromptTemplate,
  deleteAiPromptTemplate,
} from "../infrastructure/repositories/v2-ai-repository.ts";
import type {
  AiPromptTemplateRecord,
  CreateAiPromptTemplateInput,
  UpdateAiPromptTemplateInput,
} from "../domain/v2-ai/v2-ai-types.ts";

// ─── 错误 ────────────────────────────────────────────────

export class AiPromptServiceError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "AiPromptServiceError";
  }
}

// ─── 缓存 ────────────────────────────────────────────────

interface CacheEntry {
  content: string;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_MAX = 32;
const CACHE_TTL_MS = 60_000;

function cacheGet(key: string): string | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.content;
}

function cacheSet(key: string, content: string): void {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(key, { content, expiresAt: Date.now() + CACHE_TTL_MS });
}

function cacheClear(): void {
  cache.clear();
}

// ─── 变量渲染 ────────────────────────────────────────────

/**
 * 渲染 prompt 模板中的变量占位符
 * 支持：{{userName}} {{schoolLevelId}}
 */
function renderTemplate(template: string, vars: Record<string, string | null | undefined>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    if (value != null) {
      result = result.replaceAll(`{{${key}}}`, value);
    }
  }
  return result;
}

// ─── 主服务 ──────────────────────────────────────────────

/**
 * 获取指定角色的系统提示词
 *
 * 加载顺序：
 * 1. 缓存命中 → 直接返回
 * 2. DB 查询活性模板 → 渲染变量 → 写入缓存 → 返回
 * 3. 异常或无匹配 → 返回 null（调用方自行 fallback）
 *
 * @param role - 角色标识（"Teacher" / "Student" / "Researcher"）
 * @param vars - 插值变量（如 { userName: "小明", schoolLevelId: "primary" }）
 * @returns 渲染后的 prompt 文本，或 null
 */
export async function getPromptContent(
  role: string,
  vars?: Record<string, string | null | undefined>,
): Promise<string | null> {
  const cacheKey = `prompt:${role}`;

  // 1) 缓存命中
  const cached = cacheGet(cacheKey);
  if (cached !== null) {
    return cached;
  }

  try {
    // 2) DB 查询（先精确匹配 role，再回退到 role='*'）
    const template = await getActiveAiPromptByRole(role);
    if (template) {
      const rendered = renderTemplate(template.content, vars ?? {});
      cacheSet(cacheKey, rendered);
      return rendered;
    }
  } catch (err) {
    console.warn("[AiPromptService] DB query failed:", (err as Error)?.message);
  }

  return null;
}

/**
 * 清除所有缓存（在后台编辑模板后调用）
 */
export function invalidatePromptCache(): void {
  cacheClear();
}

// ─── 管理接口（透传 Repository）────────────────────────

export async function listTemplates(): Promise<AiPromptTemplateRecord[]> {
  return listAiPromptTemplates();
}

export async function getTemplateById(templateId: string): Promise<AiPromptTemplateRecord | null> {
  return getAiPromptTemplateById(templateId);
}

export async function createTemplate(input: CreateAiPromptTemplateInput): Promise<string> {
  const tid = await insertAiPromptTemplate(input);
  cacheClear();
  return tid;
}

export async function updateTemplate(
  templateId: string,
  input: UpdateAiPromptTemplateInput,
): Promise<void> {
  await updateAiPromptTemplate(templateId, input);
  cacheClear();
}

export async function deleteTemplate(templateId: string): Promise<void> {
  await deleteAiPromptTemplate(templateId);
  cacheClear();
}
