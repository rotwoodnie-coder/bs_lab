/**
 * sys_org 写操作（从 v2-sys-user-repository 拆出以满足单文件行数约束）
 */
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import type { SysOrgRecord, UpdateSysOrgInput } from "../../domain/v2-sys/v2-sys-types.ts";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import { coerceAuditorIdForMysql32, getSysOrgById } from "./v2-sys-user-repository.ts";
import { SystemLogService } from "../../services/SystemLogService.ts";

type OrgEdge = { orgId: string; parentOrgId: string | null };

async function loadActiveOrgEdges(conn: PoolConnection): Promise<OrgEdge[]> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT org_id AS orgId, parent_org_id AS parentOrgId FROM sys_org WHERE is_deleted = 0`,
  );
  return rows.map((r) => ({
    orgId: String(r.orgId),
    parentOrgId: r.parentOrgId == null || r.parentOrgId === "" ? null : String(r.parentOrgId),
  }));
}

/** 后序：子节点在前、根在后，满足 parent_org_id 外键删除顺序 */
function subtreePostOrderDeleteIds(edges: OrgEdge[], rootId: string): string[] | null {
  const idSet = new Set(edges.map((e) => e.orgId));
  if (!idSet.has(rootId)) return null;
  const byParent = new Map<string | null, string[]>();
  for (const e of edges) {
    const arr = byParent.get(e.parentOrgId) ?? [];
    arr.push(e.orgId);
    byParent.set(e.parentOrgId, arr);
  }
  const out: string[] = [];
  function dfs(id: string) {
    for (const c of byParent.get(id) ?? []) dfs(c);
    out.push(id);
  }
  dfs(rootId);
  return out;
}

async function assertOrgSubtreeDeletable(conn: PoolConnection, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const ph = ids.map(() => "?").join(",");
  const [u] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM sys_user WHERE is_deleted = 0 AND user_org_id IN (${ph})`,
    ids,
  );
  if (Number(u[0]?.c ?? 0) > 0) throw new Error("SYS_ORG_DELETE_BLOCKED_USERS");
  const [h] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM exp_homework WHERE is_deleted = 0 AND class_id IN (${ph})`,
    ids,
  );
  if (Number(h[0]?.c ?? 0) > 0) throw new Error("SYS_ORG_DELETE_BLOCKED_HOMEWORK");
  const [q] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM exp_question WHERE is_deleted = 0 AND class_id IS NOT NULL AND class_id IN (${ph})`,
    ids,
  );
  if (Number(q[0]?.c ?? 0) > 0) throw new Error("SYS_ORG_DELETE_BLOCKED_QUESTION");
}

