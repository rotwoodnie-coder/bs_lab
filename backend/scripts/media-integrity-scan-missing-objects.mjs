/**
 * 扫描媒体库中 storage_engine=S3 的资产，找出“数据库有记录但对象缺失”的条目，
 * 并生成：
 * 1) JSON 报告
 * 2) SQL 修复草案（默认不执行）
 * 3) Markdown 任务清单
 *
 * 用法：
 * node --env-file ../.env.local --experimental-strip-types backend/scripts/media-integrity-scan-missing-objects.mjs
 * node --env-file ../.env.local --experimental-strip-types backend/scripts/media-integrity-scan-missing-objects.mjs --tenantId=org-school-east --appId=console --limit=500
 */
import fs from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const out = {};
  for (const item of argv) {
    if (!item.startsWith("--")) continue;
    const [k, ...rest] = item.slice(2).split("=");
    out[k] = rest.join("=") || "1";
  }
  return out;
}

function nowTag() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function toSqlInList(ids) {
  if (!ids.length) return "(NULL)";
  return `(${ids.map((id) => Number(id)).filter(Number.isFinite).join(",")})`;
}

function buildSqlPatch({ missingAssetIds, missingRegistryIds, reasonTag }) {
  if (!missingAssetIds.length) {
    return `-- 未发现对象缺失条目，无需修复 SQL。\n-- reason=${reasonTag}\n`;
  }
  return [
    "-- 媒体对象缺失修复 SQL（请先审阅后执行）",
    `-- reason=${reasonTag}`,
    "START TRANSACTION;",
    "",
    "-- 1) 软冻结缺失对象对应资产，避免继续被业务新增引用",
    `UPDATE sys_media_assets`,
    `SET status = 'PENDING_DELETE',`,
    `    pending_delete_at = COALESCE(pending_delete_at, DATE_ADD(NOW(), INTERVAL 1 DAY)),`,
    `    updated_by = 'media-integrity-repair',`,
    `    updated_at = NOW()`,
    `WHERE id IN ${toSqlInList(missingAssetIds)} AND status = 'ACTIVE';`,
    "",
    "-- 2) 将已发布/可见登记归档并标注缺失原因（可按需调整）",
    `UPDATE edu_media_registry`,
    `SET status = 'ARCHIVED',`,
    `    review_status = 'REJECTED',`,
    `    review_comment = '对象存储文件缺失，已自动归档，待补传后重建',`,
    `    updated_by = 'media-integrity-repair',`,
    `    updated_at = NOW()`,
    `WHERE id IN ${toSqlInList(missingRegistryIds)} AND status = 'ACTIVE';`,
    "",
    "COMMIT;",
    "",
  ].join("\n");
}

