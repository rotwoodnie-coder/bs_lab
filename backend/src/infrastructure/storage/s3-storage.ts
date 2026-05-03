/**
 * S3 / MinIO 存储工具（通用）
 * 环境变量：MINIO_ENDPOINT / MINIO_BUCKET / MEDIA_APP_ACCESS_KEY / MEDIA_APP_SECRET_KEY
 */
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NodeHttpHandler } from "@smithy/node-http-handler";

function isRetryableStorageReadError(err: unknown): boolean {
  const code = typeof err === "object" && err !== null && "code" in err ? String((err as { code?: unknown }).code ?? "") : "";
  const name = typeof err === "object" && err !== null && "name" in err ? String((err as { name?: unknown }).name ?? "") : "";
  const message = err instanceof Error ? err.message : String(err);
  return code === "ECONNRESET" || name === "TimeoutError" || /ECONNRESET|socket hang up|timed? out/i.test(message);
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`MISSING_ENV:${name}`);
  return value;
}

export function normalizeKey(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/").trim().replace(/^\/+/, "");
  if (!normalized || normalized.includes("..")) throw new Error("INVALID_STORAGE_KEY");
  return normalized;
}

export function getConfig() {
  return {
    endpoint: (process.env.MINIO_ENDPOINT ?? "http://localhost:9000").trim(),
    publicUrl: (process.env.MINIO_PUBLIC_URL ?? "").trim(),
    bucket: (process.env.MINIO_BUCKET ?? "bslab-media").trim(),
    region: (process.env.MINIO_REGION ?? "us-east-1").trim(),
    credentials: {
      accessKeyId: requiredEnv("MEDIA_APP_ACCESS_KEY"),
      secretAccessKey: requiredEnv("MEDIA_APP_SECRET_KEY"),
    },
  };
}

/** 单例 S3Client，复用 TCP 连接池 */
let _s3Client: S3Client | null = null;

export function getClient(): S3Client {
  if (_s3Client) return _s3Client;
  const cfg = getConfig();
  _s3Client = new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    forcePathStyle: true,
    credentials: cfg.credentials,
    requestHandler: new NodeHttpHandler({
      connectionTimeout: 10_000,
      requestTimeout: 60_000,
    }),
    retryMode: "adaptive",
    maxAttempts: 3,
  });
  return _s3Client;
}

export async function putObject(storageKey: string, body: Buffer, contentType: string): Promise<void> {
  const cfg = getConfig();
  const client = getClient();
  const key = normalizeKey(storageKey);
  const startedAt = Date.now();
  try {
    await client.send(new PutObjectCommand({ Bucket: cfg.bucket, Key: key, Body: body, ContentType: contentType }));
    console.info("[s3-storage] putObject ok", {
      bucket: cfg.bucket,
      endpoint: cfg.endpoint,
      key,
      bytes: body.length,
      contentType,
      elapsedMs: Date.now() - startedAt,
    });
  } catch (err) {
    console.error("[s3-storage] putObject failed", {
      bucket: cfg.bucket,
      endpoint: cfg.endpoint,
      key,
      bytes: body.length,
      contentType,
      elapsedMs: Date.now() - startedAt,
      code: typeof err === "object" && err !== null && "code" in err ? String((err as { code?: unknown }).code ?? "") : "",
      name: typeof err === "object" && err !== null && "name" in err ? String((err as { name?: unknown }).name ?? "") : "",
      message: err instanceof Error ? err.message : String(err),
      retryable: isRetryableStorageReadError(err),
      error: err,
    });
    throw err;
  }
}

export function getDirectUrl(storageKey: string): string {
  return getPublicObjectUrl(storageKey);
}

export async function deleteObject(storageKey: string): Promise<void> {
  const cfg = getConfig();
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: normalizeKey(storageKey) }));
}

export async function getObjectBuffer(storageKey: string): Promise<Buffer> {
  const cfg = getConfig();
  const client = getClient();
  const key = normalizeKey(storageKey);
  const startedAt = Date.now();
  try {
    const res = await client.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: key }));
    if (!res.Body) throw new Error("EMPTY_S3_BODY");
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
      bytes += chunk.byteLength;
    }
    console.info("[s3-storage] getObjectBuffer ok", {
      bucket: cfg.bucket,
      endpoint: cfg.endpoint,
      key,
      bytes,
      elapsedMs: Date.now() - startedAt,
    });
    return Buffer.concat(chunks);
  } catch (err) {
    console.error("[s3-storage] getObjectBuffer failed", {
      bucket: cfg.bucket,
      endpoint: cfg.endpoint,
      key,
      elapsedMs: Date.now() - startedAt,
      code: typeof err === "object" && err !== null && "code" in err ? String((err as { code?: unknown }).code ?? "") : "",
      name: typeof err === "object" && err !== null && "name" in err ? String((err as { name?: unknown }).name ?? "") : "",
      message: err instanceof Error ? err.message : String(err),
      retryable: isRetryableStorageReadError(err),
      error: err,
    });
    throw err;
  }
}

