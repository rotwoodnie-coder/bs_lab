/**
 * sys_org_school_grade：学校类组织与年级的多对多
 */
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { getMysqlPool } from "../mysql/mysql-client.ts";

function* walkErrorChain(e: unknown): Generator<unknown> {
  const seen = new Set<unknown>();
  function* walk(x: unknown): Generator<unknown> {
    if (x == null || seen.has(x)) return;
    seen.add(x);
    yield x;
    if (typeof x !== "object") return;
    const o = x as Record<string, unknown>;
    if (o.cause != null) yield* walk(o.cause);
    if (x instanceof AggregateError && Array.isArray(x.errors)) {
      for (const sub of x.errors) yield* walk(sub);
    }
  }
  yield* walk(e);
}

/** 表缺失：兼容 mysql2 QueryError、仅 message 的 Error、以及 AggregateError 包装。 */
function isMissingSchoolGradeTableError(e: unknown): boolean {
  for (const cur of walkErrorChain(e)) {
    if (typeof cur !== "object" || cur === null) continue;
    const o = cur as Record<string, unknown>;
    const errno = o.errno;
    if (o.code === "ER_NO_SUCH_TABLE" || errno === 1146 || errno === "1146" || o.sqlState === "42S02") {
      return true;
    }
    const msg =
      typeof o.message === "string"
        ? o.message
        : typeof o.sqlMessage === "string"
          ? o.sqlMessage
          : "";
    if (msg.includes("sys_org_school_grade") && (msg.includes("doesn't exist") || msg.includes("不存在"))) {
      return true;
    }
  }
  return false;
}

export async function fetchSchoolGradeIdsByOrgIds(orgIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (orgIds.length === 0) return map;
  const pool = getMysqlPool();
  const ph = orgIds.map(() => "?").join(",");
  let rows: RowDataPacket[];
  try {
    const [r] = await pool.query<RowDataPacket[]>(
      `SELECT org_id AS orgId, grade_id AS gradeId FROM sys_org_school_grade WHERE org_id IN (${ph}) ORDER BY grade_id ASC`,
      orgIds,
    );
    rows = r;
  } catch (e) {
    // 无 sys_org_school_grade 表时静默降级：组织树照常返回，schoolGradeIds 均为空数组。
    if (isMissingSchoolGradeTableError(e)) return map;
    throw e;
  }
  for (const r of rows) {
    const oid = String(r.orgId);
    const gid = String(r.gradeId);
    const arr = map.get(oid) ?? [];
    arr.push(gid);
    map.set(oid, arr);
  }
  return map;
}

export async function fetchSchoolGradeIdsForOrg(orgId: string): Promise<string[]> {
  const m = await fetchSchoolGradeIdsByOrgIds([orgId]);
  return m.get(orgId) ?? [];
}

/** 整包替换关联行（空数组表示清空） */
export async function replaceOrgSchoolGrades(conn: PoolConnection, orgId: string, gradeIds: string[]): Promise<void> {
  const uniq = [...new Set(gradeIds.filter((g) => g.length > 0))];
  await conn.query<ResultSetHeader>(`DELETE FROM sys_org_school_grade WHERE org_id = ?`, [orgId]);
  if (uniq.length === 0) return;
  const values = uniq.map(() => "(?, ?)").join(", ");
  const params: unknown[] = [];
  for (const gid of uniq) {
    params.push(orgId, gid);
  }
  await conn.query(
    `INSERT INTO sys_org_school_grade (org_id, grade_id) VALUES ${values}`,
    params,
  );
}
