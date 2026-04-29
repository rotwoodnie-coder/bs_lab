/**
 * 教师授课班级只读查询：`Teacher_Class` 专用表。
 * JOIN sys_org（班级名称）、data_school_subject（学科名称）、sys_user（教师名称）。
 */
import type { RowDataPacket } from "mysql2/promise";

import { V2_ORG_TYPE_IDS } from "../../domain/v2-sys/v2-org-type-constants.ts";
import { getMysqlPool } from "../mysql/mysql-client.ts";

export type TeacherClassRow = {
  seqId: string;
  teacherId: string;
  /** 前端统一用 orgId 标识班级组织，兼容已有组件 */
  orgId: string;
  subjectId: string;
  status: string;
  orgName: string;
  teacherName: string;
  subjectName: string;
  fullPathName: string;
};

function parsePathSegmentIds(orgPath: string | null, leafOrgId: string): string[] {
  const raw = orgPath != null ? String(orgPath).trim() : "";
  if (!raw) return [leafOrgId];
  const normalized = raw.replace(/\/+/g, "/").replace(/^\/+|\/+$/g, "");
  if (!normalized) return [leafOrgId];
  const parts = normalized.split("/").filter(Boolean);
  return parts.length > 0 ? parts : [leafOrgId];
}

function collectUniqueOrgIdsForPaths(rows: { orgId: string; orgPath: string | null }[]): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    for (const id of parsePathSegmentIds(r.orgPath, r.orgId)) {
      set.add(id);
    }
  }
  return [...set];
}

async function loadOrgDisplayNamesByIds(
  pool: ReturnType<typeof getMysqlPool>,
  orgIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (orgIds.length === 0) return map;
  const ph = orgIds.map(() => "?").join(",");
  const [nameRows] = await pool.query<RowDataPacket[]>(
    `SELECT org_id AS orgId, org_name AS orgName FROM sys_org WHERE is_deleted = 0 AND org_id IN (${ph})`,
    orgIds,
  );
  for (const row of nameRows) {
    map.set(String(row.orgId), String(row.orgName ?? "").trim());
  }
  return map;
}

function buildFullPathName(
  orgPath: string | null,
  leafOrgId: string,
  leafOrgName: string,
  nameById: Map<string, string>,
): string {
  const ids = parsePathSegmentIds(orgPath, leafOrgId);
  const parts = ids.map((id, i) => {
    const fromMap = nameById.get(id);
    if (fromMap != null && fromMap !== "") return fromMap;
    if (i === ids.length - 1 && leafOrgName.trim() !== "") return leafOrgName.trim();
    return id;
  });
  return parts.join(" / ");
}

export async function getTeacherClassesByTeacherId(
  teacherId: string,
): Promise<TeacherClassRow[]> {
  const pool = getMysqlPool();

  const [rawRows] = await pool.query<RowDataPacket[]>(
    `SELECT
       tc.seq_id AS seqId,
       tc.teacher_id AS teacherId,
       tc.class_org_id AS classOrgId,
       tc.subject_id AS subjectId,
       tc.status AS status,
       o.org_name AS orgName,
       o.org_path AS orgPath,
       u.user_name AS teacherName,
       s.subject_name AS subjectName
     FROM Teacher_Class tc
     INNER JOIN sys_org o ON o.org_id = tc.class_org_id AND o.is_deleted = 0
     INNER JOIN sys_user u ON u.user_id = tc.teacher_id AND u.is_deleted = 0
     INNER JOIN data_school_subject s ON s.subject_id = tc.subject_id
     WHERE tc.teacher_id = ?
     ORDER BY o.sort_order ASC, o.org_name ASC, s.sort_order ASC, s.subject_name ASC`,
    [teacherId],
  );

  const pathRows = rawRows.map((r) => ({
    orgId: String(r.classOrgId),
    orgPath: r.orgPath != null ? String(r.orgPath) : null,
  }));
  const nameById = await loadOrgDisplayNamesByIds(pool, collectUniqueOrgIdsForPaths(pathRows));

  return rawRows.map((r) => ({
    seqId: String(r.seqId),
    teacherId: String(r.teacherId),
    orgId: String(r.classOrgId),
    subjectId: String(r.subjectId),
    status: String(r.status ?? "y"),
    orgName: String(r.orgName ?? ""),
    teacherName: String(r.teacherName ?? ""),
    subjectName: String(r.subjectName ?? ""),
    fullPathName: buildFullPathName(
      r.orgPath != null ? String(r.orgPath) : null,
      String(r.classOrgId),
      String(r.orgName ?? ""),
      nameById,
    ),
  }));
}
