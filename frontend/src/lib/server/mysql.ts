import mysql from "mysql2/promise";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

let pool: mysql.Pool | null = null;
let legacyPool: mysql.Pool | null = null;

function readEnvVarFromFile(filePath: string, key: string): string | null {
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, "utf8");
  const line = content
    .split(/\r?\n/)
    .find((rawLine) => rawLine.trim().startsWith(`${key}=`));
  if (!line) return null;
  return line.slice(line.indexOf("=") + 1).trim() || null;
}

function resolveDatabaseUrl(): string | null {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const candidates = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), "../.env.local"),
  ];

  for (const filePath of candidates) {
    const value = readEnvVarFromFile(filePath, "DATABASE_URL");
    if (value) {
      process.env.DATABASE_URL = value;
      return value;
    }
  }

  return null;
}

export function getDbPool(): mysql.Pool {
  if (pool) return pool;
  const url = resolveDatabaseUrl();
  if (!url) {
    throw new Error("缺少 DATABASE_URL，且未在 .env.local 中找到该配置，无法连接数据库");
  }
  pool = mysql.createPool(url);
  return pool;
}

export async function runQuery<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await getDbPool().query(sql, params);
  return rows as T[];
}

export async function runExec(sql: string, params: unknown[] = []): Promise<void> {
  await getDbPool().query(sql, params);
}

/**
 * 旧系统连接池：指向 bs_lab_data（`LEGACY_DATABASE_URL` 或从 DATABASE_URL 换库名）。
 * 用于 `edu-dimension-snapshot-legacy`、`/api/edu/editions` 等仍读旧表的路由；
 * 教材参考 `/api/edu/textbook-ref/*` 已用主池 `getDbPool()`，读写字典 `data_school_*` 与书目 `data_coursebook*`（基线 DDL）；
 * 教学维度 V2 写操作与默认快照读主库 `data_school_*`，见 `app/api/edu/_lib.ts`。
 */
function getLegacyDbPool(): mysql.Pool {
  if (legacyPool) return legacyPool;
  const legacyUrl = process.env.LEGACY_DATABASE_URL?.trim();
  let url: string | null = null;
  if (legacyUrl) {
    url = legacyUrl;
  } else {
    const base = resolveDatabaseUrl();
    if (base) url = base.replace(/\/[^/?]+(\?|$)/, "/bs_lab_data$1");
  }
  if (!url) throw new Error("无法解析 LEGACY_DATABASE_URL，且未在 .env.local 中找到 DATABASE_URL");
  legacyPool = mysql.createPool(url);
  return legacyPool;
}

export { getLegacyDbPool };

export async function runLegacyQuery<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await getLegacyDbPool().query(sql, params);
  return rows as T[];
}

export async function runLegacyExec(sql: string, params: unknown[] = []): Promise<void> {
  await getLegacyDbPool().query(sql, params);
}
