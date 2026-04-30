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

function normalizeKey(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/").trim().replace(/^\/+/, "");
  if (!normalized || normalized.includes("..")) throw new Error("INVALID_STORAGE_KEY");
  return normalized;
}

function getConfig() {
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

function getClient(): S3Client {
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

export function getStorageKey(storageKey: string): string {
  return normalizeKey(storageKey);
}

export function getPublicObjectUrl(storageKey: string): string {
  const cfg = getConfig();
  const base = (cfg.publicUrl || cfg.endpoint).replace(/\/$/, "");
  return `${base}/${cfg.bucket}/${normalizeKey(storageKey)}`;
}

export function isLocalhostEndpoint(): boolean {
  const endpoint = getConfig().endpoint.trim();
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(endpoint);
}
