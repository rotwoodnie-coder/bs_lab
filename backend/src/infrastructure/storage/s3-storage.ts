/**
 * S3 / MinIO 存储工具（通用）
 * 环境变量：MINIO_ENDPOINT / MINIO_BUCKET / MEDIA_APP_ACCESS_KEY / MEDIA_APP_SECRET_KEY
 */
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

function createClient(): S3Client {
  const cfg = getConfig();
  return new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    forcePathStyle: true,
    credentials: cfg.credentials,
  });
}

export async function putObject(storageKey: string, body: Buffer, contentType: string): Promise<void> {
  const cfg = getConfig();
  const client = createClient();
  await client.send(
    new PutObjectCommand({ Bucket: cfg.bucket, Key: normalizeKey(storageKey), Body: body, ContentType: contentType }),
  );
}

export function getDirectUrl(storageKey: string): string {
  return getPublicObjectUrl(storageKey);
}

export async function deleteObject(storageKey: string): Promise<void> {
  const cfg = getConfig();
  const client = createClient();
  await client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: normalizeKey(storageKey) }));
}

export async function getObjectBuffer(storageKey: string): Promise<Buffer> {
  const cfg = getConfig();
  const client = createClient();
  const res = await client.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: normalizeKey(storageKey) }));
  if (!res.Body) throw new Error("EMPTY_S3_BODY");
  const chunks: Uint8Array[] = [];
  for await (const chunk of res.Body as AsyncIterable<Uint8Array>) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export async function createPresignedReadUrl(
  storageKey: string,
  options?: { action?: "view" | "download"; expiresInSeconds?: number },
): Promise<string> {
  const cfg = getConfig();
  const client = createClient();
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
