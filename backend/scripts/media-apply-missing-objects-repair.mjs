/**
 * 执行 media-integrity 扫描生成的 repair SQL。
 *
 * 安全策略：
 * - 默认 dry-run（仅展示将执行的 SQL 摘要，不落库）
 * - 仅当显式传入 --yes 时才真正执行
 *
 * 用法：
 * pnpm run media:apply-missing-objects-repair
 * pnpm run media:apply-missing-objects-repair -- --sqlPath="D:/dev_program/bs_lab/backend/reports/media-integrity/xxx.repair.sql"
 * pnpm run media:apply-missing-objects-repair -- --yes --sqlPath="D:/dev_program/bs_lab/backend/reports/media-integrity/xxx.repair.sql"
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

function stripComments(sqlText) {
  return sqlText
    .split(/\r?\n/)
    .map((line) => line.replace(/--.*$/, "").trimEnd())
    .join("\n");
}

function splitSqlStatements(sqlText) {
  return stripComments(sqlText)
    .split(";")
    .map((x) => x.trim())
    .filter(Boolean);
}

async function resolveLatestRepairSql(baseDir) {
  const entries = await fs.readdir(baseDir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith(".repair.sql"))
    .map((e) => path.join(baseDir, e.name));
  if (!files.length) {
    throw new Error(`NO_REPAIR_SQL_FOUND:${baseDir}`);
  }
  const withStats = await Promise.all(
    files.map(async (f) => ({
      file: f,
      mtime: (await fs.stat(f)).mtimeMs,
    })),
  );
  withStats.sort((a, b) => b.mtime - a.mtime);
  return withStats[0].file;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apply = args.yes === "1" || args.yes === "true";
  const reportsDir = path.resolve(process.cwd(), "reports", "media-integrity");
  const sqlPath = args.sqlPath ? path.resolve(String(args.sqlPath)) : await resolveLatestRepairSql(reportsDir);

  const sqlRaw = await fs.readFile(sqlPath, "utf8");
  const statements = splitSqlStatements(sqlRaw);
  if (!statements.length) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          applied: false,
          reason: "SQL_EMPTY",
          sqlPath,
        },
        null,
        2,
      ),
    );
    return;
  }

  const summary = {
    sqlPath,
    statements: statements.length,
    applyRequested: apply,
    dryRun: !apply,
    preview: statements.slice(0, 3),
  };

  if (!apply) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          applied: false,
          ...summary,
          hint: "当前为 dry-run。确认无误后加 --yes 执行。",
        },
        null,
        2,
      ),
    );
    return;
  }

  const { getMysqlPool } = await import("../src/infrastructure/mysql/mysql-client.ts");
  const pool = getMysqlPool();
  const conn = await pool.getConnection();
  try {
    for (const statement of statements) {
      await conn.query(statement);
    }
  } finally {
    conn.release();
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        applied: true,
        ...summary,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("[media-apply-missing-objects-repair] failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
