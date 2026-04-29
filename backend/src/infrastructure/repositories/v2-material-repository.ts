/**
 * V2 材料库 MySQL 仓库
 * 对应表：material_msg / material_pic / material_security
 */
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { allocateUniqueMysqlVarchar32Id, resolveVarchar32PrimaryKey } from "../ids/identifiable-varchar32.ts";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import type {
  MaterialMsgRecord,
  MaterialPicRecord,
  MaterialSecurityRecord,
  CreateMaterialInput,
  UpdateMaterialInput,
  MaterialListQuery,
  MaterialListPage,
} from "../../domain/v2-material/v2-material-types.ts";

// 基线 material_msg.material_num 为 int；此处仅接受输入的 materialNum（number 或 string），不做 unit 拼接。

/** 封面直链：标准列为 `main_pic_url`；部分迁移/旧库在 `material_msg.logo_url` 存同义封面（勿与 `data_file.logo_url` 混淆）。 */
function pickMaterialMsgCoverUrl(row: RowDataPacket): string | null {
  const mp = row.main_pic_url != null && String(row.main_pic_url).trim() !== ""
    ? String(row.main_pic_url).trim()
    : null;
  if (mp) return mp;
  const lg = row.logo_url != null && String(row.logo_url).trim() !== ""
    ? String(row.logo_url).trim()
    : null;
  return lg || null;
}

function rowToMaterial(row: RowDataPacket): MaterialMsgRecord {
  const mainExplicit = pickMaterialMsgCoverUrl(row);
  const mainFallback =
    row.fallback_main_pic != null && String(row.fallback_main_pic).trim() !== ""
      ? String(row.fallback_main_pic).trim()
      : null;
  return {
    materialId: String(row.material_id),
    materialName: String(row.material_name ?? ""),
    materialPropId: row.material_prop_id ? String(row.material_prop_id) : null,
    materialTypeId: row.material_type_id ? String(row.material_type_id) : null,
    materialNum: row.material_num != null ? Number(row.material_num) : null,
    mainPicUrl: mainExplicit ?? mainFallback,
    expPurpose: row.exp_purpose ? String(row.exp_purpose) : null,
    additionalComments: row.additional_comments ? String(row.additional_comments) : null,
    comments: row.comments ? String(row.comments) : null,
    status: row.status ? String(row.status) : null,
    // 基线表 material_msg 无 owner_user_id；先以 create_user_id 作为归属人（可后续在 schema 真源内补齐时再调整）。
    ownerUserId: row.create_user_id ? String(row.create_user_id) : null,
    createUserId: row.create_user_id ? String(row.create_user_id) : null,
    createTime: row.create_time ? String(row.create_time) : null,
    updateUserId: row.update_user_id ? String(row.update_user_id) : null,
    updateTime: row.update_time ? String(row.update_time) : null,
    isDeleted: Number(row.is_deleted ?? 0) as 0 | 1,
  };
}

export async function listMaterials(query: MaterialListQuery): Promise<MaterialListPage> {
  const pool = getMysqlPool();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const offset = (page - 1) * pageSize;
  const where: string[] = ["is_deleted = 0"];
  const params: unknown[] = [];

  if (query.keyword?.trim()) {
    where.push("material_name LIKE ?");
    params.push(`%${query.keyword.trim()}%`);
  }
  if (query.materialTypeId) { where.push("material_type_id = ?"); params.push(query.materialTypeId); }
  if (query.materialPropId) { where.push("material_prop_id = ?"); params.push(query.materialPropId); }
  if (query.status) { where.push("status = ?"); params.push(query.status); }
  if (query.createUserId?.trim()) {
    where.push("create_user_id = ?");
    params.push(query.createUserId.trim());
  }

  const whereSql = where.join(" AND ");
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM material_msg WHERE ${whereSql}`,
    params,
  );
  const total = Number((countRows[0] as RowDataPacket).total ?? 0);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT m.*,
      (SELECT p.material_url FROM material_pic p
       WHERE p.material_id = m.material_id
       ORDER BY COALESCE(p.sort_order, 0) ASC, p.seq_id ASC
       LIMIT 1) AS fallback_main_pic
     FROM material_msg m
     WHERE ${whereSql} ORDER BY m.create_time DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  );

  return { items: rows.map(rowToMaterial), total, page, pageSize };
}

export async function getMaterialById(materialId: string): Promise<MaterialMsgRecord | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM material_msg WHERE material_id = ? AND is_deleted = 0 LIMIT 1`,
    [materialId],
  );
  if (rows.length === 0) return null;
  const base = rowToMaterial(rows[0]!);

  const [pics] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM material_pic WHERE material_id = ? ORDER BY COALESCE(sort_order, 0) ASC, seq_id ASC`,
    [materialId],
  );
  const [secs] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM material_security WHERE material_id = ? ORDER BY sort_order ASC`,
    [materialId],
  );

  const mappedPics = (pics as RowDataPacket[]).map((r) => ({
      seqId: String(r.seq_id), materialId: String(r.material_id),
      materialUrl: r.material_url ? String(r.material_url) : null,
      sortOrder: r.sort_order != null ? Number(r.sort_order) : null,
      createTime: r.create_time ? String(r.create_time) : null,
    } as MaterialPicRecord));
  const firstPicUrl = mappedPics[0]?.materialUrl?.trim() || null;

  return {
    ...base,
    mainPicUrl: base.mainPicUrl ?? firstPicUrl,
    pics: mappedPics,
    securities: (secs as RowDataPacket[]).map((r) => ({
      seqId: String(r.seq_id), materialId: String(r.material_id),
      securityId: String(r.security_id),
      sortOrder: r.sort_order != null ? Number(r.sort_order) : null,
      createTime: r.create_time ? String(r.create_time) : null,
    } as MaterialSecurityRecord)),
  };
}

