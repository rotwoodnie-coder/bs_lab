/**
 * 简易迁移执行脚本（CJS，兼容 backend node_modules）
 * 用法：node scripts/run-migration.cjs database/migrations/0008_create_ai_tables.sql
 */
const { readFileSync, existsSync } = require("node:fs");
const { createConnection } = require("mysql2/promise");
const { parse } = require("node:path");

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error("用法: node scripts/run-migration.cjs <sql文件路径>");
  process.exit(1);
}

const envPaths = [".env.local", "../.env.local", "../../.env.local"];
let dbUrl = "";
for (const p of envPaths) {
  if (existsSync(p)) {
    const content = readFileSync(p, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("DATABASE_URL=")) {
        dbUrl = trimmed.slice("DATABASE_URL=".length).trim();
        break;
      }
    }
    if (dbUrl) break;
  }
}

if (!dbUrl) {
  console.error("未找到 DATABASE_URL");
  process.exit(1);
}

const normalized = dbUrl.replace(/^mysql:\/\//, "http://");
const u = new URL(normalized);

(async () => {
  try {
    const sql = readFileSync(sqlFile, "utf-8");
    const conn = await createConnection({
      host: u.hostname,
      port: u.port ? Number(u.port) : 3306,
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, "").split("/")[0]?.split("?")[0] ?? "",
      multipleStatements: true,
    });
    console.log(`Connected to ${u.hostname}:${(u.port || 3306)}`);
    await conn.query(sql);
    console.log(`Migration completed: ${parse(sqlFile).base}`);
    await conn.end();
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
})();
