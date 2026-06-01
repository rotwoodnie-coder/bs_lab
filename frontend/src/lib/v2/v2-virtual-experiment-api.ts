/**
 * V2 虚拟实验 HTTP 客户端（/v2/virtual-experiment）
 */
import { buildApiUrl, buildCoreApiJsonHeaders, buildCoreApiReadHeaders, type CoreApiActor } from "@/lib/core-api-shared";

export type { CoreApiActor };

// ─── 类型 ──────────────────────────────────────────────

export type VirtualExperimentSourceType = "url" | "html_file";
export type VirtualExperimentStatus = "draft" | "pending" | "published" | "rejected" | "archived";

export type VirtualExperimentRecord = {
  id: string;
  title: string;
  description: string | null;
  sourceType: VirtualExperimentSourceType;
  sourceUrl: string | null;
  fileStorageKey: string | null;
  fileName: string | null;
  fileSize: number | null;
  coverUrl: string | null;
  viewCount: number | null;
  callCount: number | null;
  status: VirtualExperimentStatus;
  reviewerId: string | null;
  reviewComment: string | null;
  reviewTime: string | null;
  sortOrder: number | null;
  createUserId: string | null;
  createUserName: string | null;
  createTime: string | null;
  updateUserId: string | null;
  updateTime: string | null;
  isDeleted: string | null;
};

export type VirtualExperimentListPage = {
  items: VirtualExperimentRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export type VirtualExperimentListQuery = {
  keyword?: string;
  sourceType?: VirtualExperimentSourceType;
  status?: VirtualExperimentStatus;
  reviewMode?: boolean;
  page?: number;
  pageSize?: number;
};

// ─── 辅助函数 ──────────────────────────────────────────

async function v2Get<T>(path: string, actor: CoreApiActor, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = new URL(buildApiUrl(path));
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), { headers: buildCoreApiReadHeaders(actor), credentials: "include" });
  const text = await res.text();
  let json: { success: boolean; data: T; error: { message: string } | null };
  try { json = JSON.parse(text) as typeof json; } catch { throw new Error(res.ok ? "服务返回了无效数据" : `请求失败（HTTP ${res.status}）`); }
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

async function v2PostJson<T>(path: string, actor: CoreApiActor, body?: unknown): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  const text = await res.text();
  let json: { success: boolean; data: T; error: { message: string } | null };
  try { json = JSON.parse(text) as typeof json; } catch { throw new Error(res.ok ? "服务返回了无效数据" : `请求失败（HTTP ${res.status}）`); }
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

async function v2PutJson<T>(path: string, actor: CoreApiActor, body: unknown): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "PUT",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify(body),
    credentials: "include",
  });
  const text = await res.text();
  let json: { success: boolean; data: T; error: { message: string } | null };
  try { json = JSON.parse(text) as typeof json; } catch { throw new Error(res.ok ? "服务返回了无效数据" : `请求失败（HTTP ${res.status}）`); }
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

async function v2Delete<T>(path: string, actor: CoreApiActor): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "DELETE",
    headers: buildCoreApiReadHeaders(actor),
    credentials: "include",
  });
  const text = await res.text();
  let json: { success: boolean; data: T; error: { message: string } | null };
  try { json = JSON.parse(text) as typeof json; } catch { throw new Error(res.ok ? "服务返回了无效数据" : `请求失败（HTTP ${res.status}）`); }
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

// ─── API 方法 ──────────────────────────────────────────

/** 列表分页 */
export function fetchVirtualExperimentList(
  actor: CoreApiActor,
  query: VirtualExperimentListQuery = {},
): Promise<VirtualExperimentListPage> {
  return v2Get<VirtualExperimentListPage>(
    "/v2/virtual-experiment",
    actor,
    query as Record<string, string | number | boolean | undefined>,
  );
}

/** 获取单条详情 */
export function fetchVirtualExperimentById(
  actor: CoreApiActor,
  id: string,
): Promise<VirtualExperimentRecord> {
  return v2Get<VirtualExperimentRecord>(
    `/v2/virtual-experiment/${encodeURIComponent(id)}`,
    actor,
  );
}

