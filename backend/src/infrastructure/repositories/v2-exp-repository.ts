/**
 * V2 实验业务 MySQL 仓库
 * 对应表：exp_library / exp_msg / exp_step / exp_result / exp_material 等
 */
import type { PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { allocateUniqueMysqlVarchar32Id, resolveVarchar32PrimaryKey } from "../ids/identifiable-varchar32.ts";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import type {
  ExpLibraryRecord,
  ExpLibraryGradeRecord,
  ExpLibraryListQuery,
  CreateExpLibraryInput,
  PatchExpLibraryInput,
  ExpChooseType,
  ExpLibraryStatus,
  ExpMsgRecord,
  ExpMsgDetail,
  ExpMsgListQuery,
  CreateExpMsgInput,
  PatchExpMsgReviewInput,
  ExpStepRecord,
  ExperimentTaskInfo,
  ExpResultRecord,
  ExpMaterialRecord,
  ExpVideoRecord,
  ExpPicRecord,
  ExpReferenceRecord,
  ExpScientistRecord,
} from "../../domain/v2-exp/v2-exp-types.ts";

// ─── 行映射 ──────────────────────────────────────────────
function rowToLibraryGrade(row: RowDataPacket): ExpLibraryGradeRecord {
  return {
    seqId: String(row.seq_id),
    libExpId: String(row.lib_exp_id),
    gradeId: String(row.grade_id),
    sortOrder: row.sort_order != null ? Number(row.sort_order) : null,
  };
}

/**
 * 规整 PATCH：与 V2 表 `varchar(32)` / `varchar(200)` 对齐；前端空串视为清空外键或备注。
 * `gradeIds` 去重、去空白，与字典 id 等宽上限一致。
 */
function normalizePatchForExpLibrary(raw: PatchExpLibraryInput): PatchExpLibraryInput {
  const out: PatchExpLibraryInput = { ...raw };
  if (raw.libExpName !== undefined) {
    out.libExpName = String(raw.libExpName).trim().slice(0, 100);
  }
  if (raw.subjectId !== undefined) {
    if (raw.subjectId === null) out.subjectId = null;
    else {
      const t = String(raw.subjectId).trim();
      out.subjectId = t === "" ? null : t.slice(0, 32);
    }
  }
  if (raw.schoolLevelId !== undefined) {
    if (raw.schoolLevelId === null) out.schoolLevelId = null;
    else {
      const t = String(raw.schoolLevelId).trim();
      out.schoolLevelId = t === "" ? null : t.slice(0, 32);
    }
  }
  if (raw.comments !== undefined) {
    if (raw.comments === null) out.comments = null;
    else {
      const t = String(raw.comments).trim().slice(0, 200);
      out.comments = t === "" ? null : t;
    }
  }
  if (raw.gradeIds !== undefined) {
    const uniq = new Set<string>();
    for (const g of raw.gradeIds) {
      const id = String(g).trim().slice(0, 32);
      if (id) uniq.add(id);
    }
    out.gradeIds = [...uniq];
  }
  return out;
}

/** 仅主表 `exp_library` 业务列（不含审计列）；与 normalize 后结构对应。 */
function collectExpLibraryMainColumnSql(patch: PatchExpLibraryInput): { fragments: string[]; params: unknown[] } {
  const fragments: string[] = [];
  const params: unknown[] = [];
  if (patch.libExpName !== undefined) {
    fragments.push("lib_exp_name = ?");
    params.push(patch.libExpName);
  }
  if (patch.chooseType !== undefined) {
    fragments.push("choose_type = ?");
    params.push(patch.chooseType as ExpChooseType | null);
  }
  if (patch.subjectId !== undefined) {
    fragments.push("subject_id = ?");
    params.push(patch.subjectId);
  }
  if (patch.schoolLevelId !== undefined) {
    fragments.push("school_level_id = ?");
    params.push(patch.schoolLevelId);
  }
  if (patch.comments !== undefined) {
    fragments.push("comments = ?");
    params.push(patch.comments);
  }
  if (patch.status !== undefined) {
    fragments.push("status = ?");
    params.push(patch.status as ExpLibraryStatus);
  }
  return { fragments, params };
}

async function replaceExpLibraryGrades(conn: PoolConnection, libExpId: string, gradeIds: string[]): Promise<void> {
  await conn.query(`DELETE FROM exp_library_grade WHERE lib_exp_id = ?`, [libExpId]);
  for (const gradeId of gradeIds) {
    const seqId = await allocateUniqueMysqlVarchar32Id(conn, {
      table: "exp_library_grade",
      column: "seq_id",
      label: `${libExpId}_${gradeId}`,
    });
    await conn.query(
      `INSERT INTO exp_library_grade (seq_id, lib_exp_id, grade_id, sort_order) VALUES (?, ?, ?, NULL)`,
      [seqId, libExpId, gradeId],
    );
  }
}

async function listGradesForLibrary(pool: ReturnType<typeof getMysqlPool>, libExpId: string): Promise<ExpLibraryGradeRecord[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT seq_id, lib_exp_id, grade_id, sort_order FROM exp_library_grade
     WHERE lib_exp_id = ? ORDER BY sort_order ASC, grade_id ASC`,
    [libExpId],
  );
  return rows.map(rowToLibraryGrade);
}

/** 列表页批量加载 `exp_library_grade`，避免 N+1。 */
async function listGradesForLibraries(
  pool: ReturnType<typeof getMysqlPool>,
  libExpIds: string[],
): Promise<Map<string, ExpLibraryGradeRecord[]>> {
  const out = new Map<string, ExpLibraryGradeRecord[]>();
  if (libExpIds.length === 0) return out;
  const ph = libExpIds.map(() => "?").join(",");
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT seq_id, lib_exp_id, grade_id, sort_order FROM exp_library_grade
     WHERE lib_exp_id IN (${ph})
     ORDER BY lib_exp_id ASC, sort_order IS NULL, sort_order ASC, grade_id ASC`,
    libExpIds,
  );
  for (const r of rows as RowDataPacket[]) {
    const id = String(r.lib_exp_id);
    const rec = rowToLibraryGrade(r);
    const arr = out.get(id) ?? [];
    arr.push(rec);
    out.set(id, arr);
  }
  return out;
}

