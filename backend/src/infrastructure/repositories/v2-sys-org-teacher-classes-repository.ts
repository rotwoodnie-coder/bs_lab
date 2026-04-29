/**
 * 教师授课班级只读：来自 `sys_user_role` + `sys_org`（班级）+ `data_role` + `data_school_subject`。
 * `subject_id` 优先由环境映射 `V2_TEACHING_SUBJECT_ROLE_MAP` 反查；否则若 `role_id` 本身为合法 subject_id 则视为同学科主键。
 */
import type { RowDataPacket } from "mysql2/promise";

import { V2_ORG_TYPE_IDS } from "../../domain/v2-sys/v2-org-type-constants.ts";
import { getTeachingSubjectRoleMap, invertSubjectRoleMap } from "../../domain/v2-sys/teaching-user-role-bind.ts";
import { getMysqlPool } from "../mysql/mysql-client.ts";

export type TeacherAuthorizedClassRow = {
  orgId: string;
  orgName: string;
  subjectId: string | null;
  roleId: string | null;
  teacherName: string;
  avatar: string | null;
  subjectName: string | null;
  fullPathName: string;
};

export type TeacherAuthorizedClassesQuery = {
  teacherId: string;
  subjectId: string | null;
};

function parsePathSegmentIds(orgPath: string | null, leafOrgId: string): string[] {
  const raw = orgPath != null ? String(orgPath).trim() : "";
  if (!raw) return [leafOrgId];
  const normalized = raw.replace(/\/+/g, "/").replace(/^\/+|\/+$/g, "");
  if (!normalized) return [leafOrgId];
  const parts = normalized.split("/").filter(Boolean);
  return parts.length > 0 ? parts : [leafOrgId];
}

function collectUniqueOrgIdsForPaths(rows: RowDataPacket[]): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    const leaf = String(r.orgId);
    for (const id of parsePathSegmentIds(r.orgPath != null ? String(r.orgPath) : null, leaf)) {
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
    `SELECT org_id AS orgId, org_name AS orgName
     FROM sys_org
     WHERE is_deleted = 0 AND org_id IN (${ph})`,
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

function mapRawRowToDto(r: RowDataPacket, nameById: Map<string, string>): TeacherAuthorizedClassRow {
  const orgId = String(r.orgId);
  const orgName = String(r.orgName ?? "");
  const subjectId = r.resolvedSubjectId != null && String(r.resolvedSubjectId).trim() !== ""
    ? String(r.resolvedSubjectId).trim()
    : null;
  const roleId = r.roleId != null && String(r.roleId).trim() !== "" ? String(r.roleId).trim() : null;
  const teacherName = r.teacherName != null ? String(r.teacherName).trim() : "";
  const avatarRaw = r.avatar != null ? String(r.avatar).trim() : "";
  const avatar = avatarRaw !== "" ? avatarRaw : null;
  const subjectName =
    r.subjectName != null && String(r.subjectName).trim() !== "" ? String(r.subjectName).trim() : null;
  const orgPathRaw = r.orgPath != null ? String(r.orgPath) : null;
  return {
    orgId,
    orgName,
    subjectId,
    roleId,
    teacherName,
    avatar,
    subjectName,
    fullPathName: buildFullPathName(orgPathRaw, orgId, orgName, nameById),
  };
}

async function finalizeRowsWithFullPath(
  pool: ReturnType<typeof getMysqlPool>,
  rawRows: RowDataPacket[],
): Promise<TeacherAuthorizedClassRow[]> {
  const ids = collectUniqueOrgIdsForPaths(rawRows);
  const nameById = await loadOrgDisplayNamesByIds(pool, ids);
  return rawRows.map((r) => mapRawRowToDto(r, nameById));
}

async function selectTeachingClassRows(
  pool: ReturnType<typeof getMysqlPool>,
  q: TeacherAuthorizedClassesQuery,
): Promise<RowDataPacket[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT
      o.org_id AS orgId,
      o.org_name AS orgName,
      o.org_path AS orgPath,
      ur.role_id AS roleId,
      u.user_name AS teacherName,
      u.user_logo AS avatar,
      sub.subject_name AS subjectName,
      sub.subject_id AS subjectJoinId
    FROM sys_user_role ur
    INNER JOIN sys_org o ON o.org_id = ur.org_id
    INNER JOIN sys_user u ON u.user_id = ur.user_id AND u.is_deleted = 0
    LEFT JOIN data_role dr ON dr.role_id = ur.role_id
    LEFT JOIN data_school_subject sub ON sub.subject_id = ur.role_id
    WHERE ur.user_id = ?
      AND o.is_deleted = 0
      AND o.org_type_id = ?
    ORDER BY o.sort_order ASC, o.org_name ASC, ur.role_id ASC
    `,
    [q.teacherId, V2_ORG_TYPE_IDS.class],
  );

  const map = getTeachingSubjectRoleMap();
  const inv = map ? invertSubjectRoleMap(map) : null;

  const out: RowDataPacket[] = [];
  for (const r of rows as RowDataPacket[]) {
    let resolvedSubjectId: string | null = null;
    if (inv?.has(String(r.roleId))) {
      resolvedSubjectId = inv.get(String(r.roleId)) ?? null;
    } else if (r.subjectJoinId != null && String(r.subjectJoinId).trim() !== "") {
      resolvedSubjectId = String(r.subjectJoinId).trim();
    } else if (r.roleId != null && String(r.roleId).trim() !== "") {
      // 最后回退：将 role_id 本身当作 subject_id（兼容 role_id 即为学科 ID 的场景）
      resolvedSubjectId = String(r.roleId).trim();
    }

    const row = { ...r, resolvedSubjectId } as RowDataPacket;
    if (q.subjectId != null && q.subjectId !== "" && resolvedSubjectId !== q.subjectId) continue;
    out.push(row);
  }

  const subjectIds = [...new Set(out.map((x) => String(x.resolvedSubjectId ?? "").trim()).filter(Boolean))];
  if (subjectIds.length > 0) {
    const ph = subjectIds.map(() => "?").join(",");
    const [subs] = await pool.query<RowDataPacket[]>(
      `SELECT subject_id AS subjectId, subject_name AS subjectName
       FROM data_school_subject WHERE subject_id IN (${ph})`,
      subjectIds,
    );
    const nm = new Map<string, string>();
    for (const s of subs as RowDataPacket[]) {
      nm.set(String(s.subjectId), String(s.subjectName ?? "").trim());
    }
    for (const r of out) {
      const sid = r.resolvedSubjectId != null ? String(r.resolvedSubjectId).trim() : "";
      if (!sid) continue;
      const sn = r.subjectName != null ? String(r.subjectName).trim() : "";
      if (sn === "" && nm.has(sid)) (r as { subjectName?: string | null }).subjectName = nm.get(sid) ?? null;
    }
  }

  return out;
}

export async function getTeacherClassRelationsByTeacherId(teacherId: string): Promise<TeacherAuthorizedClassRow[]> {
  const pool = getMysqlPool();
  const raw = await selectTeachingClassRows(pool, { teacherId, subjectId: null });
  return finalizeRowsWithFullPath(pool, raw);
}

export async function getTeacherAuthorizedClasses(query: TeacherAuthorizedClassesQuery): Promise<TeacherAuthorizedClassRow[]> {
  const pool = getMysqlPool();
  const raw = await selectTeachingClassRows(pool, query);
  return finalizeRowsWithFullPath(pool, raw);
}