export async function updateSysOrg(
  orgId: string,
  input: UpdateSysOrgInput,
  actorId?: string,
): Promise<SysOrgRecord> {
  const pool = getMysqlPool();
  const current = await getSysOrgById(orgId);
  if (!current) throw new Error("SYS_ORG_NOT_FOUND");

  const sets: string[] = [];
  const params: unknown[] = [];

  if (input.orgName !== undefined) {
    sets.push("org_name = ?");
    params.push(input.orgName);
  }
  if (input.orgTypeId !== undefined) {
    sets.push("org_type_id = ?");
    params.push(input.orgTypeId);
  }
  if (input.gradeId !== undefined) {
    sets.push("grade_id = ?");
    params.push(input.gradeId);
  }
  if (input.parentOrgId !== undefined) {
    sets.push("parent_org_id = ?");
    params.push(input.parentOrgId);
  }
  if (input.sortOrder !== undefined) {
    sets.push("sort_order = ?");
    params.push(input.sortOrder);
  }
  if (input.status !== undefined) {
    sets.push("status = ?");
    params.push(input.status);
  }

  const touchSchoolGrades = input.schoolGradeIds !== undefined;
  const hasOrgColumnPatch = sets.length > 0;

  if (!hasOrgColumnPatch && !touchSchoolGrades) {
    return current;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (hasOrgColumnPatch) {
      sets.push("update_user_id = ?", "update_time = NOW()");
      params.push(coerceAuditorIdForMysql32(actorId));
      await conn.query<ResultSetHeader>(
        `UPDATE sys_org SET ${sets.join(", ")} WHERE org_id = ? AND is_deleted = 0`,
        [...params, orgId],
      );
    } else if (touchSchoolGrades) {
      await conn.query<ResultSetHeader>(
        `UPDATE sys_org SET update_user_id = ?, update_time = NOW() WHERE org_id = ? AND is_deleted = 0`,
        [coerceAuditorIdForMysql32(actorId), orgId],
      );
    }

    // parentOrgId 变更时同步 org_path（含子树）
    if (input.parentOrgId !== undefined) {
      if (input.parentOrgId === orgId) throw new Error("SYS_ORG_PARENT_INVALID");
      const oldPath = (current.orgPath && String(current.orgPath).trim() !== "") ? String(current.orgPath).replace(/\/+$/, "") : `/${current.orgId}`;
      let newPath = `/${current.orgId}`;
      if (input.parentOrgId && String(input.parentOrgId).trim() !== "") {
        const parent = await getSysOrgById(String(input.parentOrgId));
        if (!parent) throw new Error("SYS_ORG_PARENT_NOT_FOUND");
        const base = parent.orgPath != null && String(parent.orgPath).trim() !== "" ? String(parent.orgPath).replace(/\/+$/, "") : `/${parent.orgId}`;
        newPath = `${base}/${current.orgId}`;
      }
      await conn.query<ResultSetHeader>(
        `UPDATE sys_org SET org_path = ? WHERE org_id = ? AND is_deleted = 0`,
        [newPath, orgId],
      );
      await conn.query<ResultSetHeader>(
        `UPDATE sys_org SET org_path = CONCAT(?, SUBSTRING(org_path, ?))
         WHERE is_deleted = 0 AND org_path LIKE ?`,
        [newPath, oldPath.length + 1, `${oldPath}/%`],
      );
    }

    if (touchSchoolGrades) {
      if ((input.schoolGradeIds?.length ?? 0) > 0) {
        await conn.query<ResultSetHeader>(
          `UPDATE sys_org SET grade_id = NULL WHERE org_id = ? AND is_deleted = 0`,
          [orgId],
        );
      }
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  const row = await getSysOrgById(orgId);
  if (!row) throw new Error("SYS_ORG_NOT_FOUND");
  return row;
}

/**
 * 物理删除当前节点及其全部下级 sys_org；先删 sys_user_role.org_id 引用，再自叶向根删 org。
 * 若存在用户 / 作业 / 题目仍引用子树中任一 org_id，则拒绝删除。
 */
export async function deleteSysOrgHard(orgId: string, actorId: string): Promise<void> {
  const pool = getMysqlPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const edges = await loadActiveOrgEdges(conn);
    const ordered = subtreePostOrderDeleteIds(edges, orgId);
    if (ordered == null) {
      await conn.rollback();
      throw new Error("SYS_ORG_NOT_FOUND");
    }
    await assertOrgSubtreeDeletable(conn, ordered);
    if (ordered.length > 0) {
      const ph = ordered.map(() => "?").join(",");
      await conn.query(`DELETE FROM sys_user_role WHERE org_id IN (${ph})`, ordered);
    }
    for (const id of ordered) {
      await conn.query<ResultSetHeader>(`DELETE FROM sys_org WHERE org_id = ?`, [id]);
    }
    await conn.commit();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes("SYS_ORG_DELETE_BLOCKED")) {
      await SystemLogService.reportIssue({
        errorType: message,
        currentUserId: actorId,
        targetOrgId: orgId,
        operationType: "delete",
        detail: "Subtree deletion blocked due to existing data",
      });
    }
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/**
 * 根据父节点 ID 列表查找指定类型的子节点 org_id。
 */
export async function listOrgIdsByParentIds(
  pool: ReturnType<typeof getMysqlPool>,
  parentIds: string[],
  orgTypeId: string,
): Promise<string[]> {
  if (parentIds.length === 0) return [];
  const ph = parentIds.map(() => "?").join(",");
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT org_id AS orgId FROM sys_org
     WHERE parent_org_id IN (${ph})
       AND org_type_id = ?
       AND is_deleted = 0`,
    [...parentIds, orgTypeId],
  );
  return rows.map((r) => String(r.orgId));
}