function rowToLibrary(row: RowDataPacket): ExpLibraryRecord {
  return {
    libExpId: String(row.lib_exp_id),
    libExpName: String(row.lib_exp_name ?? ""),
    chooseType: (row.choose_type as ExpLibraryRecord["chooseType"]) ?? null,
    subjectId: row.subject_id ? String(row.subject_id) : null,
    schoolLevelId: row.school_level_id ? String(row.school_level_id) : null,
    comments: row.comments ? String(row.comments) : null,
    status: (row.status as ExpLibraryRecord["status"]) ?? null,
    createUserId: row.create_user_id ? String(row.create_user_id) : null,
    displayOwnerName: row.display_owner_name ? String(row.display_owner_name) : null,
    createTime: row.create_time ? String(row.create_time) : null,
    updateUserId: row.update_user_id ? String(row.update_user_id) : null,
    updateTime: row.update_time ? String(row.update_time) : null,
    isDeleted: Number(row.is_deleted ?? 0) as 0 | 1,
  };
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
    rejectReason: row.confirm_comments != null ? String(row.confirm_comments) : null,
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

// ─── exp_library CRUD ────────────────────────────────────
export async function listExpLibrary(
  query: ExpLibraryListQuery,
): Promise<{ items: ExpLibraryRecord[]; total: number }> {
  const pool = getMysqlPool();
  const where: string[] = ["l.is_deleted = 0"];
  const params: unknown[] = [];

  if (query.keyword?.trim()) {
    const kw = `%${query.keyword.trim()}%`;
    where.push("(l.lib_exp_name LIKE ? OR l.lib_exp_id LIKE ? OR l.comments LIKE ?)");
    params.push(kw, kw, kw);
  }
  const subjectIds = (query.subjectIds ?? []).map((x) => String(x).trim()).filter(Boolean).slice(0, 40);
  if (subjectIds.length > 0) {
    where.push(`l.subject_id IN (${subjectIds.map(() => "?").join(",")})`);
    params.push(...subjectIds);
  } else if (query.subjectId) {
    where.push("l.subject_id = ?");
    params.push(query.subjectId);
  }
  const schoolLevelIds = (query.schoolLevelIds ?? []).map((x) => String(x).trim()).filter(Boolean).slice(0, 40);
  if (schoolLevelIds.length > 0) {
    where.push(`l.school_level_id IN (${schoolLevelIds.map(() => "?").join(",")})`);
    params.push(...schoolLevelIds);
  } else if (query.schoolLevelId) {
    where.push("l.school_level_id = ?");
    params.push(query.schoolLevelId);
  }
  if (query.chooseType) { where.push("l.choose_type = ?"); params.push(query.chooseType); }
  if (query.status) { where.push("l.status = ?"); params.push(query.status); }
  const gradeIds = (query.gradeIds ?? []).map((x) => String(x).trim()).filter(Boolean).slice(0, 40);
  if (gradeIds.length > 0) {
    const ph = gradeIds.map(() => "?").join(",");
    where.push(
      `EXISTS (SELECT 1 FROM exp_library_grade lg WHERE lg.lib_exp_id = l.lib_exp_id AND lg.grade_id IN (${ph}))`,
    );
    params.push(...gradeIds);
  } else if (query.gradeId) {
    where.push("EXISTS (SELECT 1 FROM exp_library_grade lg WHERE lg.lib_exp_id = l.lib_exp_id AND lg.grade_id = ?)");
    params.push(query.gradeId);
  }

  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, query.pageSize ?? 20);
  const whereSql = where.join(" AND ");

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM exp_library l WHERE ${whereSql}`, params,
  );
  const total = Number((countRows[0] as RowDataPacket).total ?? 0);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT l.*, owner.user_name AS display_owner_name
     FROM exp_library l
     LEFT JOIN sys_user owner ON owner.user_id = l.create_user_id
     WHERE ${whereSql}
     ORDER BY l.create_time DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize],
  );
  const bases = rows.map(rowToLibrary);
  const ids = bases.map((b) => b.libExpId);
  const gradeMap = await listGradesForLibraries(pool, ids);
  const items = bases.map((b) => ({ ...b, grades: gradeMap.get(b.libExpId) ?? [] }));
  return { items, total };
}

export async function getExpLibraryById(libExpId: string): Promise<ExpLibraryRecord | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT l.*, owner.user_name AS display_owner_name
     FROM exp_library l
     LEFT JOIN sys_user owner ON owner.user_id = l.create_user_id
     WHERE l.lib_exp_id = ? AND l.is_deleted = 0 LIMIT 1`, [libExpId],
  );
  if (rows.length === 0) return null;
  const base = rowToLibrary(rows[0]!);
  const grades = await listGradesForLibrary(pool, libExpId);
  return { ...base, grades };
}

