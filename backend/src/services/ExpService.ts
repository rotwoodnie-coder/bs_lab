import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { randomBytes } from "node:crypto";
import { getMysqlPool } from "../infrastructure/mysql/mysql-client.ts";
import { resolveVarchar32PrimaryKey } from "../infrastructure/ids/identifiable-varchar32.ts";
import { sanitizeAndNormalizeRichText } from "../utils/text.ts";
import { presignPublicUrl } from "../infrastructure/storage/s3-storage.ts";
import type {
  ExpMsgDetail,
  ExpMsgListQuery,
  ExpMsgRecord,
  ExpMaterialRecord,
  ExpStepRecord,
  ExpResultRecord,
  ExpReferenceRecord,
  ExpScientistRecord,
  ExpVideoRecord,
  ExpPicRecord,
  CreateExpMsgInput,
  PutExpMsgDraftInput,
} from "../domain/v2-exp/v2-exp-types.ts";

export type ServiceErrorCode = "CONTENT_TOO_LONG" | "EXP_NAME_EMPTY" | "NOT_FOUND" | "INTERNAL_ERROR";

export class ServiceError extends Error {
  code: ServiceErrorCode;
  constructor(code: ServiceErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export function makeVarchar32Uuid(): string {
  return randomBytes(16).toString("hex");
}

function rowToExpMsg(row: RowDataPacket): ExpMsgRecord {
  return {
    expId: String(row.exp_id),
    expName: String(row.exp_name ?? ""),
    chooseType: (row.choose_type as ExpMsgRecord["chooseType"]) ?? null,
    subjectId: row.subject_id ? String(row.subject_id) : null,
    schoolLevelId: row.school_level_id ? String(row.school_level_id) : null,
    gradeId: row.grade_id ? String(row.grade_id) : null,
    difficultyId: row.difficulty_id ? String(row.difficulty_id) : null,
    expPrinciple: row.exp_principle ? String(row.exp_principle) : null,
    expCaution: row.exp_caution ? String(row.exp_caution) : null,
    expDanger: row.exp_danger ? String(row.exp_danger) : null,
    classHour: row.class_hour != null ? Number(row.class_hour) : null,
    coursebookId: row.coursebook_id ? String(row.coursebook_id) : null,
    unitId: row.unit_id ? String(row.unit_id) : null,
    createUserType: (row.create_user_type as ExpMsgRecord["createUserType"]) ?? null,
    createUserId: row.create_user_id ? String(row.create_user_id) : null,
    displayOwnerName: row.display_owner_name ? String(row.display_owner_name) : null,
    createTime: row.create_time ? String(row.create_time) : null,
    confirmUserId: row.confirm_user_id ? String(row.confirm_user_id) : null,
    confirmTime: row.confirm_time ? String(row.confirm_time) : null,
    confirmComments: row.confirm_comments ? String(row.confirm_comments) : null,
    rejectReason: row.reject_reason != null ? String(row.reject_reason) : null,
    status: (row.status as ExpMsgRecord["status"]) ?? null,
    standardExpId: row.standard_exp_id ? String(row.standard_exp_id) : null,
    linkExpId: row.link_exp_id ? String(row.link_exp_id) : null,
    expTaskType: (row.exp_task_type as ExpMsgRecord["expTaskType"]) ?? null,
    likeNum: Number(row.like_num ?? 0),
    notlikeNum: Number(row.notlike_num ?? 0),
    collectionNum: Number(row.collection_num ?? 0),
    evaluateNum: Number(row.evaluate_num ?? 0),
    simulatorUrl: row.simulator_url ? String(row.simulator_url) : null,
    logoUrl: row.logo_url != null ? String(row.logo_url) : null,
    coverVideoUrl: row.cover_video_url != null ? String(row.cover_video_url) : null,
    updateUserId: row.update_user_id ? String(row.update_user_id) : null,
    updateTime: row.update_time ? String(row.update_time) : null,
    isDeleted: Number(row.is_deleted ?? 0) as 0 | 1,
  };
}

function normalizeText(input: unknown, maxLen: number, fieldName: string): string | null {
  if (input === undefined || input === null) return null;
  const text = String(input).replace(/\r\n/g, "\n").trim();
  if (!text) return null;
  if (text.length > maxLen) {
    if (fieldName === "exp_name") throw new ServiceError("EXP_NAME_EMPTY", "实验名称不能为空");
    throw new ServiceError("CONTENT_TOO_LONG", "实验步骤内容过长");
  }
  return text;
}

export function normalizeStepComments(rawHtml: unknown): string | null {
  const s = sanitizeAndNormalizeRichText(rawHtml, 2000);
  if (s === null) return null;
  if (s.length > 2000) throw new ServiceError("CONTENT_TOO_LONG", "实验步骤内容过长");
  return s;
}

export function __testNormalizeStepCommentsForLongHtmlCase(): boolean {
  const longHtml = `<p>${"x".repeat(2001)}</p>`;
  try {
    normalizeStepComments(longHtml);
    return false;
  } catch (err) {
    return err instanceof ServiceError && err.code === "CONTENT_TOO_LONG";
  }
}

async function replaceSteps(conn: PoolConnection, expId: string, steps: Array<{ step_name?: string | null; step_comments?: string | null; sort_order?: number | null }>) {
  await conn.query("DELETE FROM exp_step WHERE exp_id = ?", [expId]);
  for (const step of steps ?? []) {
    const stepId = makeVarchar32Uuid();
    await conn.query(
      `INSERT INTO exp_step (step_id, exp_id, step_name, step_comments, sort_order)
       VALUES (?, ?, ?, ?, ?)` ,
      [stepId, expId, step.step_name ?? null, normalizeStepComments(step.step_comments), step.sort_order ?? null],
    );
  }
}

async function replaceMaterials(conn: PoolConnection, expId: string, materials: Array<{ material_id?: string | null; material_name?: string | null; is_self?: "y" | "n"; material_num?: number | null; material_unit?: string | null; material_prop_id?: string | null; material_type_id?: string | null; main_pic_url?: string | null; exp_purpose?: string | null; additional_comments?: string | null; comments?: string | null; sort_order?: number | null }>) {
  await conn.query("DELETE FROM exp_material WHERE exp_id = ?", [expId]);
  for (const m of materials ?? []) {
    const expMaterialId = makeVarchar32Uuid();
    await conn.query(
      `INSERT INTO exp_material
       (exp_material_id, exp_id, material_id, material_name, is_self, material_num, material_unit, material_prop_id, material_type_id, main_pic_url, exp_purpose, additional_comments, comments, sort_order, create_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        expMaterialId, expId, m.material_id ?? null, m.material_name ?? null, m.is_self ?? "n",
        m.material_num ?? null, m.material_unit ?? null, m.material_prop_id ?? null, m.material_type_id ?? null,
        m.main_pic_url ?? null, m.exp_purpose ?? null, m.additional_comments ?? null, m.comments ?? null, m.sort_order ?? null,
      ],
    );
  }
}

// 注：对 ExpMsgRecord 中所有 URL 字段做预签名（simulatorUrl / logoUrl / coverVideoUrl）
async function presignExpMsgRecord<T extends ExpMsgRecord>(rec: T): Promise<T> {
  const [simulatorUrl, logoUrl, coverVideoUrl] = await Promise.all([
    presignPublicUrl(rec.simulatorUrl, 3600),
    presignPublicUrl(rec.logoUrl, 3600),
    presignPublicUrl(rec.coverVideoUrl, 3600),
  ]);
  return { ...rec, simulatorUrl, logoUrl, coverVideoUrl };
}

// 注：对 ExpMsgDetail 中所有子记录 URL 字段预签名（videoUrl / picUrl / mainPicUrl）
async function presignExpDetail(detail: ExpMsgDetail): Promise<ExpMsgDetail> {
  const presigned = await presignExpMsgRecord(detail);
  const [videos, pics, materials] = await Promise.all([
    Promise.all(
      presigned.videos.map(async (v) => ({ ...v, videoUrl: await presignPublicUrl(v.videoUrl, 3600) })),
    ),
    Promise.all(
      presigned.pics.map(async (p) => ({ ...p, picUrl: await presignPublicUrl(p.picUrl, 3600) })),
    ),
    Promise.all(
      presigned.materials.map(async (m) => ({ ...m, mainPicUrl: await presignPublicUrl(m.mainPicUrl, 3600) })),
    ),
  ]);
  return { ...presigned, videos, pics, materials };
}

export async function getExpDetail(
  connOrPool: Pool | PoolConnection,
  expId: string,
  options?: { presign?: boolean },
): Promise<ExpMsgDetail | null> {
  const runner = "query" in connOrPool ? connOrPool : getMysqlPool();
  const [rows] = await runner.query<RowDataPacket[]>(
    `SELECT m.*, owner.user_name AS display_owner_name
     FROM exp_msg m
     LEFT JOIN sys_user owner ON owner.user_id = m.create_user_id
     WHERE m.exp_id = ? AND m.is_deleted = 0 LIMIT 1`, [expId]);
  if (rows.length === 0) return null;
  const base = rowToExpMsg(rows[0]!);

  const [videos] = await runner.query<RowDataPacket[]>(`SELECT * FROM exp_video WHERE exp_id = ? ORDER BY sort_order ASC, seq_id ASC`, [expId]);
  const [pics] = await runner.query<RowDataPacket[]>(`SELECT * FROM exp_pic WHERE exp_id = ? ORDER BY sort_order ASC, seq_id ASC`, [expId]);
  const [materials] = await runner.query<RowDataPacket[]>(`SELECT * FROM exp_material WHERE exp_id = ? ORDER BY sort_order ASC, exp_material_id ASC`, [expId]);
  const [steps] = await runner.query<RowDataPacket[]>(`SELECT * FROM exp_step WHERE exp_id = ? ORDER BY sort_order ASC, step_id ASC`, [expId]);
  const [results] = await runner.query<RowDataPacket[]>(`SELECT * FROM exp_result WHERE exp_id = ? ORDER BY sort_order ASC, result_id ASC`, [expId]);
  const [refs] = await runner.query<RowDataPacket[]>(`SELECT * FROM exp_reference WHERE exp_id = ? ORDER BY sort_order ASC, seq_id ASC`, [expId]);
  const [scientists] = await runner.query<RowDataPacket[]>(`SELECT * FROM exp_scientist WHERE exp_id = ? ORDER BY sort_order ASC, seq_id ASC`, [expId]);

  const detail: ExpMsgDetail = {
    ...base,
    videos: (videos as RowDataPacket[]).map((r) => ({ seqId: String(r.seq_id), videoUrl: r.video_url ? String(r.video_url) : null, expId: String(r.exp_id), sortOrder: r.sort_order != null ? Number(r.sort_order) : null, fileId: r.file_id ? String(r.file_id) : null } as ExpVideoRecord)),
    pics: (pics as RowDataPacket[]).map((r) => ({ seqId: String(r.seq_id), picUrl: r.pic_url ? String(r.pic_url) : null, expId: String(r.exp_id), sortOrder: r.sort_order != null ? Number(r.sort_order) : null, fileId: r.file_id ? String(r.file_id) : null } as ExpPicRecord)),
    materials: (materials as RowDataPacket[]).map((r) => ({ expMaterialId: String(r.exp_material_id), expId: String(r.exp_id), materialId: r.material_id ? String(r.material_id) : null, materialName: r.material_name ? String(r.material_name) : null, isSelf: String(r.is_self ?? "n") as "y" | "n", materialNum: r.material_num != null ? Number(r.material_num) : null, materialUnit: r.material_unit ? String(r.material_unit) : null, materialPropId: r.material_prop_id ? String(r.material_prop_id) : null, materialTypeId: r.material_type_id ? String(r.material_type_id) : null, mainPicUrl: r.main_pic_url ? String(r.main_pic_url) : null, expPurpose: r.exp_purpose ? String(r.exp_purpose) : null, additionalComments: r.additional_comments ? String(r.additional_comments) : null, comments: r.comments ? String(r.comments) : null, sortOrder: r.sort_order != null ? Number(r.sort_order) : null, createTime: r.create_time ? String(r.create_time) : null } as ExpMaterialRecord)),
    steps: (steps as RowDataPacket[]).map((r) => ({ stepId: String(r.step_id), expId: String(r.exp_id), stepName: r.step_name ? String(r.step_name) : null, stepComments: r.step_comments ? String(r.step_comments) : null, sortOrder: r.sort_order != null ? Number(r.sort_order) : null } as ExpStepRecord)),
    results: (results as RowDataPacket[]).map((r) => ({ resultId: String(r.result_id), expId: String(r.exp_id), resultName: r.result_name ? String(r.result_name) : null, resultComments: r.result_comments ? String(r.result_comments) : null, sortOrder: r.sort_order != null ? Number(r.sort_order) : null } as ExpResultRecord)),
    references: (refs as RowDataPacket[]).map((r) => ({ seqId: String(r.seq_id), expId: String(r.exp_id), referenceName: r.reference_name ? String(r.reference_name) : null, referenceSource: r.reference_source ? String(r.reference_source) : null, referenceComments: r.reference_comments ? String(r.reference_comments) : null, sortOrder: r.sort_order != null ? Number(r.sort_order) : null } as ExpReferenceRecord)),
    scientists: (scientists as RowDataPacket[]).map((r) => ({ seqId: String(r.seq_id), expId: String(r.exp_id), scientistName: r.scientist_name ? String(r.scientist_name) : null, storyName: r.story_name ? String(r.story_name) : null, storyComments: r.story_comments ? String(r.story_comments) : null, sortOrder: r.sort_order != null ? Number(r.sort_order) : null } as ExpScientistRecord)),
  };

  if (options?.presign !== false) {
    return presignExpDetail(detail);
  }
  return detail;
}

export async function getExpList(query: ExpMsgListQuery) {
  const pool = getMysqlPool();
  const where = ["e.is_deleted = 0"];
  const params: unknown[] = [];
  if (query.keyword?.trim()) { where.push("e.exp_name LIKE ?"); params.push(`%${query.keyword.trim()}%`); }
  if (query.subjectId) { where.push("e.subject_id = ?"); params.push(query.subjectId); }
  if (query.schoolLevelId) { where.push("e.school_level_id = ?"); params.push(query.schoolLevelId); }
  if (query.gradeId) { where.push("e.grade_id = ?"); params.push(query.gradeId); }
  if (query.difficultyId) { where.push("e.difficulty_id = ?"); params.push(query.difficultyId); }
  if (query.status) { where.push("e.status = ?"); params.push(query.status); }
  if (query.createUserId) { where.push("e.create_user_id = ?"); params.push(query.createUserId); }
  if (query.createUserType) { where.push("e.create_user_type = ?"); params.push(query.createUserType); }
  if (query.expTaskType) { where.push("e.exp_task_type = ?"); params.push(query.expTaskType); }
  if (query.unitId) { where.push("e.unit_id = ?"); params.push(query.unitId); }
  if (query.chapterId) { where.push("e.unit_id IN (SELECT unit_id FROM data_coursebook_unit WHERE chapter_id = ?)"); params.push(query.chapterId); }
  if (query.coursebookId) { where.push("e.coursebook_id = ?"); params.push(query.coursebookId); }
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, query.pageSize ?? 20);
  const [cnt] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM exp_msg e WHERE ${where.join(" AND ")}`, params);
  const total = Number(cnt[0]?.total ?? 0);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT e.exp_id, e.exp_name, e.class_hour, e.status, e.create_time, e.exp_principle,
            e.unit_id, e.coursebook_id, e.create_user_id,
            e.choose_type, e.difficulty_id, e.exp_caution, e.exp_danger,
            e.standard_exp_id, e.link_exp_id, e.exp_task_type,
            e.like_num, e.notlike_num, e.collection_num, e.evaluate_num,
            e.confirm_user_id, e.confirm_time, e.confirm_comments, e.reject_reason,
            e.update_user_id, e.update_time,
            e.logo_url, e.cover_video_url, e.simulator_url,
            owner.user_name AS display_owner_name,
            s.subject_name AS subject_name, g.grade_name AS grade_name,
            c.coursebook_name AS coursebook_name, ch.chapter_name AS chapter_name, u.unit_name AS unit_name
     FROM exp_msg e
     LEFT JOIN sys_user owner ON owner.user_id = e.create_user_id
     LEFT JOIN data_school_subject s ON s.subject_id = e.subject_id
     LEFT JOIN data_school_grade g ON g.grade_id = e.grade_id
     LEFT JOIN data_coursebook c ON c.coursebook_id = e.coursebook_id
     LEFT JOIN data_coursebook_unit u ON u.unit_id = e.unit_id
     LEFT JOIN data_coursebook_chapter ch ON ch.chapter_id = u.chapter_id
     WHERE ${where.join(" AND ")}
     ORDER BY e.create_time DESC, e.exp_id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize],
  );
  const items = rows.map(rowToExpMsg);
  const presignedItems = await Promise.all(items.map((item) => presignExpMsgRecord(item)));
  return { items: presignedItems, total, page, pageSize };
}

/** 将实验挂载到教材小节（或取消挂载）。unitId 为 null 时视为解除绑定。 */
export async function bindExpToUnit(expId: string, unitId: string | null, coursebookId: string | null, actorId?: string): Promise<void> {
  const pool = getMysqlPool();
  await pool.query<ResultSetHeader>(
    `UPDATE exp_msg SET unit_id = ?, coursebook_id = ?, update_user_id = ?, update_time = NOW() WHERE exp_id = ? AND is_deleted = 0`,
    [unitId, coursebookId, actorId ?? null, expId],
  );
}

export async function saveExp(input: (CreateExpMsgInput | PutExpMsgDraftInput) & { expId?: string }, actorId?: string) {
  const pool = getMysqlPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const expName = normalizeText(("expName" in input ? input.expName : input.exp_name ?? ""), 100, "exp_name") ?? "";
    if (!expName) throw new ServiceError("EXP_NAME_EMPTY", "实验名称不能为空");
    const expId = await resolveVarchar32PrimaryKey(conn, { table: "exp_msg", column: "exp_id", label: expName, explicit: input.expId });
    const existing = await conn.query<RowDataPacket[]>(`SELECT exp_id FROM exp_msg WHERE exp_id = ? LIMIT 1`, [expId]);
    const isUpdate = existing[0].length > 0;
    const ownerUserId = actorId ?? null;

    if (isUpdate) {
      await conn.query<ResultSetHeader>(
        `UPDATE exp_msg SET exp_name = ?, choose_type = ?, subject_id = ?, school_level_id = ?, grade_id = ?, difficulty_id = ?, exp_principle = ?, exp_caution = ?, exp_danger = ?, class_hour = ?, coursebook_id = ?, unit_id = ?, create_user_id = COALESCE(create_user_id, ?), update_user_id = ?, update_time = NOW(), status = COALESCE(status, 't') WHERE exp_id = ? AND is_deleted = 0`,
        [expName, (input as any).chooseType ?? (input as any).choose_type ?? null, (input as any).subjectId ?? (input as any).subject_id ?? null, (input as any).schoolLevelId ?? (input as any).school_level_id ?? null, (input as any).gradeId ?? (input as any).grade_id ?? null, (input as any).difficultyId ?? (input as any).difficulty_id ?? null, (input as any).expPrinciple ?? (input as any).exp_principle ?? null, (input as any).expCaution ?? (input as any).exp_caution ?? null, (input as any).expDanger ?? (input as any).exp_danger ?? null, (input as any).classHour ?? (input as any).class_hour ?? null, (input as any).coursebookId ?? (input as any).coursebook_id ?? null, (input as any).unitId ?? (input as any).unit_id ?? null, ownerUserId, ownerUserId, expId],
      );
    } else {
      await conn.query<ResultSetHeader>(
        `INSERT INTO exp_msg (exp_id, exp_name, choose_type, subject_id, school_level_id, grade_id, difficulty_id, exp_principle, exp_caution, exp_danger, class_hour, coursebook_id, unit_id, create_user_type, create_user_id, create_time, status, standard_exp_id, exp_task_type, simulator_url, update_user_id, update_time, is_deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 't', ?, ?, ?, ?, ?, NOW(), 0)`,
        [expId, expName, (input as any).chooseType ?? (input as any).choose_type ?? null, (input as any).subjectId ?? (input as any).subject_id ?? null, (input as any).schoolLevelId ?? (input as any).school_level_id ?? null, (input as any).gradeId ?? (input as any).grade_id ?? null, (input as any).difficultyId ?? (input as any).difficulty_id ?? null, (input as any).expPrinciple ?? (input as any).exp_principle ?? null, (input as any).expCaution ?? (input as any).exp_caution ?? null, (input as any).expDanger ?? (input as any).exp_danger ?? null, (input as any).classHour ?? (input as any).class_hour ?? null, (input as any).coursebookId ?? (input as any).coursebook_id ?? null, (input as any).unitId ?? (input as any).unit_id ?? null, (input as any).createUserType ?? null, ownerUserId, (input as any).standardExpId ?? (input as any).standard_exp_id ?? null, (input as any).expTaskType ?? (input as any).exp_task_type ?? null, (input as any).simulatorUrl ?? (input as any).simulator_url ?? null, ownerUserId],
      );
    }

    if ("steps" in input && input.steps !== undefined) await replaceSteps(conn, expId, input.steps as any);
    if ("materials" in input && input.materials !== undefined) await replaceMaterials(conn, expId, input.materials as any);

    await conn.commit();
    const detail = await getExpDetail(pool, expId);
    if (!detail) throw new Error("NOT_FOUND_AFTER_SAVE");
    return detail;
  } catch (err) {
    await conn.rollback();
    if (err instanceof ServiceError) throw err;
    throw new ServiceError("INTERNAL_ERROR", err instanceof Error ? err.message : String(err));
  } finally {
    conn.release();
  }
}