/** 创建 URL 内嵌实验 */
export function createVirtualExperiment(
  actor: CoreApiActor,
  input: {
    title: string;
    description?: string;
    sourceType: VirtualExperimentSourceType;
    sourceUrl?: string;
    /** sourceType=html_file 时，文件已上传到 /v2/file/upload 后返回的 fileUrl */
    fileStorageKey?: string;
    /** 原始文件名 */
    fileName?: string;
    /** 文件字节数 */
    fileSize?: number;
    coverUrl?: string;
  },
): Promise<VirtualExperimentRecord> {
  return v2PostJson<VirtualExperimentRecord>("/v2/virtual-experiment", actor, input);
}

/** 编辑实验 */
export function updateVirtualExperiment(
  actor: CoreApiActor,
  id: string,
  input: {
    title?: string;
    description?: string | null;
    sourceUrl?: string;
    coverUrl?: string | null;
    sortOrder?: number;
    /** 替换HTML文件时的新 storage key（来自 /v2/file/upload） */
    fileStorageKey?: string;
    /** 新文件名 */
    fileName?: string;
    /** 新文件字节数 */
    fileSize?: number;
  },
): Promise<VirtualExperimentRecord> {
  return v2PutJson<VirtualExperimentRecord>(
    `/v2/virtual-experiment/${encodeURIComponent(id)}`,
    actor,
    input,
  );
}

/** 软删除 */
export function deleteVirtualExperiment(
  actor: CoreApiActor,
  id: string,
): Promise<null> {
  return v2Delete<null>(`/v2/virtual-experiment/${encodeURIComponent(id)}`, actor);
}

/** 排序 */
export function updateVirtualExperimentSort(
  actor: CoreApiActor,
  id: string,
  sortOrder: number,
): Promise<null> {
  return v2PutJson<null>(
    `/v2/virtual-experiment/${encodeURIComponent(id)}/sort`,
    actor,
    { sortOrder },
  );
}

/** 记录访问 */
export function recordView(actor: CoreApiActor, id: string): Promise<null> {
  return v2PostJson<null>(
    `/v2/virtual-experiment/${encodeURIComponent(id)}/view`,
    actor,
  );
}

/** 提交审核 */
export function submitForReview(actor: CoreApiActor, id: string): Promise<null> {
  return v2PostJson<null>(
    `/v2/virtual-experiment/${encodeURIComponent(id)}/submit`,
    actor,
  );
}

/** 审核处理 */
export function processReview(
  actor: CoreApiActor,
  id: string,
  action: "approved" | "rejected",
  comment?: string | null,
): Promise<null> {
  return v2PostJson<null>(
    `/v2/virtual-experiment/${encodeURIComponent(id)}/review`,
    actor,
    { action, comment },
  );
}

/** 调用计数 */
export function recordCall(actor: CoreApiActor, id: string): Promise<null> {
  return v2PostJson<null>(
    `/v2/virtual-experiment/${encodeURIComponent(id)}/call`,
    actor,
  );
}

/** 归档 */
export function archiveVirtualExperiment(actor: CoreApiActor, id: string): Promise<null> {
  return v2PostJson<null>(
    `/v2/virtual-experiment/${encodeURIComponent(id)}/archive`,
    actor,
  );
}

/** 上传 HTML 文件到 /v2/file/upload，返回上传结果 */
export async function uploadVirtualExperimentHtmlFile(
  file: File,
  actor: CoreApiActor,
): Promise<{ storageKey: string; fileName: string; fileSize: number }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("biz_type", "virtual_exp_html");
  formData.append("is_hidden_from_gallery", "1");

  const res = await fetch(buildApiUrl("/v2/file/upload"), {
    method: "POST",
    headers: { ...buildCoreApiReadHeaders(actor) },
    body: formData,
    credentials: "include",
  });
  const text = await res.text();
  let json: { success: boolean; data: Record<string, unknown> | null; error: { message: string } | null };
  try { json = JSON.parse(text) as typeof json; } catch { throw new Error(res.ok ? "文件上传返回了无效数据" : `文件上传失败（HTTP ${res.status}）`); }
  if (!json.success) throw new Error(json.error?.message ?? "文件上传失败");
  return {
    storageKey: String(json.data?.storageKey ?? ""),
    fileName: String(json.data?.fileName ?? file.name),
    fileSize: Number(json.data?.fileSize ?? file.size),
  };
}