/**
 * 部分更新标准试验库主行，并可整包替换 `exp_library_grade`。
 * 与 V2 约定：仅出现的键写入主表；`gradeIds` 出现则先删后插；主表审计列在任意子表或标量变更时刷新。
 */
export async function patchExpLibrary(
  libExpId: string,
  input: PatchExpLibraryInput,
  actorId?: string,
): Promise<ExpLibraryRecord> {
  const pool = getMysqlPool();
  const existing = await getExpLibraryById(libExpId);
  if (!existing) throw new Error("NOT_FOUND");

  const patch = normalizePatchForExpLibrary(input);
  if (patch.libExpName !== undefined && !String(patch.libExpName).trim()) {
    throw new Error("LIB_EXP_NAME_EMPTY");
  }

  const { fragments: mainFragments, params: mainParams } = collectExpLibraryMainColumnSql(patch);
  const hasScalarPatch = mainFragments.length > 0;
  const hasGradePatch = patch.gradeIds !== undefined;
  if (!hasScalarPatch && !hasGradePatch) {
    throw new Error("NO_FIELDS_TO_UPDATE");
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const auditFragments = ["update_user_id = ?", "update_time = NOW()"];
    const auditParams: unknown[] = [actorId ?? null];

    if (hasScalarPatch) {
      const setSql = [...mainFragments, ...auditFragments].join(", ");
      await conn.query<ResultSetHeader>(
        `UPDATE exp_library SET ${setSql} WHERE lib_exp_id = ? AND is_deleted = 0`,
        [...mainParams, ...auditParams, libExpId],
      );
    } else if (hasGradePatch) {
      await conn.query<ResultSetHeader>(
        `UPDATE exp_library SET ${auditFragments.join(", ")} WHERE lib_exp_id = ? AND is_deleted = 0`,
        [...auditParams, libExpId],
      );
    }

    if (hasGradePatch) {
      await replaceExpLibraryGrades(conn, libExpId, patch.gradeIds!);
    }

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  const row = await getExpLibraryById(libExpId);
  if (!row) throw new Error("NOT_FOUND_AFTER_PATCH");
  return row;
}

export async function createExpLibrary(
  input: CreateExpLibraryInput,
  actorId?: string,
): Promise<ExpLibraryRecord> {
  const pool = getMysqlPool();
  const libExpId = await resolveVarchar32PrimaryKey(pool, {
    table: "exp_library",
    column: "lib_exp_id",
    label: input.libExpName,
    explicit: input.libExpId,
  });
  await pool.query<ResultSetHeader>(
    `INSERT INTO exp_library
      (lib_exp_id, lib_exp_name, choose_type, subject_id, school_level_id, comments, status,
       create_user_id, create_time, update_user_id, update_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`,
    [
      libExpId, input.libExpName, input.chooseType ?? null,
      input.subjectId ?? null, input.schoolLevelId ?? null,
      input.comments ?? null, input.status ?? "t",
      actorId ?? null, actorId ?? null,
    ],
  );
  if (input.gradeIds?.length) {
    for (const gradeId of input.gradeIds) {
      const seqId = await allocateUniqueMysqlVarchar32Id(pool, {
        table: "exp_library_grade",
        column: "seq_id",
        label: `${libExpId}_${gradeId}`,
      });
      await pool.query(
        `INSERT INTO exp_library_grade (seq_id, lib_exp_id, grade_id) VALUES (?, ?, ?)`,
        [seqId, libExpId, gradeId],
      );
    }
  }
  const row = await getExpLibraryById(libExpId);
  if (!row) throw new Error("EXP_LIBRARY_CREATE_FAILED");
  return row;
}

// ─── exp_msg CRUD ────────────────────────────────────────
export async function listExpMsg(
  query: ExpMsgListQuery,
): Promise<{ items: ExpMsgRecord[]; total: number }> {
  const pool = getMysqlPool();
  const where: string[] = ["is_deleted = 0"];
  const params: unknown[] = [];

  if (query.keyword?.trim()) {
    where.push("exp_name LIKE ?"); params.push(`%${query.keyword.trim()}%`);
  }
  const subjectIds = (query.subjectIds ?? []).map((x) => String(x).trim()).filter(Boolean).slice(0, 32);
  if (subjectIds.length > 0) {
    where.push(`subject_id IN (${subjectIds.map(() => "?").join(",")})`);
    params.push(...subjectIds);
  } else if (query.subjectId) {
    where.push("subject_id = ?");
    params.push(query.subjectId);
  }
  const schoolLevelIds = (query.schoolLevelIds ?? []).map((x) => String(x).trim()).filter(Boolean).slice(0, 32);
  if (schoolLevelIds.length > 0) {
    where.push(`school_level_id IN (${schoolLevelIds.map(() => "?").join(",")})`);
    params.push(...schoolLevelIds);
  } else if (query.schoolLevelId) {
    where.push("school_level_id = ?");
    params.push(query.schoolLevelId);
  }
  const gradeIds = (query.gradeIds ?? []).map((x) => String(x).trim()).filter(Boolean).slice(0, 32);
  if (gradeIds.length > 0) {
    where.push(`grade_id IN (${gradeIds.map(() => "?").join(",")})`);
    params.push(...gradeIds);
  } else if (query.gradeId) {
    where.push("grade_id = ?");
    params.push(query.gradeId);
  }
  if (query.difficultyId) { where.push("difficulty_id = ?"); params.push(query.difficultyId); }
  if (query.status) { where.push("status = ?"); params.push(query.status); }
  if (query.createUserId) { where.push("create_user_id = ?"); params.push(query.createUserId); }
  if (query.expTaskType) { where.push("exp_task_type = ?"); params.push(query.expTaskType); }

  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, query.pageSize ?? 20);
  const whereSql = where.join(" AND ");

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM exp_msg WHERE ${whereSql}`, params,
  );
  const total = Number((countRows[0] as RowDataPacket).total ?? 0);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT p.*,
      owner.user_name AS display_owner_name,
      (SELECT ev.video_url FROM exp_video ev
       WHERE ev.exp_id = p.exp_id
       ORDER BY ev.sort_order IS NULL, ev.sort_order ASC, ev.seq_id ASC
       LIMIT 1) AS cover_video_url,
      t.task_id AS task_id,
      t.draft_id AS task_draft_id,
      t.target_class_id AS task_target_class_id,
      t.deadline AS task_deadline,
      t.requirement AS task_requirement,
      t.status AS task_status,
      t.created_at AS task_published_at,
      o.org_name AS task_target_class_name
     FROM (
       SELECT m.* FROM exp_msg m
       LEFT JOIN sys_user owner ON owner.user_id = m.create_user_id
       WHERE ${whereSql}
       ORDER BY m.create_time DESC LIMIT ? OFFSET ?
     ) AS p
     LEFT JOIN (
       SELECT t1.*
       FROM exp_course_task t1
       INNER JOIN (
         SELECT draft_id, MAX(created_at) AS max_created_at
         FROM exp_course_task
         WHERE is_deleted = 0
         GROUP BY draft_id
       ) mx ON mx.draft_id = t1.draft_id AND mx.max_created_at = t1.created_at
       WHERE t1.is_deleted = 0
     ) t ON t.draft_id = p.exp_id
     LEFT JOIN sys_org o ON o.org_id = t.target_class_id`,
    [...params, pageSize, (page - 1) * pageSize],
  );
  return { items: rows.map((row) => {
    const base = rowToExpMsg(row);
    const taskId = row.task_id ? String(row.task_id) : null;
    if (!taskId) return base;
    const taskInfo: ExperimentTaskInfo = {
      taskId,
      draftId: String(row.task_draft_id ?? base.expId),
      targetClassId: String(row.task_target_class_id ?? ""),
      targetClassName: row.task_target_class_name ? String(row.task_target_class_name) : null,
      status: (String(row.task_status ?? "") as ExperimentTaskInfo["status"]) || "unknown",
      publishedAt: row.task_published_at ? String(row.task_published_at) : null,
      deadline: row.task_deadline ? String(row.task_deadline) : null,
      requirement: row.task_requirement ? String(row.task_requirement) : null,
    };
    return { ...base, taskInfo };
  }), total };
}

