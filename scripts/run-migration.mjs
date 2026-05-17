/**
 * 简易迁移执行脚本
 * 用法：node scripts/run-migration.mjs database/migrations/0008_create_ai_tables.sql
 */
import { readFileSync } from "node:fs";
import { createConnection } from "mysql2/promise";
import { parse } from "node:path";

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error("用法: node scripts/run-migration.mjs <sql文件路径>");
  process.exit(1);
}

// 从 .env.local 读取数据库配置
const envPath = ".env.local";
let dbUrl = "";
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("DATABASE_URL=")) {
      dbUrl = trimmed.slice("DATABASE_URL=".length).trim();
    }
  }
} catch {
  console.error("无法读取 .env.local");
  process.exit(1);
}

if (!dbUrl) {
  console.error(".env.local 中未找到 DATABASE_URL");
  process.exit(1);
}

// mysql://root:pass@host:port/db → createConnection 参数
const normalized = dbUrl.replace(/^mysql:\/\//, "http://");
const u = new URL(normalized);

const config = {
  host: u.hostname,
  port: u.port ? Number(u.port) : 3306,
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.replace(/^\//, "").split("/")[0]?.split("?")[0] ?? "",
  multipleStatements: true,
};

try {
  const sql = readFileSync(sqlFile, "utf-8");
  const conn = await createConnection(config);
  console.log(`连接到 ${config.host}:${config.port}/${config.database}`);
  await conn.query(sql);
  console.log(`迁移完成: ${parse(sqlFile).base}`);
  await conn.end();
} catch (err) {
  console.error("迁移失败:", err);
  process.exit(1);
}
