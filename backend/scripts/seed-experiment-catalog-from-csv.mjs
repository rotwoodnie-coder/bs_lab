import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

/**
 * Seed 标准实验库（edu_standard_experiments）及类型维表（edu_standard_experiment_categories）。
 *
 * - 输入：老师提供 CSV：年级,实验名称,必做/选做
 * - 补齐：学段/学科/年级段（基于 edu_dimensions 的编码体系）
 * - 去重：按 (tenant_id, app_id, stage_id, subject_id, name_fingerprint) 唯一
 *
 * 运行方式（示例）：
 *   node --env-file ../.env.local backend/scripts/seed-experiment-catalog-from-csv.mjs "D:\\path\\小学科学必做试验目录.csv"
 */

fileURLToPath(import.meta.url);

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: seed-experiment-catalog-from-csv.mjs <csv-path>");
  process.exit(2);
}

// dynamic import (ts files stripped by node --experimental-strip-types)
const { computeNameFingerprint } = await import("../src/domain/standard-experiment-catalog/name-fingerprint.ts");
const { parseGradeBandLabel, stageCodeFromGradeRange } = await import(
  "../src/domain/standard-experiment-catalog/grade-band.ts"
);
const { getMysqlPool } = await import("../src/infrastructure/mysql/mysql-client.ts");

function requiredEnv(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    throw new Error(`ENV_MISSING:${name}`);
  }
  return String(v).trim();
}

const tenantId =
  process.env.SEED_TENANT_ID?.trim() ||
  process.env.X_TENANT_ID?.trim() ||
  process.env.ORG_ID?.trim() ||
  "district-001";
const appId = process.env.SEED_APP_ID?.trim() || "console";
const actorId = process.env.SEED_ACTOR_ID?.trim() || "seed-script";

const SUBJECT_CODE = "SUB_SCIENCE";
const CATEGORY_CODE = "CAT_REQUIRED";
const CATEGORY_NAME = "必做实验";

function csvSplitLine(line) {
  // 简单 CSV：不处理带引号的复杂逗号（当前文件无）
  return line.split(",").map((s) => s.trim());
}

function buildStandardCode(stageCode, minGradeCode, maxGradeCode, nameFingerprint) {
  const fp8 = nameFingerprint.slice(0, 8).toUpperCase();
  return `STD_${stageCode}_${SUBJECT_CODE}_${minGradeCode}_${maxGradeCode}_${fp8}`.slice(0, 64);
}

async function idByCode(table, codeCol, codeVal) {
  const pool = getMysqlPool();
  const [rows] = await pool.query(`SELECT id FROM ${table} WHERE ${codeCol} = ? LIMIT 1`, [codeVal]);
  if (!rows || rows.length === 0) throw new Error(`CODE_NOT_FOUND:${table}.${codeCol}=${codeVal}`);
  return String(rows[0].id);
}

/** 将 CSV 年级区间展开为 `edu_standard_experiment_grade_scope` 行（按 sort_order）。 */
async function mergeGradeScopeForExperiment(pool, experimentId, minGradeCode, maxGradeCode) {
  await pool.query(
    `INSERT IGNORE INTO edu_standard_experiment_grade_scope
     (tenant_id, app_id, standard_experiment_id, grade_id, sort_order)
     SELECT ?, ?, ?, g.id, g.sort_order
     FROM edu_grades g
     JOIN edu_grades gmin ON gmin.code = ?
     JOIN edu_grades gmax ON gmax.code = ?
     WHERE g.status = 1
       AND g.sort_order >= gmin.sort_order
       AND g.sort_order <= gmax.sort_order`,
    [tenantId, appId, experimentId, minGradeCode, maxGradeCode],
  );
}

async function ensureCategory() {
  const pool = getMysqlPool();
  await pool.query(
    `INSERT INTO edu_standard_experiment_categories
     (tenant_id, app_id, code, name, description, sort_order, status)
     VALUES (?, ?, ?, ?, NULL, 0, 1)
     ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), updated_at=CURRENT_TIMESTAMP`,
    [tenantId, appId, CATEGORY_CODE, CATEGORY_NAME]
  );
  const [rows] = await pool.query(
    `SELECT id FROM edu_standard_experiment_categories WHERE tenant_id = ? AND app_id = ? AND code = ? LIMIT 1`,
    [tenantId, appId, CATEGORY_CODE]
  );
  return String(rows[0].id);
}