export async function getExpMsgDetail(expId: string): Promise<ExpMsgDetail | null> {
  const pool = getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT m.*, owner.user_name AS display_owner_name
     FROM exp_msg m
     LEFT JOIN sys_user owner ON owner.user_id = m.create_user_id
     WHERE m.exp_id = ? AND m.is_deleted = 0 LIMIT 1`, [expId],
  );
  if (rows.length === 0) return null;
  const base = rowToExpMsg(rows[0]!);

  const [videos] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM exp_video WHERE exp_id = ? ORDER BY sort_order ASC`, [expId],
  );
  const [pics] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM exp_pic WHERE exp_id = ? ORDER BY sort_order ASC`, [expId],
  );
  const [materials] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM exp_material WHERE exp_id = ? ORDER BY sort_order ASC`, [expId],
  );
  const [steps] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM exp_step WHERE exp_id = ? ORDER BY sort_order ASC`, [expId],
  );
  const [results] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM exp_result WHERE exp_id = ? ORDER BY sort_order ASC`, [expId],
  );
  const [refs] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM exp_reference WHERE exp_id = ? ORDER BY sort_order ASC`, [expId],
  );
  const [scientists] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM exp_scientist WHERE exp_id = ? ORDER BY sort_order ASC`, [expId],
  );

  return {
    ...base,
    videos: (videos as RowDataPacket[]).map((r) => ({
      seqId: String(r.seq_id), videoUrl: r.video_url ? String(r.video_url) : null,
      expId: String(r.exp_id), sortOrder: r.sort_order != null ? Number(r.sort_order) : null,
      fileId: r.file_id ? String(r.file_id) : null,
    } as ExpVideoRecord)),
    pics: (pics as RowDataPacket[]).map((r) => ({
      seqId: String(r.seq_id), picUrl: r.pic_url ? String(r.pic_url) : null,
      expId: String(r.exp_id), sortOrder: r.sort_order != null ? Number(r.sort_order) : null,
      fileId: r.file_id ? String(r.file_id) : null,
    } as ExpPicRecord)),
    materials: (materials as RowDataPacket[]).map((r) => ({
      expMaterialId: String(r.exp_material_id), expId: String(r.exp_id),
      materialId: r.material_id ? String(r.material_id) : null,
      materialName: r.material_name ? String(r.material_name) : null,
      isSelf: String(r.is_self ?? "n") as "y" | "n",
      materialNum: r.material_num != null ? Number(r.material_num) : null,
      materialUnit: r.material_unit ? String(r.material_unit) : null,
      materialPropId: r.material_prop_id ? String(r.material_prop_id) : null,
      materialTypeId: r.material_type_id ? String(r.material_type_id) : null,
      mainPicUrl: r.main_pic_url ? String(r.main_pic_url) : null,
      expPurpose: r.exp_purpose ? String(r.exp_purpose) : null,
      additionalComments: r.additional_comments ? String(r.additional_comments) : null,
      comments: r.comments ? String(r.comments) : null,
      sortOrder: r.sort_order != null ? Number(r.sort_order) : null,
      createTime: r.create_time ? String(r.create_time) : null,
    } as ExpMaterialRecord)),
    steps: (steps as RowDataPacket[]).map((r) => ({
      stepId: String(r.step_id), expId: String(r.exp_id),
      stepName: r.step_name ? String(r.step_name) : null,
      stepComments: r.step_comments ? String(r.step_comments) : null,
      sortOrder: r.sort_order != null ? Number(r.sort_order) : null,
    } as ExpStepRecord)),
    results: (results as RowDataPacket[]).map((r) => ({
      resultId: String(r.result_id), expId: String(r.exp_id),
      resultName: r.result_name ? String(r.result_name) : null,
      resultComments: r.result_comments ? String(r.result_comments) : null,
      sortOrder: r.sort_order != null ? Number(r.sort_order) : null,
    } as ExpResultRecord)),
    references: (refs as RowDataPacket[]).map((r) => ({
      seqId: String(r.seq_id), expId: String(r.exp_id),
      referenceName: r.reference_name ? String(r.reference_name) : null,
      referenceSource: r.reference_source ? String(r.reference_source) : null,
      referenceComments: r.reference_comments ? String(r.reference_comments) : null,
      sortOrder: r.sort_order != null ? Number(r.sort_order) : null,
    } as ExpReferenceRecord)),
    scientists: (scientists as RowDataPacket[]).map((r) => ({
      seqId: String(r.seq_id), expId: String(r.exp_id),
      scientistName: r.scientist_name ? String(r.scientist_name) : null,
      storyName: r.story_name ? String(r.story_name) : null,
      storyComments: r.story_comments ? String(r.story_comments) : null,
      sortOrder: r.sort_order != null ? Number(r.sort_order) : null,
    } as ExpScientistRecord)),
  };
}

