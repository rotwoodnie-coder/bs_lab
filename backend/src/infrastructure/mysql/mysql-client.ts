import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;
let legacyPool: mysql.Pool | null = null;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`DB_CONFIG_MISSING:${name}`);
  }
  return value.trim();
}

/** 与根目录 .env.local 中 `DATABASE_URL=mysql://...` 对齐，避免重复维护 DB_* */
function tryConfigFromDatabaseUrl():
  | { host: string; port: number; user: string; password: string; database: string }
  | null {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw || !raw.startsWith("mysql://")) return null;
  try {
    const normalized = raw.replace(/^mysql:\/\//i, "http://");
    const u = new URL(normalized);
    const host = u.hostname;
    const port = u.port ? Number(u.port) : 3306;
    const user = decodeURIComponent(u.username || "");
    const password = decodeURIComponent(u.password || "");
    const database = u.pathname.replace(/^\//, "").split("/")[0]?.split("?")[0] ?? "";
    if (!host || !user || !database) return null;
    return { host, port, user, password, database };
  } catch {
    return null;
  }
}

function resolvePoolConfig(): {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
} {
  const fromUrl = tryConfigFromDatabaseUrl();
  if (process.env.DB_HOST?.trim()) {
    return {
      host: requiredEnv("DB_HOST"),
      port: Number(process.env.DB_PORT ?? 3306),
      user: requiredEnv("DB_USER"),
      password: requiredEnv("DB_PASSWORD"),
      database: requiredEnv("DB_NAME"),
    };
  }
  if (fromUrl) return fromUrl;
  throw new Error(
    "DB_CONFIG_MISSING: 请设置 DATABASE_URL（mysql://用户:密码@主机:端口/库名）或分别设置 DB_HOST、DB_USER、DB_PASSWORD、DB_NAME",
  );
}

export function getMysqlPool(): mysql.Pool {
  if (pool) return pool;
  const cfg = resolvePoolConfig();
  pool = mysql.createPool({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE ?? 10),
    queueLimit: 0,
    charset: "utf8mb4",
    namedPlaceholders: true,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  });
  return pool;
}

/**
 * 旧库连接池（仅用于数据迁移脚本）：
 * 优先读取 LEGACY_DATABASE_URL；未配置时自动将当前库名替换为 bs_lab_data。
 * 业务代码禁止调用此函数，仅供 migration/* 脚本使用。
 */
export function getLegacyMysqlPool(): mysql.Pool {
  if (legacyPool) return legacyPool;
  const legacyUrl = process.env.LEGACY_DATABASE_URL?.trim();
  let cfg: { host: string; port: number; user: string; password: string; database: string };
  if (legacyUrl && legacyUrl.startsWith("mysql://")) {
    const normalized = legacyUrl.replace(/^mysql:\/\//i, "http://");
    const u = new URL(normalized);
    cfg = {
      host: u.hostname,
      port: u.port ? Number(u.port) : 3306,
      user: decodeURIComponent(u.username || ""),
      password: decodeURIComponent(u.password || ""),
      database: u.pathname.replace(/^\//, "").split("/")[0]?.split("?")[0] ?? "",
    };
  } else {
    const base = resolvePoolConfig();
    cfg = { ...base, database: "bs_lab_data" };
  }
  legacyPool = mysql.createPool({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE ?? 10),
    queueLimit: 0,
    charset: "utf8mb4",
    namedPlaceholders: true,
  });
  return legacyPool;
}
