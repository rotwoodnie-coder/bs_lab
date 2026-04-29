/**
 * 清空 MinIO bslab-media 桶中所有对象
 * 安全策略：
 * - 默认 dry-run（只列出要删除的对象，不实际删除）
 * - 传 --yes 才真正执行删除
 *
 * 用法：
 *   node --env-file ../.env.local backend/scripts/media-cleanup-all.mjs         # dry-run
 *   node --env-file ../.env.local backend/scripts/media-cleanup-all.mjs --yes    # 执行
 */
import { ListObjectsV2Command, DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";

function requiredEnv(name) {
  const val = (process.env[name] ?? "").trim();
  if (!val) throw new Error(`MISSING_ENV:${name}`);
  return val;
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--yes");

  const endpoint = requiredEnv("MINIO_ENDPOINT");
  const bucket = requiredEnv("MINIO_BUCKET");
  const accessKey = requiredEnv("MEDIA_APP_ACCESS_KEY");
  const secretKey = requiredEnv("MEDIA_APP_SECRET_KEY");

  const client = new S3Client({
    region: "us-east-1",
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });

  // —— 1. 收集所有对象 key ——
  console.log(`\n正在扫描桶 "${bucket}" 中的对象...`);
  const allKeys = [];
  let isTruncated = true;
  let continuationToken;

  while (isTruncated) {
    const cmd = new ListObjectsV2Command({
      Bucket: bucket,
      MaxKeys: 1000,
      ContinuationToken: continuationToken,
    });
    const res = await client.send(cmd);
    if (res.Contents) {
      for (const obj of res.Contents) {
        allKeys.push(obj.Key);
      }
    }
    isTruncated = res.IsTruncated ?? false;
    continuationToken = res.NextContinuationToken;
    process.stdout.write(`  已扫描 ${allKeys.length} 个对象...\r`);
  }

  console.log(`\n共发现 ${allKeys.length} 个对象`);

  if (allKeys.length === 0) {
    console.log("桶中无对象，无需清理。");
    return;
  }

  if (!apply) {
    console.log("\n=== DRY-RUN 模式 ===");
    console.log(`将删除 ${allKeys.length} 个对象（前 20 个样例）：`);
    for (const k of allKeys.slice(0, 20)) {
      console.log(`  - ${k}`);
    }
    if (allKeys.length > 20) {
      console.log(`  ... 还有 ${allKeys.length - 20} 个`);
    }
    console.log("\n确认执行请加 --yes 参数：");
    console.log("  node --env-file ../.env.local backend/scripts/media-cleanup-all.mjs --yes");
    return;
  }

  // —— 2. 分批删除（每批最多 1000 个）——
  console.log(`\n正在删除 ${allKeys.length} 个对象...`);
  let deleted = 0;
  for (let i = 0; i < allKeys.length; i += 1000) {
    const batch = allKeys.slice(i, i + 1000);
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
      }),
    );
    deleted += batch.length;
    process.stdout.write(`  已删除 ${deleted}/${allKeys.length}...\r`);
  }

  console.log(`\n✅ 清理完成，共删除 ${deleted} 个对象。`);

  // —— 3. 验证 ——
  const verifyCmd = new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 });
  const verifyRes = await client.send(verifyCmd);
  const remaining = verifyRes.Contents?.length ?? 0;
  if (remaining === 0) {
    console.log("✅ 桶已完全清空。");
  } else {
    console.log(`⚠️  桶中仍有 ${remaining} 个对象，可能需要二次清理。`);
  }
}

main().catch((e) => {
  console.error("清理失败:", e instanceof Error ? e.message : e);
  process.exit(1);
});