export async function createExpMsg(
  input: CreateExpMsgInput,
  actorId?: string,
): Promise<ExpMsgRecord> {
  const pool = getMysqlPool();
  const expId = await resolveVarchar32PrimaryKey(pool, {
    table: "exp_msg",
    column: "exp_id",
    label: input.expName,
    explicit: input.expId,
  });
  await pool.query<ResultSetHeader>(
    `INSERT INTO exp_msg
      (exp_id, exp_name, choose_type, subject_id, school_level_id, grade_id,
       difficulty_id, exp_principle, exp_caution, exp_danger, class_hour,
       coursebook_id, unit_id, create_user_type, create_user_id, create_time,
       status, standard_exp_id, exp_task_type, simulator_url,
       update_user_id, update_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, NOW())`,
    [
      expId, input.expName, input.chooseType ?? null,
      input.subjectId ?? null, input.schoolLevelId ?? null, input.gradeId ?? null,
      input.difficultyId ?? null, input.expPrinciple ?? null,
      input.expCaution ?? null, input.expDanger ?? null, input.classHour ?? null,
      input.coursebookId ?? null, input.unitId ?? null,
      input.createUserType ?? "Teacher", actorId ?? null,
      "t",
      input.standardExpId ?? null, input.expTaskType ?? null,
      input.simulatorUrl ?? null, actorId ?? null,
    ],
  );
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT m.*, owner.user_name AS display_owner_name
     FROM exp_msg m
     LEFT JOIN sys_user owner ON owner.user_id = m.create_user_id
     WHERE m.exp_id = ? LIMIT 1`, [expId],
  );
  if (rows.length === 0) throw new Error("EXP_MSG_CREATE_FAILED");
  return rowToExpMsg(rows[0]!);
}

/**
 * 教研评审：仅 `status = t` 的试验可更新为 `y`/`n`，并写入审核人、时间、意见与驳回长文。
 */
export async function patchExpMsgForReview(
  expId: string,
  input: PatchExpMsgReviewInput,
  actorId?: string,
): Promise<ExpMsgRecord> {
  const pool = getMysqlPool();
  const [curRows] = await pool.query<RowDataPacket[]>(
    `SELECT exp_id, status FROM exp_msg WHERE exp_id = ? AND is_deleted = 0 LIMIT 1`,
    [expId],
  );
  if (curRows.length === 0) throw new Error("NOT_FOUND");
  const curStatus = curRows[0]!.status != null ? String(curRows[0]!.status) : null;
  if (curStatus !== "t") throw new Error("NOT_PENDING_REVIEW");

  const rawConfirm =
    input.confirm_comments != null ? String(input.confirm_comments).trim().slice(0, 200) : "";

  if (input.status === "n" && rawConfirm.length < 4) {
    throw new Error("REJECT_REASON_TOO_SHORT");
  }

  const confirmCommentsDb = rawConfirm.length > 0 ? rawConfirm : null;

  const [hdr] = await pool.query<ResultSetHeader>(
    `UPDATE exp_msg SET
       status = ?,
       confirm_user_id = ?,
       confirm_time = NOW(),
       confirm_comments = ?,
       update_user_id = ?,
       update_time = NOW()
     WHERE exp_id = ? AND is_deleted = 0 AND status = 't'`,
    [input.status, actorId ?? null, confirmCommentsDb, actorId ?? null, expId],
  );
  if (hdr.affectedRows === 0) throw new Error("NOT_PENDING_REVIEW");

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT m.*, owner.user_name AS display_owner_name
     FROM exp_msg m
     LEFT JOIN sys_user owner ON owner.user_id = m.create_user_id
     WHERE m.exp_id = ? AND m.is_deleted = 0 LIMIT 1`,
    [expId],
  );
  if (rows.length === 0) throw new Error("NOT_FOUND_AFTER_PATCH");
  return rowToExpMsg(rows[0]!);
}

/**
 * 查询学生作品列表（审核工作台专用，只含 create_user_type = 'Student' 的记录）。
 * 含分页，默认按创建时间降序。
 */
export async function listStudentWorksForReview(page = 1, pageSize = 20): Promise<{ items: ExpMsgRecord[]; total: number; page: number; pageSize: number }> {
  const pool = getMysqlPool();
  const where = "e.is_deleted = 0 AND e.create_user_type = 'Student'";
  const [cnt] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM exp_msg e WHERE ${where}`, []);
  const total = Number(cnt[0]?.total ?? 0);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT e.*, owner.user_name AS display_owner_name
     FROM exp_msg e
     LEFT JOIN sys_user owner ON owner.user_id = e.create_user_id
     WHERE ${where}
     ORDER BY e.create_time DESC, e.exp_id DESC
     LIMIT ? OFFSET ?`,
    [pageSize, (page - 1) * pageSize],
  );
  return { items: rows.map(rowToExpMsg), total, page, pageSize };
}
