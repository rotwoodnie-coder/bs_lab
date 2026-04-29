/**
 * S3 / MinIO 存储工具 —— 反馈系统专用桶（bs-lab-feedback）
 * 与主业务桶（bslab-media）物理隔离，避免用户上传的截图污染主业务资源。
 *
 * 环境变量：
 *   MINIO_ENDPOINT  默认 http://localhost:9000
 *   MINIO_FEEDBACK_BUCKET 默认 bs-lab-feedback
 *   MEDIA_APP_ACCESS_KEY / MEDIA_APP_SECRET_KEY  复用主业务凭据
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
    bucket: (process.env.MINIO_FEEDBACK_BUCKET ?? "bs-lab-feedback").trim(),
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

export async function putFeedbackObject(storageKey: string, body: Buffer, contentType: string): Promise<void> {
  const cfg = getConfig();
  const client = createClient();
  await client.send(
    new PutObjectCommand({ Bucket: cfg.bucket, Key: normalizeKey(storageKey), Body: body, ContentType: contentType }),
  );
}

export async function deleteFeedbackObject(storageKey: string): Promise<void> {
  const cfg = getConfig();
  const client = createClient();
  await client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: normalizeKey(storageKey) }));
}

export async function getFeedbackObjectBuffer(storageKey: string): Promise<Buffer> {
  const cfg = getConfig();
  const client = createClient();
  const res = await client.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: normalizeKey(storageKey) }));
  if (!res.Body) throw new Error("EMPTY_S3_BODY");
  const chunks: Uint8Array[] = [];
  for await (const chunk of res.Body as AsyncIterable<Uint8Array>) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export async function createFeedbackPresignedReadUrl(
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

export function getFeedbackDirectUrl(storageKey: string): string {
  const endpoint = getConfig().endpoint.replace(/\/$/, "");
  const bucket = getConfig().bucket;
  return `${endpoint}/${bucket}/${normalizeKey(storageKey)}`;
}
