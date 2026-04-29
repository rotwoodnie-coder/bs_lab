/**
 * V2 文件资源 HTTP 客户端（/v2/file）
 */
import { buildApiUrl, buildCoreApiJsonHeaders, buildCoreApiReadHeaders, type CoreApiActor } from "@/lib/core-api-shared";

export type V2DataFileRecord = {
  fileId: string;
  fileName: string;
  fileUrl: string;
  fileTypeId: string | null;
  /** 联表 `data_file_type.type_name` */
  fileTypeName: string | null;
  /** 联表 `data_file_type.logo_class` */
  fileTypeLogoClass: string | null;
  status: string | null;
  ownerUserId: string | null;
  logoUrl: string | null;
  fileSize: number | null;
  fileExt: string | null;
  /** 后端写入；列表/单条可能返回 */
  contentSha256?: string | null;
  createTime?: string | null;
  updateTime?: string | null;
};

export type V2FileListPage = {
  items: V2DataFileRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export type V2FileListQuery = {
  keyword?: string;
  fileTypeId?: string;
  ownerUserId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

async function v2DeleteJson<T>(path: string, actor: CoreApiActor): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "DELETE",
    headers: buildCoreApiReadHeaders(actor),
    credentials: "include",
  });
  const text = await res.text();
  let json: { success: boolean; data: T; error: { message: string } | null };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(res.ok ? "服务返回了无效数据" : `请求失败（HTTP ${res.status}）`);
  }
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
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
  const text = await res.text();
  let json: { success: boolean; data: T; error: { message: string } | null };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(res.ok ? "服务返回了无效数据" : `请求失败（HTTP ${res.status}）`);
  }
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

export function fetchV2FileListPage(actor: CoreApiActor, query: V2FileListQuery = {}): Promise<V2FileListPage> {
  return v2Get<V2FileListPage>("/v2/file", actor, query as Record<string, string | number | undefined>);
}

/** 分页拉全量（后端 pageSize 上限 100） */
export async function fetchV2FilesAll(
  actor: CoreApiActor,
  baseQuery: Omit<V2FileListQuery, "page" | "pageSize"> = {},
): Promise<V2DataFileRecord[]> {
  const pageSize = 100;
  let page = 1;
  const out: V2DataFileRecord[] = [];
  while (true) {
    const { items, total } = await fetchV2FileListPage(actor, { ...baseQuery, page, pageSize });
    out.push(...items);
    if (items.length < pageSize || out.length >= total) break;
    page += 1;
  }
  return out;
}

export function fetchV2FileById(actor: CoreApiActor, fileId: string): Promise<V2DataFileRecord> {
  return v2Get<V2DataFileRecord>(`/v2/file/${encodeURIComponent(fileId)}`, actor);
}

export type V2FileThumbnailEnsureResult = {
  fileId: string;
  scheduled: boolean;
  alreadyHasLogo?: boolean;
};

/** 触发服务端从对象存储补跑封面（与上传后 `finalizeDataFileThumbnail` 同源；不阻塞生成完成）。 */
export async function postV2FileThumbnailEnsure(
  actor: CoreApiActor,
  fileId: string,
  body: { force?: boolean } = {},
): Promise<V2FileThumbnailEnsureResult> {
  const url = buildApiUrl(`/v2/file/${encodeURIComponent(fileId)}/thumbnail/ensure`);
  const res = await fetch(url, {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify(body),
    credentials: "include",
  });
  const text = await res.text();
  let json: { success: boolean; data: V2FileThumbnailEnsureResult; error: { message: string } | null };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(res.ok ? "服务返回了无效数据" : `请求失败（HTTP ${res.status}）`);
  }
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

export function deleteV2File(actor: CoreApiActor, fileId: string): Promise<{ fileId: string; deleted: boolean }> {
  return v2DeleteJson<{ fileId: string; deleted: boolean }>(
    `/v2/file/${encodeURIComponent(fileId)}`,
    actor,
  );
}

