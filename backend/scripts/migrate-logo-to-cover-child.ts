/**
 * 0053 存量 logo_url 迁移到封面子行（应用层脚本）
 *
 * 将 data_file 表中所有有 logo_url 的行转换为独立封面子行
 * （parent_file_id + relation_type='logo'），并回填 cover_file_id。
 *
 * 需要应用层执行而非纯 SQL，原因：
 *   - logo_url 存储的是完整 MinIO 公共 URL（如 https://minio.example.com/bucket/v2/user/thumb/x.jpg）
 *   - 封面子行的 file_url 需要存储 storage key（如 v2/user/thumb/x.jpg）
 *   - tryStorageKeyFromFileUrl 才能精确反解 key，SQL 做不到
 *
 * 用法：
 *   node --env-file ../.env.local --experimental-strip-types scripts/migrate-logo-to-cover-child.mjs
 *
 * 安全：
 *   - 默认 dry-run（只打印，不写入）
 *   - 传入 --yes 后真正执行
 *   - 每条处理都打印进度
 */

import mysql from "mysql2/promise";
import crypto from "node:crypto";

// ── 从目标模块 inline 必要的函数，避免启动整个后端 ──

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`MISSING_ENV:${name}`);
  return value;
}

function resolvePoolConfig() {
  const raw = process.env.DATABASE_URL?.trim();
  if (raw && raw.startsWith("mysql://")) {
    const normalized = raw.replace(/^mysql:\/\//i, "http://");
    const u = new URL(normalized);
    return {
      host: u.hostname,
      port: u.port ? Number(u.port) : 3306,
      user: decodeURIComponent(u.username || ""),
      password: decodeURIComponent(u.password || ""),
      database: u.pathname.replace(/^\//, "").split("/")[0]?.split("?")[0] ?? "",
    };
  }
  return {
    host: requiredEnv("DB_HOST"),
    port: Number(process.env.DB_PORT ?? 3306),
    user: requiredEnv("DB_USER"),
    password: requiredEnv("DB_PASSWORD"),
    database: requiredEnv("DB_NAME"),
  };
}

function getPool() {
  const cfg = resolvePoolConfig();
  return mysql.createPool({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    charset: "utf8mb4",
    dateStrings: true,
  });
}

function isHttpUrl(s: string): boolean {
  const t = s.trim();
  return t.startsWith("http://") || t.startsWith("https://");
}

/**
 * 从 s3-storage 的 getPublicObjectUrl 逻辑推导 publicBase。
 * 格式：{publicUrl || endpoint}/{bucket}/
 * 同时收集多个可能的前缀（当前环境和历史内网地址），
 * 因为存量 logo_url 可能使用了旧的内网 MinIO 域名。
 */
function getPublicBases(): string[] {
  const publicUrl = (process.env.MINIO_PUBLIC_URL ?? "").trim();
  const endpoint = (process.env.MINIO_ENDPOINT ?? "http://localhost:9000").trim();
  const bucket = (process.env.MINIO_BUCKET ?? "bslab-media").trim();
  const bases = new Set<string>();

  // 当前环境
  if (publicUrl) bases.add(`${publicUrl.replace(/\/$/, "")}/${bucket}/`);
  bases.add(`${endpoint.replace(/\/$/, "")}/${bucket}/`);

  // 常见 historical 内网地址模式：用户尝试多个 endpoint 配置
  return [...bases];
}

function tryStorageKeyFromAnyBase(url: string, bases: string[]): string | null {
  const raw = url.trim();
  if (!raw) return null;
  for (const base of bases) {
    if (raw.startsWith(base)) {
      return raw.slice(base.length);
    }
  }
  // 不是 HTTP URL → 直接作为 storage key
  if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
    return raw.replace(/^\/+/, "") || null;
  }
  return null;
}

// ── 主逻辑 ──

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--yes");

  console.log("═══════════════════════════════════════════");
  console.log(" 0053 存量 logo_url → 封面子行迁移");
  console.log(` 模式: ${dryRun ? "♻️ DRY RUN（仅打印）" : "⚡ 执行"}`);
  if (dryRun) console.log(" 传入 --yes 后真正写入");
  console.log("═══════════════════════════════════════════\n");

  const pool = getPool();
  const publicBases = getPublicBases();

  try {
    // 1. 查出所有需要迁移的旧行
    const [rows] = await pool.query(
      `SELECT file_id, file_name, logo_url, owner_user_id, status, create_time, update_time
       FROM data_file
       WHERE logo_url IS NOT NULL AND logo_url != ''
         AND NOT EXISTS (
           SELECT 1 FROM data_file child
           WHERE child.parent_file_id = data_file.file_id AND child.relation_type = 'logo'
         )`,
    );

    const list = rows as Array<{
      file_id: string;
      file_name: string;
      logo_url: string;
      owner_user_id: string | null;
      status: string | null;
      create_time: string | null;
      update_time: string | null;
    }>;

    console.log(`发现 ${list.length} 条需要迁移的记录\n`);

    if (list.length === 0) {
      console.log("没有需要迁移的存量封面，跳过。");
      return;
    }

    // 2. 预览 logo_url 格式（帮助确认迁移正确性）
    const formats = new Set(list.map((r) => {
      const u = r.logo_url.trim();
      if (isHttpUrl(u)) return "full_url";
      return "storage_key";
    }));
    console.log(`logo_url 格式分布: ${[...formats].join(", ")}`);
    console.log(`publicBases: ${publicBases.join(", ")}\n`);

    let migrated = 0;
    let skipped = 0;

    for (const row of list) {
      const storageKey = tryStorageKeyFromAnyBase(row.logo_url, publicBases);
      if (!storageKey) {
        console.warn(`  ⚠️ 跳过 ${row.file_id}: 无法从 logo_url 解析 storage key: ${row.logo_url.slice(0, 80)}`);
        skipped++;
        continue;
      }

      // 生成不超过 32 字符的 file_id：优先截断源 file_id 后加 _logo
      const MAX_ID_LEN = 32;
      const SUFFIX = "_logo";
      const rawCoverId = `${row.file_id}${SUFFIX}`;
      const coverFileId = rawCoverId.length <= MAX_ID_LEN
        ? rawCoverId
        : `${row.file_id.slice(0, MAX_ID_LEN - SUFFIX.length)}${SUFFIX}`;
      const coverFileName = `${row.file_name}_封面`;

      // 推断扩展名
      const lu = row.logo_url.toLowerCase();
      let ext = "jpg";
      if (lu.endsWith("_logo")) ext = "jpg";
      else if (lu.endsWith(".png")) ext = "png";
      else if (lu.endsWith(".gif")) ext = "gif";
      else if (lu.endsWith(".webp")) ext = "webp";

      if (dryRun) {
        console.log(`  [DRY-RUN] 创建封面行:`);
        console.log(`    file_id:       ${coverFileId}`);
        console.log(`    file_name:     ${coverFileName}`);
        console.log(`    file_url:      ${storageKey}`);
        console.log(`    parent_file_id: ${row.file_id}`);
        console.log(`    relation_type:  logo`);
        console.log(`    file_ext:       ${ext}`);
        console.log(`    owner_user_id:  ${row.owner_user_id ?? "(null)"}`);
        migrated++;
        continue;
      }

      // 执行写入
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        await conn.execute(
          `INSERT INTO data_file
            (file_id, file_name, file_url, file_type_id, status, owner_user_id,
             parent_file_id, relation_type, file_size, file_ext, content_sha256,
             create_time, update_time)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            coverFileId,
            coverFileName,
            storageKey,
            "FT_Image",
            row.status ?? "y",
            row.owner_user_id,
            row.file_id,
            "logo",
            null,  // file_size
            ext,
            null,  // content_sha256
            row.create_time,
            row.update_time,
          ],
        );

        await conn.execute(
          "UPDATE data_file SET cover_file_id = ? WHERE file_id = ?",
          [coverFileId, row.file_id],
        );

        await conn.commit();
        migrated++;
        process.stdout.write(`  ✅ ${row.file_id} → ${coverFileId}\n`);
      } catch (e) {
        await conn.rollback().catch(() => {});
        const msg = e instanceof Error ? e.message : String(e);
        // 忽略唯一约束冲突（说明已有封面行，不需要迁移）
        if (msg.includes("Duplicate") || (typeof e === "object" && e !== null && "errno" in e && (e as { errno: number }).errno === 1062)) {
          console.warn(`  ℹ️  ${row.file_id}: 封面行已存在，跳过`);
          skipped++;
        } else {
          console.error(`  ❌ ${row.file_id}: 写入失败: ${msg}`);
          skipped++;
        }
      } finally {
        conn.release();
      }
    }

    console.log("\n═══════════════════════════════════════════");
    console.log(` 完成: ${migrated} 条迁移, ${skipped} 条跳过`);
    if (dryRun) {
      console.log(" 这是 DRY RUN，未写入任何数据。");
      console.log(" 确认无误后请执行: node --env-file ../.env.local --experimental-strip-types scripts/migrate-logo-to-cover-child.ts --yes");
    }
    console.log("═══════════════════════════════════════════\n");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("迁移失败:", e instanceof Error ? e.message : String(e));
  process.exit(1);
});