function buildTaskMarkdown(report, sqlPath) {
  const lines = [];
  lines.push("# 媒体对象缺失修复任务清单");
  lines.push("");
  lines.push(`- 扫描时间：${report.scannedAt}`);
  lines.push(`- 范围：tenant=${report.scope.tenantId || "ALL"} app=${report.scope.appId || "ALL"}`);
  lines.push(`- 扫描资产数：${report.summary.scannedAssets}`);
  lines.push(`- 缺失资产数：${report.summary.missingAssets}`);
  lines.push(`- 受影响登记数：${report.summary.affectedRegistries}`);
  lines.push(`- 修复 SQL：\`${sqlPath}\``);
  lines.push("");
  lines.push("## 建议执行步骤");
  lines.push("");
  lines.push("- [ ] 先抽样核对 10 条缺失资产是否确实不存在于 MinIO");
  lines.push("- [ ] 在低峰期执行 SQL（建议先在预发环境验证）");
  lines.push("- [ ] 对归档登记发起补传任务，完成后重建登记并恢复引用");
  lines.push("- [ ] 检查业务端是否仍展示已归档条目，必要时加过滤");
  lines.push("");
  if (report.missingDetails.length) {
    lines.push("## 缺失样例（前 20 条）");
    lines.push("");
    for (const item of report.missingDetails.slice(0, 20)) {
      lines.push(
        `- asset=${item.assetId} registry=${item.registryId} tenant=${item.tenantId} app=${item.appId} key=\`${item.storageKey}\``,
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const limit = Math.max(1, Math.min(20000, Number(args.limit || 2000)));
  const tenantId = (args.tenantId || "").trim();
  const appId = (args.appId || "").trim();

  const { getMysqlPool } = await import("../src/infrastructure/mysql/mysql-client.ts");
  const { headMediaObjectInS3 } = await import("../src/domain/media/persistence/media-s3.ts");
  const pool = getMysqlPool();

  const where = [`a.storage_engine = 'S3'`, `a.deleted_at IS NULL`, `a.status = 'ACTIVE'`];
  const params = [];
  if (tenantId) {
    where.push("a.tenant_id = ?");
    params.push(tenantId);
  }
  if (appId) {
    where.push("a.app_id = ?");
    params.push(appId);
  }
  params.push(limit);

  const [rows] = await pool.query(
    `SELECT
       a.id AS asset_id,
       a.tenant_id,
       a.app_id,
       a.storage_key,
       a.mime_type,
       r.id AS registry_id,
       r.title AS registry_title,
       r.status AS registry_status,
       r.review_status
     FROM sys_media_assets a
     LEFT JOIN edu_media_registry r ON r.asset_id = a.id AND r.deleted_at IS NULL
     WHERE ${where.join(" AND ")}
     ORDER BY a.id ASC, r.id ASC
     LIMIT ?`,
    params,
  );

  const byAsset = new Map();
  for (const row of rows) {
    const assetId = String(row.asset_id);
    if (!byAsset.has(assetId)) {
      byAsset.set(assetId, {
        assetId,
        tenantId: String(row.tenant_id),
        appId: String(row.app_id),
        storageKey: String(row.storage_key),
        mimeType: String(row.mime_type || ""),
        registries: [],
      });
    }
    if (row.registry_id != null) {
      byAsset.get(assetId).registries.push({
        registryId: String(row.registry_id),
        registryTitle: String(row.registry_title || ""),
        registryStatus: String(row.registry_status || ""),
        reviewStatus: String(row.review_status || ""),
      });
    }
  }

  const missingDetails = [];
  let scannedAssets = 0;
  for (const asset of byAsset.values()) {
    scannedAssets += 1;
    const head = await headMediaObjectInS3(asset.storageKey);
    if (head.exists) continue;
    if (asset.registries.length === 0) {
      missingDetails.push({
        ...asset,
        registryId: "",
        registryTitle: "",
        registryStatus: "",
        reviewStatus: "",
      });
      continue;
    }
    for (const reg of asset.registries) {
      missingDetails.push({
        assetId: asset.assetId,
        tenantId: asset.tenantId,
        appId: asset.appId,
        storageKey: asset.storageKey,
        mimeType: asset.mimeType,
        registryId: reg.registryId,
        registryTitle: reg.registryTitle,
        registryStatus: reg.registryStatus,
        reviewStatus: reg.reviewStatus,
      });
    }
  }

  const missingAssetIds = [...new Set(missingDetails.map((x) => x.assetId))];
  const missingRegistryIds = [...new Set(missingDetails.map((x) => x.registryId).filter(Boolean))];
  const scannedAt = new Date().toISOString();
  const report = {
    scannedAt,
    scope: { tenantId, appId, limit },
    summary: {
      scannedAssets,
      missingAssets: missingAssetIds.length,
      affectedRegistries: missingRegistryIds.length,
    },
    missingDetails,
  };

  const outDir = path.resolve(process.cwd(), "reports", "media-integrity");
  await fs.mkdir(outDir, { recursive: true });
  const tag = nowTag();
  const reportPath = path.join(outDir, `missing-objects-${tag}.report.json`);
  const sqlPath = path.join(outDir, `missing-objects-${tag}.repair.sql`);
  const taskPath = path.join(outDir, `missing-objects-${tag}.tasks.md`);
  const reasonTag = `missing_s3_object@${scannedAt}`;
  const sql = buildSqlPatch({ missingAssetIds, missingRegistryIds, reasonTag });
  const tasks = buildTaskMarkdown(report, sqlPath);

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(sqlPath, sql, "utf8");
  await fs.writeFile(taskPath, `${tasks}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        scannedAt,
        summary: report.summary,
        output: { reportPath, sqlPath, taskPath },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("[media-integrity-scan] failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
