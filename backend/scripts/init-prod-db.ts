/**
 * 生产库初始化清理脚本
 *
 * 功能：保留系统运行必需的基础数据，清空业务数据。
 * 适用于：从开发库全量迁移数据到生产库后，清除非白名单表的业务数据。
 *
 * 白名单表（保留全部数据）：
 *   - sys_user, sys_user_role, data_role          用户体系
 *   - sys_org, data_org_type                       组织架构
 *   - data_school_level, data_school_grade, data_school_subject, data_school_grade_subject  学段年级学科
 *   - data_file_type                               文件类型
 *   - data_exp_difficulty, data_material_prop, data_material_type, data_material_security, data_material_unit  实验字典
 *   - data_difficulty_type, data_question_type, data_question_capacity  题库字典
 *   - data_coursebook, data_coursebook_chapter, data_coursebook_unit    教材体系
 *   - data_pref_title, data_rating_scale, data_msg_type, scale_title    其他系统字典
 *   - subject_group, subject_group_member          课题组
 *   - scale_log                                    积分流水
 *   - sys_auth_refresh_token, sys_feedback, sys_log, sys_msg, sys_parent_student_rel  系统数据
 *   - parent_session, parent_report, teacher_class 业务基础数据
 *   - data_file_ref                               引用计数表（结构保持，数据可重建）
 *   - _migrations                                 迁移记录表
 *
 * 清理的表：data_file, exp_*, material_*, social_*, migration_*, 等业务数据表
 *
 * 用法：
 *   node --env-file ../.env.local --experimental-strip-types scripts/init-prod-db.ts
 *   node --env-file ../.env.local --experimental-strip-types scripts/init-prod-db.ts --dry-run   # 仅预览
 */

import mysql from "mysql2/promise";

const WHITELIST = new Set([
  // 用户与权限
  "sys_user",
  "sys_user_role",
  "data_role",
  // 组织
  "sys_org",
  "data_org_type",
  // 学段年级学科
  "data_school_level",
  "data_school_grade",
  "data_school_subject",
  "data_school_grade_subject",
  // 文件类型
  "data_file_type",
  // 实验字典
  "data_exp_difficulty",
  "data_material_prop",
  "data_material_type",
  "data_material_security",
  "data_material_unit",
  // 题库字典
  "data_difficulty_type",
  "data_question_type",
  "data_question_capacity",
  // 教材
  "data_coursebook",
  "data_coursebook_chapter",
  "data_coursebook_unit",
  // 其他系统字典
  "data_pref_title",
  "data_rating_scale",
  "data_msg_type",
  "scale_title",
  "scale_log",
  // 课题组
  "subject_group",
  "subject_group_member",
  // 系统数据
  "sys_auth_refresh_token",
  "sys_feedback",
  "sys_log",
  "sys_msg",
  "sys_parent_student_rel",
  "parent_session",
  "parent_report",
  "teacher_class",
  // 引用计数表
  "data_file_ref",
  // 迁移记录
  "_migrations",
]);

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

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  console.log("═══════════════════════════════════════════");
  console.log(" 生产库初始化清理");
  console.log(` 模式: ${dryRun ? "♻️ DRY RUN（仅预览）" : "⚡ 执行"}`);
  if (dryRun) console.log(" 确认无误后去掉 --dry-run 执行");
  console.log("═══════════════════════════════════════════\n");

  const cfg = resolvePoolConfig();
  const dbName = cfg.database;
  console.log(` 目标数据库: ${dbName}`);
  console.log(` 主机: ${cfg.host}:${cfg.port}\n`);

  const pool = mysql.createPool({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    waitForConnections: true,
    connectionLimit: 3,
    queueLimit: 0,
    charset: "utf8mb4",
    dateStrings: true,
  });

  try {
    // 1. 获取库中所有表
    const [tables] = await pool.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME",
      [dbName],
    );
    const allTables = (tables as Array<{ TABLE_NAME: string }>).map((r) => r.TABLE_NAME.toLowerCase());

    const toClean = allTables.filter((t) => !WHITELIST.has(t));
    const kept = allTables.filter((t) => WHITELIST.has(t));

    console.log(`  总计 ${allTables.length} 张表`);
    console.log(`  保留 ${kept.length} 张：${kept.join(", ")}\n`);
    console.log(`  清理 ${toClean.length} 张：${toClean.join(", ")}\n`);

    if (toClean.length === 0) {
      console.log(" 没有需要清理的表，跳过。");
      return;
    }

    // 2. 区分表（TABLE）和视图（VIEW），分别统计数据量
    let totalRows = 0;
    const tableCounts: Array<{ table: string; rows: number }> = [];
    const views: string[] = [];

    for (const tbl of toClean) {
      const [typeRows] = await pool.query(
        "SELECT TABLE_TYPE FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
        [dbName, tbl],
      );
      const tableType = String((typeRows as Array<{ TABLE_TYPE: string }>)[0]?.TABLE_TYPE ?? "");
      const isView = tableType === "VIEW";

      if (isView) {
        views.push(tbl);
        continue;
      }

      const [rows] = await pool.query(`SELECT COUNT(*) AS cnt FROM \`${tbl}\``);
      const cnt = Number((rows as Array<{ cnt: number }>)[0]?.cnt ?? 0);
      if (cnt > 0) {
        tableCounts.push({ table: tbl, rows: cnt });
        totalRows += cnt;
      }
    }

    console.log(`  将清空 ${tableCounts.length} 张有数据的表，共 ${totalRows} 行数据`);
    if (views.length > 0) {
      console.log(`  将删除 ${views.length} 个视图：${views.join(", ")}`);
    }
    if (tableCounts.length > 0) {
      console.log("  表清理明细：");
      for (const c of tableCounts) {
        console.log(`    ${c.table}: ${c.rows} 行`);
      }
    }
    if (views.length > 0) {
      console.log("  视图删除明细：");
      for (const v of views) {
        console.log(`    ${v}`);
      }
    }

    if (dryRun) {
      console.log("\n  ⚠️  这是 DRY RUN，未执行任何操作。");
      console.log("  确认无误后执行:\n    node --env-file ../.env.local --experimental-strip-types scripts/init-prod-db.ts");
      return;
    }

    // 3. 关闭外键检查 → truncate 业务表 + drop 视图 → 恢复外键检查
    console.log("\n  ⏳ 开始清理...");
    const conn = await pool.getConnection();
    try {
      await conn.execute("SET FOREIGN_KEY_CHECKS = 0");

      // 先 truncate 业务表（速度快，重置自增 ID）
      for (const c of tableCounts) {
        await conn.execute(`TRUNCATE TABLE \`${c.table}\``);
        console.log(`    ✅ TRUNCATE ${c.table}`);
      }

      // 再 drop 视图
      for (const v of views) {
        await conn.execute(`DROP VIEW IF EXISTS \`${v}\``);
        console.log(`    ✅ DROP VIEW ${v}`);
      }

      await conn.execute("SET FOREIGN_KEY_CHECKS = 1");
      console.log(`\n  ✅ 清理完成：清空 ${tableCounts.length} 张表，删除 ${views.length} 个视图`);
    } finally {
      conn.release();
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("\n  ❌ 初始化失败:", e instanceof Error ? e.message : String(e));
  process.exit(1);
});