/** 批量按 `data_file.file_id` 取行（含 `data_file_type`），与库表字段一致 */
export async function fetchV2FilesLookup(actor: CoreApiActor, fileIds: string[]): Promise<V2DataFileRecord[]> {
  const ids = [...new Set(fileIds.map((id) => id.trim()).filter(Boolean))].slice(0, 80);
  if (ids.length === 0) return [];
  const url = buildApiUrl("/v2/file/lookup");
  const res = await fetch(url, {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify({ fileIds: ids }),
    credentials: "include",
  });
  const json = (await res.json()) as {
    success: boolean;
    data: { items: V2DataFileRecord[] } | null;
    error: { message: string } | null;
  };
  if (!json.success || !json.data?.items) throw new Error(json.error?.message ?? "请求失败");
  return json.data.items;
}

export type V2FilePresignedResult = { fileId: string; presignedUrl: string; action: "view" | "download" };

export function fetchV2FilePresignedUrl(
  actor: CoreApiActor,
  fileId: string,
  action: "view" | "download" = "view",
): Promise<V2FilePresignedResult> {
  return v2Get<V2FilePresignedResult>(`/v2/file/${encodeURIComponent(fileId)}/presigned-url`, actor, { action });
}

export type V2FilePatchBody = {
  fileName?: string;
  logoUrl?: string | null;
  /** 业务意图 → 后端静态映射解析为 FT_ 物理 ID */
  teacherMaterialKind?: string;
  status?: string;
};

/** PATCH `/v2/file/:fileId`，更新 `data_file` 可写字段（与后端 `updateFileSchema` 一致） */
export async function patchV2FileRecord(actor: CoreApiActor, fileId: string, body: V2FilePatchBody): Promise<V2DataFileRecord> {
  const url = buildApiUrl(`/v2/file/${encodeURIComponent(fileId)}`);
  const res = await fetch(url, {
    method: "PATCH",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify(body),
    credentials: "include",
  });
  const text = await res.text();
  let json: { success: boolean; data: V2DataFileRecord; error: { message: string } | null };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(res.ok ? "服务返回了无效数据" : `更新失败（HTTP ${res.status}）`);
  }
  if (!json.success) throw new Error(json.error?.message ?? "更新失败");
  return json.data;
}

export type V2FileDataRepairResult = {
  fileId: string;
  contentSha256Updated: boolean;
  fileTypeIdUpdated: boolean;
  skipped?: "not_found" | "forbidden" | "nothing_to_fill";
};

/** POST `/v2/file/:fileId/data-repair`：从对象存储计算 SHA-256 并推断 `file_type_id`，仅写入空列 */
export type V2FilePosterUploadResult = {
  fileId: string;
  logoUrl: string;
  alreadyHasPoster?: boolean;
};

/** POST `/v2/file/:fileId/poster`：multipart `file`，JPEG/PNG，≤500KB，写入 MinIO 并更新 `logo_url` */
export async function postV2FilePosterUpload(
  actor: CoreApiActor,
  fileId: string,
  blob: Blob,
): Promise<V2FilePosterUploadResult> {
  const fd = new FormData();
  const isPng = blob.type.toLowerCase().includes("png");
  fd.append("file", blob, isPng ? "poster.png" : "poster.jpg");
  const url = buildApiUrl(`/v2/file/${encodeURIComponent(fileId)}/poster`);
  const res = await fetch(url, {
    method: "POST",
    headers: buildCoreApiReadHeaders(actor),
    body: fd,
    credentials: "include",
  });
  const text = await res.text();
  let json: { success: boolean; data: V2FilePosterUploadResult; error: { message: string } | null };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(res.ok ? "服务返回了无效数据" : `请求失败（HTTP ${res.status}）`);
  }
  if (!json.success) throw new Error(json.error?.message ?? "封面上传失败");
  return json.data;
}

export async function postV2FileDataRepair(actor: CoreApiActor, fileId: string): Promise<V2FileDataRepairResult> {
  const url = buildApiUrl(`/v2/file/${encodeURIComponent(fileId)}/data-repair`);
  const res = await fetch(url, {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify({}),
    credentials: "include",
  });
  const text = await res.text();
  let json: { success: boolean; data: V2FileDataRepairResult; error: { message: string } | null };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(res.ok ? "服务返回了无效数据" : `请求失败（HTTP ${res.status}）`);
  }
  if (!json.success) throw new Error(json.error?.message ?? "数据补齐失败");
  return json.data;
}
