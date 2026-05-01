import { GetObjectCommand, type GetObjectCommandInput } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import { createMediaS3Client, getMediaS3Config, normalizeMediaS3ObjectKey } from "@/lib/media-s3";

/** 与 backend s3-storage.getPublicObjectUrl 一致，使用 MINIO_ENDPOINT 作为前缀校验 */
function minioStoredUrlPrefix(): string {
  const endpoint = (process.env.MINIO_ENDPOINT ?? "http://localhost:9000").trim().replace(/\/+$/, "");
  const bucket = (process.env.MINIO_BUCKET ?? "bslab-media").trim();
  return `${endpoint}/${bucket}/`;
}

/**
 * GET ?u={encodeURIComponent(库内完整直链)}
 * 仅允许以当前服务配置的 MinIO 公共前缀开头的地址，防止开放重定向。
 * 对对象做 **同源流式直出**（200 + body），避免 302 到预签名内网地址时 `<img>` / `<video poster>` 的二次往返与裂图。
 */
export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const u = reqUrl.searchParams.get("u");
  if (!u?.trim()) {
    return NextResponse.json({ ok: false, error: "missing_u" }, { status: 400 });
  }
  const prefix = minioStoredUrlPrefix();
  // 调试日志：确认实际比对值
  console.error("[api/materials/open] prefix=%s  u=%s", prefix, u);
  if (!u.startsWith(prefix)) {
    return NextResponse.json({ ok: false, error: "url_not_allowed" }, { status: 400 });
  }
  const rawKey = u.slice(prefix.length);
  let key: string;
  try {
    key = normalizeMediaS3ObjectKey(rawKey);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_key" }, { status: 400 });
  }

  try {
    const { bucket } = getMediaS3Config();
    const client = createMediaS3Client();
    const thumbnail = reqUrl.searchParams.get("thumbnail") === "true";

    // 截帧请求：从视频源数据通过 ffmpeg 抽取第一帧返回 JPEG
    if (thumbnail) {
      try {
        const fullObj = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        if (!fullObj.Body) return NextResponse.json({ ok: false, error: "empty_body" }, { status: 502 });
        const chunks: Uint8Array[] = [];
        for await (const chunk of fullObj.Body as AsyncIterable<Uint8Array>) chunks.push(chunk);
        const sourceBuffer = Buffer.concat(chunks);

        const { spawn } = await import("node:child_process");
        return await new Promise<NextResponse>((resolve) => {
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
            if (jpeg.length > 0) {
              resolve(new NextResponse(jpeg, {
                status: 200,
                headers: {
                  "Content-Type": "image/jpeg",
                  "Cache-Control": "public, max-age=900",
                  "Content-Length": String(jpeg.length),
                },
              }));
              return;
            }
            resolve(streamObject(client, bucket, key, request));
          });
          ff.on("error", () => resolve(streamObject(client, bucket, key, request)));
          ff.stdin.write(sourceBuffer);
          ff.stdin.end();
        });
      } catch {
        /* 截帧失败时回退为流式直出 */
      }
    }

    return streamObject(client, bucket, key, request);
  } catch (e) {
    console.error("[api/materials/open]", e);
    return NextResponse.json({ ok: false, error: "get_object_failed" }, { status: 502 });
  }
}

/** 流式直出 S3 对象内容 */
async function streamObject(
  client: ReturnType<typeof createMediaS3Client>,
  bucket: string,
  key: string,
  request: Request,
): Promise<NextResponse> {
  const rangeHeader = request.headers.get("range");
  const getCmdInput: GetObjectCommandInput = {
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: "inline",
    ...(rangeHeader ? { Range: rangeHeader } : {}),
  };
  const out = await client.send(new GetObjectCommand(getCmdInput));
  if (!out.Body) return NextResponse.json({ ok: false, error: "empty_body" }, { status: 502 });

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
  return new NextResponse(out.Body.transformToWebStream(), { status: statusCode, headers });
}
