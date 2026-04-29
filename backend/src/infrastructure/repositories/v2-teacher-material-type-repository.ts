/**
 * 教师实验素材类型（控制台配置 + 素材库筛选）
 *
 * 默认使用迁移 **0019** 中的既有表（不在新库上再建新表）：
 *   - `edu_teacher_material_types`（status 为 TINYINT：1 启用、0 停用）
 *   - `edu_teacher_material_type_visible_roles`
 *
 * 若某环境单独执行过 **0033** 且仅有 `teacher_material_type` 私有表，可设置：
 *   `BS_LAB_TEACHER_MATERIAL_TYPE_SCHEMA=v2`
 *
 * **仅 0024 新库**：通常不含 0019 的 `edu_*` 表；未设 env 时按 INFORMATION_SCHEMA
 * 自动探测：优先 `edu_teacher_material_types`，否则 `teacher_material_type`；皆无则列表为空、写操作报错。
 */
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "../mysql/mysql-client.ts";

export type TeacherMaterialTypeV2Row = {
  code: string;
  label: string;
  sortOrder: number;
  /** 空数组表示全部角色可见 */
  visibleRoles: string[];
};

type SchemaKind = "edu" | "v2" | "none";

async function resolveTeacherMaterialSchema(pool: ReturnType<typeof getMysqlPool>): Promise<SchemaKind> {
  const raw = process.env.BS_LAB_TEACHER_MATERIAL_TYPE_SCHEMA?.trim().toLowerCase();
  if (raw === "v2") return "v2";
  if (raw === "edu") return "edu";

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT TABLE_NAME AS n FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME IN ('edu_teacher_material_types','teacher_material_type')`,
  );
  const names = new Set(rows.map((r) => String(r.n)));
  if (names.has("edu_teacher_material_types")) return "edu";
  if (names.has("teacher_material_type")) return "v2";
  return "none";
}

function tables(kind: SchemaKind) {
  if (kind === "v2") {
    return {
      types: "teacher_material_type",
      roles: "teacher_material_type_visible_role",
    };
  }
  if (kind === "edu") {
    return {
      types: "`edu_teacher_material_types`",
      roles: "`edu_teacher_material_type_visible_roles`",
    };
  }
  return { types: "", roles: "" };
}

function mapRows(rows: RowDataPacket[], roleRows: RowDataPacket[]): TeacherMaterialTypeV2Row[] {
  const rolesByCode = new Map<string, string[]>();
  for (const r of roleRows) {
    const code = String(r.code);
    const list = rolesByCode.get(code) ?? [];
    list.push(String(r.role_key));
    rolesByCode.set(code, list);
  }
  return rows.map((r) => ({
    code: String(r.code),
    label: String(r.label),
    sortOrder: Number(r.sort_order ?? 0),
    visibleRoles: rolesByCode.get(String(r.code)) ?? [],
  }));
}

export async function listTeacherMaterialTypesV2(): Promise<TeacherMaterialTypeV2Row[]> {
  const pool = getMysqlPool();
  const kind = await resolveTeacherMaterialSchema(pool);
  if (kind === "none") return [];
  const { types, roles } = tables(kind);
  const activeWhere = kind === "v2" ? "status = 'y'" : "status = 1";

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT code, label, sort_order
     FROM ${types}
     WHERE ${activeWhere}
     ORDER BY sort_order ASC, code ASC`,
  );
  if (!rows.length) return [];
  const codes = rows.map((r) => String(r.code));
  const placeholders = codes.map(() => "?").join(",");
  const [roleRows] = await pool.query<RowDataPacket[]>(
    `SELECT code, role_key
     FROM ${roles}
     WHERE code IN (${placeholders})`,
    codes,
  );
  return mapRows(rows, roleRows);
}

export async function createTeacherMaterialTypeV2(input: TeacherMaterialTypeV2Row): Promise<TeacherMaterialTypeV2Row> {
  const pool = getMysqlPool();
  const kind = await resolveTeacherMaterialSchema(pool);
  if (kind === "none") throw new Error("TEACHER_MATERIAL_TYPE_SCHEMA_MISSING");
  const { types, roles } = tables(kind);
  const rolesList = [...new Set(input.visibleRoles)];
  const statusVal = kind === "v2" ? "y" : 1;

  await pool.query(
    `INSERT INTO ${types} (code, label, sort_order, status) VALUES (?, ?, ?, ?)`,
    [input.code, input.label, input.sortOrder, statusVal],
  );
  if (rolesList.length) {
    const vals = rolesList.map(() => "(?, ?)").join(",");
    await pool.query(`INSERT INTO ${roles} (code, role_key) VALUES ${vals}`, rolesList.flatMap((role) => [input.code, role]));
  }
  return { ...input, visibleRoles: rolesList };
}

export async function updateTeacherMaterialTypeV2(
  code: string,
  input: Omit<TeacherMaterialTypeV2Row, "code">,
): Promise<TeacherMaterialTypeV2Row> {
  const pool = getMysqlPool();
  const kind = await resolveTeacherMaterialSchema(pool);
  if (kind === "none") throw new Error("TEACHER_MATERIAL_TYPE_SCHEMA_MISSING");
  const { types, roles } = tables(kind);
  const rolesList = [...new Set(input.visibleRoles)];
  const activeWhere = kind === "v2" ? "status = 'y'" : "status = 1";

  const [found] = await pool.query<RowDataPacket[]>(
    `SELECT code FROM ${types} WHERE code = ? AND ${activeWhere} LIMIT 1`,
    [code],
  );
  if (!found.length) throw new Error("TEACHER_MATERIAL_TYPE_NOT_FOUND");

  const statusVal = kind === "v2" ? "y" : 1;
  await pool.query(
    `UPDATE ${types}
     SET label = ?, sort_order = ?, status = ?
     WHERE code = ?`,
    [input.label, input.sortOrder, statusVal, code],
  );
  await pool.query(`DELETE FROM ${roles} WHERE code = ?`, [code]);
  if (rolesList.length) {
    const vals = rolesList.map(() => "(?, ?)").join(",");
    await pool.query(`INSERT INTO ${roles} (code, role_key) VALUES ${vals}`, rolesList.flatMap((role) => [code, role]));
  }
  return { code, label: input.label, sortOrder: input.sortOrder, visibleRoles: rolesList };
}

export async function deleteTeacherMaterialTypeV2(code: string): Promise<{ code: string }> {
  const pool = getMysqlPool();
  const kind = await resolveTeacherMaterialSchema(pool);
  if (kind === "none") throw new Error("TEACHER_MATERIAL_TYPE_SCHEMA_MISSING");
  const { types, roles } = tables(kind);
  const activeWhere = kind === "v2" ? "status = 'y'" : "status = 1";
  const deleteStatus = kind === "v2" ? "n" : 0;

  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE ${types} SET status = ? WHERE code = ? AND ${activeWhere}`,
    [deleteStatus, code],
  );
  if (result.affectedRows !== 1) {
    throw new Error("TEACHER_MATERIAL_TYPE_NOT_FOUND");
  }
  await pool.query(`DELETE FROM ${roles} WHERE code = ?`, [code]);
  return { code };
}