async function main() {
  const pool = getMysqlPool();
  // sanity: at least one DB config is present
  // - preferred: DATABASE_URL (see mysql-client.ts)
  // - fallback: DB_HOST/DB_USER/DB_NAME (legacy)
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
  const hasLegacy =
    Boolean(process.env.DB_HOST?.trim()) &&
    Boolean(process.env.DB_USER?.trim()) &&
    Boolean(process.env.DB_NAME?.trim());
  if (!hasDatabaseUrl && !hasLegacy) {
    throw new Error("ENV_MISSING: DATABASE_URL or (DB_HOST,DB_USER,DB_NAME)");
  }

  const buf = await fs.readFile(csvPath);
  const tryDecode = (enc) => new TextDecoder(enc).decode(buf);
  const utf8 = tryDecode("utf-8");
  const utf8Header = utf8.split(/\r?\n/)[0] ?? "";
  const decoded =
    utf8Header.includes("年级") && utf8Header.includes("实验名称")
      ? utf8
      : tryDecode("gb18030");

  const lines = decoded.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV_EMPTY");
  const header = csvSplitLine(lines[0]);
  if (header[0] !== "年级" || header[1] !== "实验名称") {
    console.warn(`[seed] unexpected header: ${header.join(",")}`);
  }

  const stagePrimaryId = await idByCode("edu_stages", "code", "STAGE_PRIMARY");
  const stageJuniorId = await idByCode("edu_stages", "code", "STAGE_JUNIOR");
  const stageSeniorId = await idByCode("edu_stages", "code", "STAGE_SENIOR");
  const subjectId = await idByCode("edu_subjects", "code", SUBJECT_CODE);
  const categoryId = await ensureCategory();

  const stageIdByCode = {
    STAGE_PRIMARY: stagePrimaryId,
    STAGE_JUNIOR: stageJuniorId,
    STAGE_SENIOR: stageSeniorId,
  };

  let inserted = 0;
  let upserted = 0;

  for (const line of lines.slice(1)) {
    const [gradeBandLabel, rawName, mandatoryLabel] = csvSplitLine(line);
    if (!gradeBandLabel || !rawName) continue;

    const { min, max } = parseGradeBandLabel(gradeBandLabel);
    const stageCode = stageCodeFromGradeRange(min, max);
    const stageId = stageIdByCode[stageCode];
    const isMandatory = mandatoryLabel?.includes("必") ? 1 : 0;

    const displayName = rawName.trim();
    const fp = computeNameFingerprint(displayName);
    const standardCode = buildStandardCode(stageCode, min, max, fp);

    const [res] = await pool.query(
      `INSERT INTO edu_standard_experiments
       (tenant_id, app_id, standard_code, display_name, name_fingerprint, fingerprint_version,
        stage_id, subject_id, is_mandatory, exp_category_id,
        official_video_registry_id, created_by_actor_id, updated_by_actor_id, status)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, NULL, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
        is_mandatory = GREATEST(is_mandatory, VALUES(is_mandatory)),
        updated_by_actor_id = VALUES(updated_by_actor_id),
        updated_at = CURRENT_TIMESTAMP`,
      [
        tenantId,
        appId,
        standardCode,
        displayName,
        fp,
        stageId,
        subjectId,
        isMandatory,
        categoryId,
        actorId,
        actorId,
      ],
    );
    const [idRows] = await pool.query(
      `SELECT id FROM edu_standard_experiments
       WHERE tenant_id = ? AND app_id = ? AND standard_code = ? LIMIT 1`,
      [tenantId, appId, standardCode],
    );
    const expRow = idRows[0];
    if (!expRow) throw new Error(`EXP_NOT_FOUND:${standardCode}`);
    const experimentId = String(expRow.id);
    await mergeGradeScopeForExperiment(pool, experimentId, min, max);
    // mysql2: affectedRows 1 insert, 2 update
    if (res.affectedRows === 1) inserted += 1;
    else upserted += 1;
  }

  console.log(`[seed] done: inserted=${inserted}, merged(updated)=${upserted}, tenant=${tenantId}, app=${appId}`);
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});

