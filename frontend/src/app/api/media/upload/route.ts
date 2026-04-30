/**
 * /api/media/upload — 多部分表单转发至后端 /v2/file/upload
 *
 * 生产环境：
 *    浏览器 XHR  →  /api/media/upload（本 Route Handler）
 *                →  后端 /v2/file/upload（MinIO S3 写入 + data_file 登记）
 *
 * Cookie 透传：后端依赖 v2_access_token 解析 actor，本路由原样转发 Cookie。
 */

import { NextResponse } from "next/server";

const BACKEND_BASE =
  (process.env.NEXT_PUBLIC_NEW_CORE_API_BASE ?? "http://localhost:4100").replace(/\/+$/, "");

type V2Envelope = {
  success: boolean;
  data: Record<string, unknown> | null;
  error: { message: string; code?: string; source?: string; retryable?: boolean; context?: Record<string, unknown>; traceId?: string } | null;
};

function traceIdFromRequest(request: Request): string {
  return request.headers.get("x-trace-id")?.trim() || request.headers.get("x-request-id")?.trim() || `media-upload-${Date.now()}`;
}

function structuredUploadError(
  message: string,
  options: { code: string; source: string; retryable: boolean; context?: Record<string, unknown>; traceId: string },
) {
  return { ok: false as const, error: { message, code: options.code, source: options.source, retryable: options.retryable, context: options.context, traceId: options.traceId } };
}

export async function POST(request: Request) {
  const traceId = traceIdFromRequest(request);
  try {
    const ct = (request.headers.get("content-type") ?? "").toLowerCase();
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json({ ok: false, error: "请使用 multipart/form-data 上传" }, { status: 400 });
    }

    const originalForm = await request.formData();
    const file = originalForm.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "缺少 file 字段" }, { status: 400 });
    }

    // 重建表单，只转发后端关心且兼容前端上传客户端的字段
    const forwardForm = new FormData();
    forwardForm.set("file", file);

    const title = originalForm.get("title");
    if (title && typeof title === "string") {
      forwardForm.set("title", title.trim());
    }

    const mediaKind = originalForm.get("mediaKind");
    if (mediaKind && typeof mediaKind === "string") {
      forwardForm.set("mediaKind", mediaKind.trim());
    }

    const teacherMaterialKind = originalForm.get("teacherMaterialKind");
    if (teacherMaterialKind && typeof teacherMaterialKind === "string") {
      forwardForm.set("teacherMaterialKind", teacherMaterialKind.trim());
    }

    for (const key of ["userId", "orgId", "userName", "role", "uploadKey"] as const) {
      const value = originalForm.get(key);
      if (value && typeof value === "string") {
        forwardForm.set(key, value.trim());
      }
    }

    const cookie = request.headers.get("cookie") ?? "";

    const res = await fetch(`${BACKEND_BASE}/v2/file/upload`, {
      method: "POST",
      headers: {
        ...(cookie ? { cookie } : {}),
        // 不设 content-type，fetch 自动处理 multipart/form-data boundary
      },
      body: forwardForm,
    });

    const body: V2Envelope = await res.json().catch(() => ({
      success: false,
      data: null,
      error: { message: `后端返回非 JSON（HTTP ${res.status}）`, traceId },
    }));

    if (!res.ok || !body.success || !body.data) {
      const upstream = body.error;
      const status = res.status >= 400 ? res.status : 500;
      return NextResponse.json(
        structuredUploadError(upstream?.message ?? `上传失败（${res.status}）`, {
          code: upstream?.code ?? "MEDIA_UPLOAD_FAILED",
          source: upstream?.source ?? "api/media/upload",
          retryable: upstream?.retryable ?? (status >= 500),
          context: {
            status,
            upstreamStatus: res.status,
            ...(upstream?.context ?? {}),
          },
          traceId: upstream?.traceId ?? traceId,
        }),
        { status },
      );
    }

    const record = body.data;
    const fileId = record.fileId as string;
    const fileUrl = (record.fileUrl as string) ?? null;
    const status = (record.status as string) ?? "y";
    const contentDeduped = Boolean((record as Record<string, unknown>).contentDeduped);

    return NextResponse.json({
      ok: true,
      data: {
        registryId: fileId,
        assetId: fileId,
        viewUrl: fileUrl ?? "",
        reviewStatus: status === "n" ? "ARCHIVED" : "PUBLISHED",
        reused: contentDeduped,
        storageMode: "minio",
        fileUrl,
        registration: "v2",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "上传失败";
    const retryable = /ECONNRESET|TimeoutError|socket hang up|timed? out/i.test(message);
    console.error("[api/media/upload]", { traceId, error: err });
    return NextResponse.json(
      structuredUploadError(message, {
        code: retryable ? "MEDIA_UPLOAD_RETRYABLE_FAILED" : "MEDIA_UPLOAD_FAILED",
        source: "api/media/upload",
        retryable,
        context: { traceId },
        traceId,
      }),
      { status: 500 },
    );
  }
}
