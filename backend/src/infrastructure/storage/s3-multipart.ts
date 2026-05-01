/**
 * S3 / MinIO 分片上传工具
 * 依赖 s3-storage.ts 的 getClient / getConfig / normalizeKey
 */
import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getClient, getConfig, normalizeKey } from "./s3-storage.js";

export type MultipartUploadInitResult = {
  uploadId: string;
  storageKey: string;
};

/** 发起 S3 分片上传，返回 uploadId */
export async function s3CreateMultipartUpload(
  storageKey: string,
  contentType: string,
): Promise<MultipartUploadInitResult> {
  const cfg = getConfig();
  const client = getClient();
  const key = normalizeKey(storageKey);
  const cmd = new CreateMultipartUploadCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: contentType || "application/octet-stream",
  });
  const res = await client.send(cmd);
  if (!res.UploadId) throw new Error("S3_CREATE_MULTIPART_FAILED");
  return { uploadId: res.UploadId, storageKey: key };
}

/** 生成分片上传的预签名 URL（有效期 2 小时，足够上传大文件） */
export async function s3PresignUploadPartUrl(
  storageKey: string,
  uploadId: string,
  partNumber: number,
  expiresInSeconds = 7200,
): Promise<string> {
  const cfg = getConfig();
  const client = getClient();
  const cmd = new UploadPartCommand({
    Bucket: cfg.bucket,
    Key: normalizeKey(storageKey),
    UploadId: uploadId,
    PartNumber: partNumber,
  });
  return getSignedUrl(client, cmd, { expiresIn: expiresInSeconds });
}

/** 完成分片上传 */
export async function s3CompleteMultipartUpload(
  storageKey: string,
  uploadId: string,
  parts: { ETag: string; PartNumber: number }[],
): Promise<void> {
  const cfg = getConfig();
  const client = getClient();
  const sorted = [...parts].sort((a, b) => a.PartNumber - b.PartNumber);
  await client.send(
    new CompleteMultipartUploadCommand({
      Bucket: cfg.bucket,
      Key: normalizeKey(storageKey),
      UploadId: uploadId,
      MultipartUpload: { Parts: sorted },
    }),
  );
}

/** 中止分片上传 */
export async function s3AbortMultipartUpload(
  storageKey: string,
  uploadId: string,
): Promise<void> {
  const cfg = getConfig();
  const client = getClient();
  await client.send(
    new AbortMultipartUploadCommand({
      Bucket: cfg.bucket,
      Key: normalizeKey(storageKey),
      UploadId: uploadId,
    }),
  );
}