export async function createPresignedReadUrl(
  storageKey: string,
  options?: { action?: "view" | "download"; expiresInSeconds?: number },
): Promise<string> {
  const cfg = getConfig();
  const client = getClient();
  const action = options?.action ?? "view";
  const command = new GetObjectCommand({
    Bucket: cfg.bucket,
    Key: normalizeKey(storageKey),
    ResponseContentDisposition: action === "download" ? "attachment" : "inline",
  });
  const expiresIn = Math.min(3600, Math.max(60, options?.expiresInSeconds ?? 900));
  return getSignedUrl(client, command, { expiresIn });
}

/**
 * 生成公网可访问的预签名 URL。
 * 使用 `MINIO_PUBLIC_URL`（若配置）作为 endpoint，使得生成的 signed URL 指向公网入口，
 * 浏览器可直接加载，无需前端 S3 代理路由。
 *
 * `getSignedUrl` 为纯本地运算，不发起网络请求，每次创建新 S3Client 的开销可忽略。
 */
export async function createPublicPresignedReadUrl(
  storageKey: string,
  options?: { action?: "view" | "download"; expiresInSeconds?: number },
): Promise<string> {
  const cfg = getConfig();
  const endpoint = (cfg.publicUrl || cfg.endpoint).replace(/\/+$/, "");
  const action = options?.action ?? "view";
  const presignClient = new S3Client({
    region: cfg.region,
    endpoint,
    forcePathStyle: true,
    credentials: cfg.credentials,
  });
  const command = new GetObjectCommand({
    Bucket: cfg.bucket,
    Key: normalizeKey(storageKey),
    ResponseContentDisposition: action === "download" ? "attachment" : "inline",
  });
  const expiresIn = Math.min(3600, Math.max(60, options?.expiresInSeconds ?? 3600));
  return getSignedUrl(presignClient, command, { expiresIn });
}

export function getStorageKey(storageKey: string): string {
  return normalizeKey(storageKey);
}

export function getPublicObjectUrl(storageKey: string): string {
  const cfg = getConfig();
  const base = (cfg.publicUrl || cfg.endpoint).replace(/\/$/, "");
  return `${base}/${cfg.bucket}/${normalizeKey(storageKey)}`;
}

/** `data_file.file_url` 格式兼容：storage key 或完整 URL，反解出 S3 object key。返回 null 表示非本环境存储 */
export function tryStorageKeyFromFileUrl(fileUrl: string): string | null {
  const raw = fileUrl.trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const publicBase = getPublicObjectUrl("__probe_key__").replace(/__probe_key__$/, "");
      if (raw.startsWith(publicBase)) {
        const afterBase = raw.slice(publicBase.length);
        // 剥离查询参数（预签名 URL 携带 X-Amz-* 等参数）
        const qIdx = afterBase.indexOf("?");
        return qIdx >= 0 ? afterBase.slice(0, qIdx) : afterBase;
      }
    } catch {
      return null;
    }
    return null;
  }
  return raw.replace(/^\/+/, "") || null;
}

/**
 * 通用预签名：接受原始文件 URL（key 或完整 MinIO URL），若命中本 MinIO 环境则返回带签名的公网 URL。
 * 适用于 `sys_user.user_logo`、`ownerAvatarUrl`、`exp_msg.logo_url` 等任意存储在本桶的私有文件 URL。
 *
 * @param rawUrl — 可为空、storage key（`v2/anon/xxx.jpg`）、或已 materialized 的完整 URL
 * @param expiresInSeconds — 签名有效期，默认 3600 秒
 * @returns 预签名 URL，或降级为普通 materialize 后的 URL（非 MinIO 文件或出错时）
 */
/**
 * URL 指向本机或内网地址时，浏览器客户端无法直接访问，应视为不可用。
 * 匹配：localhost、127.0.0.1、10.x.x.x、172.16-31.x.x、192.168.x.x
 */
function isPrivateOrLoopbackHost(url: string): boolean {
  return /:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)/i.test(url);
}

export async function presignPublicUrl(rawUrl: string | null | undefined, expiresInSeconds = 3600): Promise<string | null> {
  const raw = (rawUrl ?? "").trim();
  if (!raw) return null;
  // 已包含签名参数说明是上一次签名结果，直接透传避免重复签名
  if (raw.includes("X-Amz-Expires=") || raw.includes("X-Amz-Signature=")) return raw;
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    // 本机/内网地址浏览器不可达 → 返回 null，UI 自动降级为「无封面」
    if (isPrivateOrLoopbackHost(raw)) return null;
    const storageKey = tryStorageKeyFromFileUrl(raw);
    if (!storageKey) return raw; // 外部公网 URL，直接透传
    try {
      return await createPublicPresignedReadUrl(storageKey, { action: "view", expiresInSeconds });
    } catch {
      return raw;
    }
  }
  // 纯 key
  try {
    return await createPublicPresignedReadUrl(raw, { action: "view", expiresInSeconds });
  } catch {
    return getPublicObjectUrl(raw);
  }
}

export function isLocalhostEndpoint(): boolean {
  const endpoint = getConfig().endpoint.trim();
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(endpoint);
}
