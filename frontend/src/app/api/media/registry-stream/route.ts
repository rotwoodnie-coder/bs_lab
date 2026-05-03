import { GetObjectCommand, type GetObjectCommandInput } from "@aws-sdk/client-s3";
import { createMediaS3Client, getMediaS3Config, normalizeMediaS3ObjectKey } from "@/lib/media-s3";
import { buildApiUrl, buildCoreApiReadHeaders } from "@/lib/core-api-shared";
import { resolveExperimentalMaterialsOrgId } from "@/lib/materials-api-actor";
import { resolveDemoRoleCookie } from "@/lib/resolve-demo-api-role";
import { UserRole } from "@/types/auth";

type FileEnvelope = {
  success?: boolean;
  data?: { fileUrl?: string; fileName?: string };
  error?: { message?: string } | null;
};

/** 与 backend s3-storage.getPublicObjectUrl 一致 */
function minioStoredUrlPrefix(): string {
  const publicUrl = (process.env.MINIO_PUBLIC_URL ?? "").trim();
  const endpoint = ((publicUrl || process.env.MINIO_ENDPOINT) ?? "http://localhost:9000").trim().replace(/\/+$/, "");
  const bucket = (process.env.MINIO_BUCKET ?? "bslab-media").trim();
  return `${endpoint}/${bucket}/`;
}

/**
 * 从返回的 fileUrl 反解 object key。
 * - 完整公网 URL（materialized）：`http://localhost:9000/bslab-media/v2/anon/xxx.mp4` → `v2/anon/xxx.mp4`
 * - 原始相对 key（非 materialized）：`v2/anon/xxx.mp4` → 直接使用
 */