export async function createMaterial(
  input: CreateMaterialInput,
  actorId?: string,
): Promise<MaterialMsgRecord> {
  const pool = getMysqlPool();
  const materialId = await resolveVarchar32PrimaryKey(pool, {
    table: "material_msg",
    column: "material_id",
    label: input.materialName,
    explicit: input.materialId,
  });
  const materialNum = input.materialNum ?? null;
  await pool.query<ResultSetHeader>(
    `INSERT INTO material_msg
      (material_id, material_name, material_prop_id, material_type_id, material_num,
       main_pic_url, exp_purpose, additional_comments, comments, status,
       create_user_id, create_time, update_user_id, update_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`,
    [
      materialId, input.materialName,
      input.materialPropId ?? null, input.materialTypeId ?? null,
      materialNum, input.mainPicUrl ?? null,
      input.expPurpose ?? null, input.additionalComments ?? null,
      input.comments ?? null, input.status ?? "y",
      actorId ?? null, actorId ?? null,
    ],
  );
  for (let i = 0; i < (input.picUrls ?? []).length; i++) {
    const seqId = await allocateUniqueMysqlVarchar32Id(pool, {
      table: "material_pic",
      column: "seq_id",
      label: `${input.materialName}_pic_${i}`,
    });
    await pool.query(
      `INSERT INTO material_pic (seq_id, material_id, material_url, sort_order, create_time)
       VALUES (?, ?, ?, ?, NOW())`,
      [seqId, materialId, input.picUrls![i], i],
    );
  }
  for (let i = 0; i < (input.securityIds ?? []).length; i++) {
    const seqId = await allocateUniqueMysqlVarchar32Id(pool, {
      table: "material_security",
      column: "seq_id",
      label: `${input.materialName}_sec_${i}`,
    });
    await pool.query(
      `INSERT INTO material_security (seq_id, material_id, security_id, sort_order, create_time)
       VALUES (?, ?, ?, ?, NOW())`,
      [seqId, materialId, input.securityIds![i], i],
    );
  }
  const row = await getMaterialById(materialId);
  if (!row) throw new Error("MATERIAL_CREATE_FAILED");
  return row;
}

export async function updateMaterial(
  materialId: string,
  input: UpdateMaterialInput,
  actorId?: string,
): Promise<MaterialMsgRecord> {
  const pool = getMysqlPool();
  const sets: string[] = ["update_user_id = ?", "update_time = NOW()"];
  const params: unknown[] = [actorId ?? null];

  if (input.materialName !== undefined) { sets.push("material_name = ?"); params.push(input.materialName); }
  if (input.materialPropId !== undefined) { sets.push("material_prop_id = ?"); params.push(input.materialPropId); }
  if (input.materialTypeId !== undefined) { sets.push("material_type_id = ?"); params.push(input.materialTypeId); }

  const existing = await getMaterialById(materialId);
  if (input.materialNum !== undefined) {
    sets.push("material_num = ?");
    params.push(input.materialNum);
  }
  if (input.mainPicUrl !== undefined) { sets.push("main_pic_url = ?"); params.push(input.mainPicUrl); }
  if (input.expPurpose !== undefined) { sets.push("exp_purpose = ?"); params.push(input.expPurpose); }
  if (input.additionalComments !== undefined) { sets.push("additional_comments = ?"); params.push(input.additionalComments); }
  if (input.comments !== undefined) { sets.push("comments = ?"); params.push(input.comments); }
  if (input.status !== undefined) { sets.push("status = ?"); params.push(input.status); }

  if (existing?.createUserId == null && actorId) {
    sets.push("create_user_id = ?");
    params.push(actorId);
  }

  await pool.query<ResultSetHeader>(
    `UPDATE material_msg SET ${sets.join(", ")} WHERE material_id = ? AND is_deleted = 0`,
    [...params, materialId],
  );
  const row = await getMaterialById(materialId);
  if (!row) throw new Error("MATERIAL_NOT_FOUND");
  return row;
}

export async function deleteMaterial(materialId: string, actorId?: string): Promise<void> {
  const pool = getMysqlPool();
  await pool.query(
    `UPDATE material_msg SET is_deleted = 1, update_user_id = ?, update_time = NOW()
     WHERE material_id = ? AND is_deleted = 0`,
    [actorId ?? null, materialId],
  );
}