/** 实验列表聚合统计（按学科/年级分组计数），用于学科树显示各级统计数字 */
export async function getExpStats(): Promise<{
  total: number;
  bySubject: Record<string, number>;
  byGradeSubject: Record<string, number>;
}> {
  const pool = getMysqlPool();
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM exp_msg WHERE is_deleted = 0`,
  );
  const total = Number(countRows[0]?.total ?? 0);

  const [subjectRows] = await pool.query<RowDataPacket[]>(
    `SELECT subject_id, COUNT(*) AS cnt FROM exp_msg WHERE is_deleted = 0 AND subject_id IS NOT NULL AND subject_id <> '' GROUP BY subject_id`,
  );
  const bySubject: Record<string, number> = {};
  for (const r of subjectRows) {
    if (r.subject_id) bySubject[String(r.subject_id)] = Number(r.cnt ?? 0);
  }

  const [gradeSubjectRows] = await pool.query<RowDataPacket[]>(
    `SELECT subject_id, grade_id, COUNT(*) AS cnt FROM exp_msg WHERE is_deleted = 0 AND subject_id IS NOT NULL AND subject_id <> '' GROUP BY subject_id, grade_id`,
  );
  const byGradeSubject: Record<string, number> = {};
  for (const r of gradeSubjectRows) {
    if (r.subject_id && r.grade_id) {
      const key = `${String(r.subject_id)}::${String(r.grade_id)}`;
      byGradeSubject[key] = Number(r.cnt ?? 0);
    }
  }

  return { total, bySubject, byGradeSubject };
}
