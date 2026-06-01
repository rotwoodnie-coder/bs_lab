/**
 * 将人类可读「名称」转为 MySQL `varchar(32)` 主键：英文可辨识片段 + 必要时短随机后缀，并保证库内唯一。
 * 调用方可传入显式主键（人工指定）；校验通过且未占用则直接使用。
 */
import { randomBytes } from "node:crypto";
import { pinyin } from "pinyin-pro";
import type { Pool, RowDataPacket } from "mysql2/promise";

export type MysqlQueryLike = Pick<Pool, "query">;

const ID_TOKEN = /^[a-zA-Z0-9_]{1,32}$/;

export function isValidMysqlVarchar32Id(id: string): boolean {
  return ID_TOKEN.test(id.trim());
}

/** 名称 → 小写英文/数字/下划线词干（最长 `maxStem`，不含随机后缀） */
export function asciiSlugFromHumanLabel(label: string, maxStem = 28): string {
  const t = label.trim();
  if (!t) return "";
  const hasCjk = /[\u3400-\u9fff]/.test(t);
  let raw = t;
  if (hasCjk) {
    try {
      raw = pinyin(t, { toneType: "none", type: "string", separator: "_" });
    } catch {
      raw = t;
    }
  }
  let s = String(raw)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  if (!s) return "";
  return s.slice(0, maxStem).replace(/_+$/g, "") || "";
}

export async function assertUnusedMysqlVarchar32Id(
  pool: MysqlQueryLike,
  opts: { table: string; column: string; id: string },
): Promise<void> {
  const table = opts.table.replace(/[^a-zA-Z0-9_]/g, "");
  const column = opts.column.replace(/[^a-zA-Z0-9_]/g, "");
  if (!table || !column) throw new Error("SQL_IDENTIFIER_INVALID");
  const id = opts.id.trim();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 AS ok FROM \`${table}\` WHERE \`${column}\` = ? LIMIT 1`,
    [id],
  );
  if (rows.length > 0) throw new Error("ID_ALREADY_USED");
}

export async function allocateUniqueMysqlVarchar32Id(
  pool: MysqlQueryLike,
  opts: { table: string; column: string; label: string },
): Promise<string> {
  const table = opts.table.replace(/[^a-zA-Z0-9_]/g, "");
  const column = opts.column.replace(/[^a-zA-Z0-9_]/g, "");
  if (!table || !column) throw new Error("SQL_IDENTIFIER_INVALID");
  const stemBase = asciiSlugFromHumanLabel(opts.label) || "id";
  for (let attempt = 0; attempt < 48; attempt++) {
    const suffix = `_${randomBytes(2).toString("hex")}`;
    const budget = 32 - suffix.length;
    let stem = stemBase.slice(0, Math.max(1, budget)).replace(/_+$/g, "") || "v";
    if (stem.length > budget) stem = stem.slice(0, budget);
    const candidate = `${stem}${suffix}`.slice(0, 32);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 1 AS ok FROM \`${table}\` WHERE \`${column}\` = ? LIMIT 1`,
      [candidate],
    );
    if (rows.length === 0) return candidate;
  }
  return randomBytes(16).toString("hex");
}

/**
 * 解析最终主键：若 `explicit` 合法且未占用则用其；否则按 `label` 自动生成唯一 id。
 */
export async function resolveVarchar32PrimaryKey(
  pool: MysqlQueryLike,
  opts: { table: string; column: string; label: string; explicit?: string | null | undefined },
): Promise<string> {
  const raw = opts.explicit?.trim();
  if (raw) {
    if (!isValidMysqlVarchar32Id(raw)) throw new Error("PRIMARY_KEY_INVALID");
    await assertUnusedMysqlVarchar32Id(pool, { table: opts.table, column: opts.column, id: raw });
    return raw;
  }
  return allocateUniqueMysqlVarchar32Id(pool, { table: opts.table, column: opts.column, label: opts.label });
}