function resolveObjectKey(fileUrl: string): string | null {
  const raw = fileUrl.trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    const prefix = minioStoredUrlPrefix();
    if (raw.startsWith(prefix)) {
      // 剥离前缀后，去掉查询参数（预签名 URL 携带 ?X-Amz-Algorithm=...）
      const afterPrefix = raw.slice(prefix.length);
      const qIdx = afterPrefix.indexOf("?");
      return qIdx >= 0 ? afterPrefix.slice(0, qIdx) : afterPrefix;
    }
    return null;
  }
  // 纯 key 也可能携带了查询参数
  const qIdx = raw.indexOf("?");
  const clean = qIdx >= 0 ? raw.slice(0, qIdx) : raw;
  return clean.replace(/^\/+/, "") || null;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const registryId = url.searchParams.get("registryId")?.trim();
    if (!registryId) {
      return Response.json({ ok: false, error: "缺少 registryId" }, { status: 400 });
    }
    const action = url.searchParams.get("action") === "download" ? "download" : "view";
    const variant = url.searchParams.get("variant")?.trim();
    const thumbnail = url.searchParams.get("thumbnail") === "true" || variant === "thumb_sm";

    // 1. 从后端获取文件记录（获取 MinIO object key）
    const role = (await resolveDemoRoleCookie()) as UserRole;
    const orgId = resolveExperimentalMaterialsOrgId(
      url.searchParams.get("orgId")?.trim() || "org-school-east",
    );
    const userId = url.searchParams.get("userId")?.trim() || `${role}-demo`;
    const userName = url.searchParams.get("userName")?.trim() || userId;
    const tenantId = url.searchParams.get("tenantId")?.trim() || undefined;
    const appId = url.searchParams.get("appId")?.trim() || undefined;

    const actor = { role, userId, userName, orgId, tenantId, appId };
    const fileReqUrl = new URL(buildApiUrl(`/v2/file/${encodeURIComponent(registryId)}`));
    const fileRes = await fetch(fileReqUrl.toString(), { headers: buildCoreApiReadHeaders(actor) });
    const fileBody = (await fileRes.json()) as FileEnvelope;

    if (!fileRes.ok || !fileBody.success || !fileBody.data?.fileUrl) {
      const msg = fileBody.error?.message ?? "未找到该文件";
      return Response.json({ ok: false, error: msg }, { status: fileRes.status >= 400 ? fileRes.status : 404 });
    }

    const fileUrl = fileBody.data.fileUrl.trim();
    const objectKey = resolveObjectKey(fileUrl);

    // 非 MinIO 存储的文件：302 跳转（如外部公网 URL）
    if (!objectKey) {
      return Response.redirect(fileUrl, 302);
    }

    // 如果 fileUrl 已经是预签名 URL（包含签名参数），直接 302 跳转，
    // 避免通过 Node 代理中转（代理会丢失 Range 头且增加服务端负担）
    if (fileUrl.includes("X-Amz-Signature=")) {
      return Response.redirect(fileUrl, 302);
    }

    // 2. 同源流式直出 S3 对象（与 /api/materials/open 一致，避免 302 丢失 Range 头）
    const normalizedKey = normalizeMediaS3ObjectKey(objectKey);
    const { bucket } = getMediaS3Config();
    const client = createMediaS3Client();

    // 截帧请求：从视频读取源数据，通过 ffmpeg 抽取第一帧返回 JPEG
    if (thumbnail) {
      try {
        const fullObj = await client.send(new GetObjectCommand({ Bucket: bucket, Key: normalizedKey }));
        if (!fullObj.Body) return Response.json({ ok: false, error: "empty_body" }, { status: 502 });
        const chunks: Uint8Array[] = [];
        for await (const chunk of fullObj.Body as AsyncIterable<Uint8Array>) chunks.push(chunk);
        const sourceBuffer = Buffer.concat(chunks);

        const { spawn } = await import("node:child_process");
        return await new Promise<Response>((resolve) => {
          const ff = spawn("ffmpeg", [
            "-i", "pipe:0",
            "-vframes", "1",
            "-f", "image2pipe",
            "-vcodec", "mjpeg",
            "-q:v", "3",
            "pipe:1",
          ]);
          const outChunks: Buffer[] = [];
          ff.stdout.on("data", (c: Buffer) => outChunks.push(c));
          ff.stdout.on("end", () => {
            const jpeg = Buffer.concat(outChunks);
            if (jpeg.length === 0) {
              // ffmpeg 未能输出，回退为源文件流式直出
              resolve(fallbackStream(client, bucket, normalizedKey, req, action));
              return;
            }
            resolve(
              new Response(jpeg, {
                status: 200,
                headers: {
                  "Content-Type": "image/jpeg",
                  "Cache-Control": "public, max-age=900",
                  "Content-Length": String(jpeg.length),
                },
              }),
            );
          });
          ff.on("error", () => {
            resolve(fallbackStream(client, bucket, normalizedKey, req, action));
          });
          ff.stdin.write(sourceBuffer);
          ff.stdin.end();
        });
      } catch {
        /* 截帧失败时回退为流式直出 */
      }
    }

    return fallbackStream(client, bucket, normalizedKey, req, action);
  } catch (e) {
    const message = e instanceof Error ? e.message : "读取失败";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

/** 回退：流式直出 S3 对象（与 /api/materials/open 一致，避免 302 丢失 Range 头） */
async function fallbackStream(
  client: ReturnType<typeof createMediaS3Client>,
  bucket: string,
  key: string,
  req: Request,
  action: "view" | "download",
): Promise<Response> {
  const rangeHeader = req.headers.get("range");
  const getCmdInput: GetObjectCommandInput = {
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: action === "download" ? "attachment" : "inline",
    ...(rangeHeader ? { Range: rangeHeader } : {}),
  };
  const out = await client.send(new GetObjectCommand(getCmdInput));
  if (!out.Body) return Response.json({ ok: false, error: "empty_body" }, { status: 502 });
  const headers = new Headers();
  const ct = out.ContentType?.trim();
  headers.set("Content-Type", ct && ct.length > 0 ? ct : "application/octet-stream");
  headers.set("Cache-Control", "private, max-age=300");
  headers.set("Accept-Ranges", "bytes");
  const cl = out.ContentLength;
  if (typeof cl === "number" && Number.isFinite(cl) && cl >= 0) headers.set("Content-Length", String(cl));
  if (out.ContentRange) headers.set("Content-Range", out.ContentRange);
  if (out.ETag) headers.set("ETag", out.ETag);
  if (out.LastModified) headers.set("Last-Modified", out.LastModified.toUTCString());
  const statusCode = rangeHeader ? 206 : 200;
  return new Response(out.Body.transformToWebStream(), { status: statusCode, headers });
}
