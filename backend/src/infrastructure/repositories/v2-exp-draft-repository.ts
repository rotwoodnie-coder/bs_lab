/**
 * 教师实验草稿整包写入（主表 + 子表），与 `PUT /v2/exp/:id/draft` 对齐。
 */
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { allocateUniqueMysqlVarchar32Id } from "../ids/identifiable-varchar32.ts";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import type { PutExpMsgDraftInput, ExpMsgRecord } from "../../domain/v2-exp/v2-exp-types.ts";

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

function trimOrNull(v: string | null | undefined, max: number): string | null {
  if (v === undefined || v === null) return null;
  const t = String(v).trim();
  if (!t) return null;
  return t.slice(0, max);
}

function trimOrEmpty(v: string | null | undefined, max: number): string {
  return String(v ?? "").trim().slice(0, max);
}

async function replaceMaterials(
  conn: PoolConnection,
  expId: string,
  rows: NonNullable<PutExpMsgDraftInput["materials"]>,
): Promise<void> {
  await conn.query<ResultSetHeader>(`DELETE FROM exp_material WHERE exp_id = ?`, [expId]);
  let i = 0;
  for (const m of rows) {
    const expMaterialId = await allocateUniqueMysqlVarchar32Id(conn, {
      table: "exp_material",
      column: "exp_material_id",
      label: `${expId}_mat_${i}`,
    });
    const isSelf = m.is_self === "n" ? "n" : "y";
    await conn.query<ResultSetHeader>(
      `INSERT INTO exp_material (
        exp_material_id, exp_id, material_id, material_name, is_self,
        material_num, material_unit, material_prop_id, material_type_id,
        main_pic_url, exp_purpose, additional_comments, comments, sort_order, create_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        expMaterialId,
        expId,
        m.material_id != null && String(m.material_id).trim() ? String(m.material_id).trim().slice(0, 32) : null,
        trimOrNull(m.material_name ?? undefined, 60),
        isSelf,
        m.material_num != null && !Number.isNaN(Number(m.material_num)) ? Number(m.material_num) : null,
        trimOrNull(m.material_unit ?? undefined, 32),
        m.material_prop_id != null && String(m.material_prop_id).trim()
          ? String(m.material_prop_id).trim().slice(0, 32)
          : null,
        m.material_type_id != null && String(m.material_type_id).trim()
          ? String(m.material_type_id).trim().slice(0, 32)
          : null,
        trimOrNull(m.main_pic_url ?? undefined, 200),
        trimOrNull(m.exp_purpose ?? undefined, 200),
        trimOrNull(m.additional_comments ?? undefined, 200),
        trimOrNull(m.comments ?? undefined, 200),
        m.sort_order != null ? Number(m.sort_order) : i,
      ],
    );
    i += 1;
  }
}

async function replaceSteps(
  conn: PoolConnection,
  expId: string,
  rows: NonNullable<PutExpMsgDraftInput["steps"]>,
): Promise<void> {
  await conn.query<ResultSetHeader>(`DELETE FROM exp_step WHERE exp_id = ?`, [expId]);
  let i = 0;
  for (const s of rows) {
    const stepId = await allocateUniqueMysqlVarchar32Id(conn, {
      table: "exp_step",
      column: "step_id",
      label: `${expId}_st_${i}`,
    });
    await conn.query<ResultSetHeader>(
      `INSERT INTO exp_step (step_id, exp_id, step_name, step_comments, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      [
        stepId,
        expId,
        trimOrNull(s.step_name ?? undefined, 60),
        s.step_comments != null ? String(s.step_comments).slice(0, 65535) : null,
        s.sort_order != null ? Number(s.sort_order) : i,
      ],
    );
    i += 1;
  }
}

async function replaceResults(
  conn: PoolConnection,
  expId: string,
  rows: NonNullable<PutExpMsgDraftInput["results"]>,
): Promise<void> {
  await conn.query<ResultSetHeader>(`DELETE FROM exp_result WHERE exp_id = ?`, [expId]);
  let i = 0;
  for (const r of rows) {
    const resultId = await allocateUniqueMysqlVarchar32Id(conn, {
      table: "exp_result",
      column: "result_id",
      label: `${expId}_rs_${i}`,
    });
    await conn.query<ResultSetHeader>(
      `INSERT INTO exp_result (result_id, exp_id, result_name, result_comments, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      [
        resultId,
        expId,
        trimOrNull(r.result_name ?? undefined, 60),
        r.result_comments != null ? String(r.result_comments).slice(0, 65535) : null,
        r.sort_order != null ? Number(r.sort_order) : i,
      ],
    );
    i += 1;
  }
}

async function replaceReferences(
  conn: PoolConnection,
  expId: string,
  rows: NonNullable<PutExpMsgDraftInput["references"]>,
): Promise<void> {
  await conn.query<ResultSetHeader>(`DELETE FROM exp_reference WHERE exp_id = ?`, [expId]);
  let i = 0;
  for (const r of rows) {
    const seqId = await allocateUniqueMysqlVarchar32Id(conn, {
      table: "exp_reference",
      column: "seq_id",
      label: `${expId}_ref_${i}`,
    });
    await conn.query<ResultSetHeader>(
      `INSERT INTO exp_reference (seq_id, exp_id, reference_name, reference_source, reference_comments, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        seqId,
        expId,
        trimOrNull(r.reference_name ?? undefined, 200),
        trimOrNull(r.reference_source ?? undefined, 200),
        trimOrNull(r.reference_comments ?? undefined, 200),
        r.sort_order != null ? Number(r.sort_order) : i,
      ],
    );
    i += 1;
  }
}

async function replaceScientists(
  conn: PoolConnection,
  expId: string,
  rows: NonNullable<PutExpMsgDraftInput["scientists"]>,
): Promise<void> {
  await conn.query<ResultSetHeader>(`DELETE FROM exp_scientist WHERE exp_id = ?`, [expId]);
  let i = 0;
  for (const r of rows) {
    const seqId = await allocateUniqueMysqlVarchar32Id(conn, {
      table: "exp_scientist",
      column: "seq_id",
      label: `${expId}_sci_${i}`,
    });
    await conn.query<ResultSetHeader>(
      `INSERT INTO exp_scientist (seq_id, exp_id, scientist_name, story_name, story_comments, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        seqId,
        expId,
        trimOrNull(r.scientist_name ?? undefined, 60),
        trimOrNull(r.story_name ?? undefined, 60),
        trimOrNull(r.story_comments ?? undefined, 200),
        r.sort_order != null ? Number(r.sort_order) : i,
      ],
    );
    i += 1;
  }
}

async function replaceVideos(
  conn: PoolConnection,
  expId: string,
  rows: NonNullable<PutExpMsgDraftInput["videos"]>,
): Promise<void> {
  await conn.query<ResultSetHeader>(`DELETE FROM exp_video WHERE exp_id = ?`, [expId]);
  let i = 0;
  for (const r of rows) {
    const url = trimOrNull(r.video_url ?? undefined, 200);
    if (!url) continue;
    const seqId = await allocateUniqueMysqlVarchar32Id(conn, {
      table: "exp_video",
      column: "seq_id",
      label: `${expId}_vid_${i}`,
    });
    await conn.query<ResultSetHeader>(
      `INSERT INTO exp_video (seq_id, video_url, exp_id, sort_order, file_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        seqId,
        url,
        expId,
        r.sort_order != null ? Number(r.sort_order) : i,
        r.file_id != null && String(r.file_id).trim() ? String(r.file_id).trim().slice(0, 32) : null,
      ],
    );
    i += 1;
  }
}

/**
 * 仅创建人可写；`status = y`（已发布）禁止整包草稿覆盖。
 * 子表：请求体中出现对应数组键时整表替换（空数组即清空）。
 */
export async function putExpMsgDraft(
  expId: string,
  input: PutExpMsgDraftInput,
  actorId?: string,
): Promise<ExpMsgRecord> {
  const pool = getMysqlPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [curRows] = await conn.query<RowDataPacket[]>(
      `SELECT exp_id, create_user_id, status FROM exp_msg WHERE exp_id = ? AND is_deleted = 0 LIMIT 1 FOR UPDATE`,
      [expId],
    );
    if (curRows.length === 0) throw new Error("NOT_FOUND");
    const ownerId = curRows[0]!.create_user_id != null ? String(curRows[0]!.create_user_id) : "";
    const actor = (actorId ?? "").trim();
    if (!actor || ownerId !== actor) throw new Error("FORBIDDEN_OWNER");
    const st = curRows[0]!.status != null ? String(curRows[0]!.status) : "";
    if (st === "y") throw new Error("EXP_MSG_PUBLISHED_LOCKED");

    const fragments: string[] = [];
    const params: unknown[] = [];

    // 驳回后重新保存草稿 → 自动重置为待审状态并清空驳回原因
    if (st === "n") {
      fragments.push("status = 't'");
      fragments.push("confirm_user_id = NULL");
      fragments.push("confirm_time = NULL");
      fragments.push("confirm_comments = NULL");
    }
    if (input.exp_name !== undefined) {
      fragments.push("exp_name = ?");
      params.push(trimOrEmpty(input.exp_name, 100));
    }
    if (input.choose_type !== undefined) {
      fragments.push("choose_type = ?");
      params.push(input.choose_type);
    }
    if (input.subject_id !== undefined) {
      fragments.push("subject_id = ?");
      params.push(input.subject_id && String(input.subject_id).trim() ? String(input.subject_id).trim().slice(0, 32) : null);
    }
    if (input.school_level_id !== undefined) {
      fragments.push("school_level_id = ?");
      params.push(
        input.school_level_id && String(input.school_level_id).trim()
          ? String(input.school_level_id).trim().slice(0, 32)
          : null,
      );
    }
    if (input.grade_id !== undefined) {
      fragments.push("grade_id = ?");
      params.push(input.grade_id && String(input.grade_id).trim() ? String(input.grade_id).trim().slice(0, 32) : null);
    }
    if (input.difficulty_id !== undefined) {
      fragments.push("difficulty_id = ?");
      params.push(
        input.difficulty_id && String(input.difficulty_id).trim()
          ? String(input.difficulty_id).trim().slice(0, 32)
          : null,
      );
    }
    if (input.standard_exp_id !== undefined) {
      fragments.push("standard_exp_id = ?");
      params.push(
        input.standard_exp_id && String(input.standard_exp_id).trim()
          ? String(input.standard_exp_id).trim().slice(0, 32)
          : null,
      );
    }
    if (input.exp_principle !== undefined) {
      fragments.push("exp_principle = ?");
      params.push(input.exp_principle != null ? String(input.exp_principle).slice(0, 65535) : null);
    }
    if (input.exp_caution !== undefined) {
      fragments.push("exp_caution = ?");
      params.push(trimOrNull(input.exp_caution ?? undefined, 200));
    }
    if (input.exp_danger !== undefined) {
      fragments.push("exp_danger = ?");
      params.push(trimOrNull(input.exp_danger ?? undefined, 200));
    }
    if (input.class_hour !== undefined) {
      fragments.push("class_hour = ?");
      params.push(input.class_hour != null && !Number.isNaN(Number(input.class_hour)) ? Number(input.class_hour) : null);
    }
    if (input.coursebook_id !== undefined) {
      fragments.push("coursebook_id = ?");
      params.push(
        input.coursebook_id && String(input.coursebook_id).trim()
          ? String(input.coursebook_id).trim().slice(0, 32)
          : null,
      );
    }
    if (input.unit_id !== undefined) {
      fragments.push("unit_id = ?");
      params.push(input.unit_id && String(input.unit_id).trim() ? String(input.unit_id).trim().slice(0, 32) : null);
    }
    if (input.exp_task_type !== undefined) {
      fragments.push("exp_task_type = ?");
      params.push(input.exp_task_type);
    }
    if (input.simulator_url !== undefined) {
      fragments.push("simulator_url = ?");
      params.push(trimOrNull(input.simulator_url ?? undefined, 200));
    }

    if (input.materials !== undefined) await replaceMaterials(conn, expId, input.materials);
    if (input.steps !== undefined) await replaceSteps(conn, expId, input.steps);
    if (input.results !== undefined) await replaceResults(conn, expId, input.results);
    if (input.references !== undefined) await replaceReferences(conn, expId, input.references);
    if (input.scientists !== undefined) await replaceScientists(conn, expId, input.scientists);
    if (input.videos !== undefined) await replaceVideos(conn, expId, input.videos);

    fragments.push("update_user_id = ?");
    params.push(actor || null);
    fragments.push("update_time = NOW()");

    if (fragments.length > 0) {
      await conn.query<ResultSetHeader>(
        `UPDATE exp_msg SET ${fragments.join(", ")} WHERE exp_id = ? AND is_deleted = 0`,
        [...params, expId],
      );
    }

    await conn.commit();

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM exp_msg WHERE exp_id = ? AND is_deleted = 0 LIMIT 1`,
      [expId],
    );
    if (rows.length === 0) throw new Error("NOT_FOUND_AFTER_PUT");
    return rowToExpMsg(rows[0]!);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
