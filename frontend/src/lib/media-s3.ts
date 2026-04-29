import { S3Client } from "@aws-sdk/client-s3";

function requiredEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`缺少环境变量：${name}`);
  return v;
}

/**
 * 规范化对象键：与本地 `storageKey` 对齐，禁止路径穿越与空键。
 */
export function normalizeMediaS3ObjectKey(storageKey: string): string {
  const key = storageKey.replace(/\\/g, "/").trim().replace(/^\/+/, "");
  if (!key || key.includes("..")) {
    throw new Error("INVALID_STORAGE_KEY");
  }
  return key;
}

/**
 * `MEDIA_MIRROR_TO_MINIO=1` 时在上传前校验 MinIO 与凭证，尽早失败，避免只写本地留下不一致。
 */
export function validateMinioMirrorEnv(): void {
  if (process.env.MEDIA_MIRROR_TO_MINIO !== "1") return;

  const endpoint = (process.env.MINIO_ENDPOINT ?? "").trim();
  if (!endpoint.startsWith("http://") && !endpoint.startsWith("https://")) {
    throw new Error("MINIO_ENDPOINT 须为以 http:// 或 https:// 开头的完整地址");
  }

  const bucket = (process.env.MINIO_BUCKET ?? "").trim();
  if (!bucket) {
    throw new Error("开启 MEDIA_MIRROR_TO_MINIO=1 时须配置非空的 MINIO_BUCKET");
  }

  requiredEnv("MEDIA_APP_ACCESS_KEY");
  requiredEnv("MEDIA_APP_SECRET_KEY");
}

export function getMediaS3Config() {
  const endpoint = (process.env.MINIO_ENDPOINT ?? "http://localhost:9000").trim() || "http://localhost:9000";
  /** 与 backend `s3-storage` 默认 `bslab-media` 对齐，避免预签名与库内直链 bucket 不一致 */
  const bucket = (process.env.MINIO_BUCKET ?? "bslab-media").trim() || "bslab-media";
  const region = (process.env.MINIO_REGION ?? "us-east-1").trim() || "us-east-1";

  const accessKeyId = requiredEnv("MEDIA_APP_ACCESS_KEY");
  const secretAccessKey = requiredEnv("MEDIA_APP_SECRET_KEY");

  return {
    endpoint,
    bucket,
    region,
    credentials: { accessKeyId, secretAccessKey },
  };
}

export function createMediaS3Client() {
  const { endpoint, credentials, region } = getMediaS3Config();
  return new S3Client({
    region,
    endpoint,
    credentials,
    forcePathStyle: true,
  });
}
