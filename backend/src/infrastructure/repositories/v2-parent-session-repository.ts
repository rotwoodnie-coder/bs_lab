/**
 * V2 家长辅导会话 MySQL 仓库
 * 对应表：parent_session
 */
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import type {
  ParentSessionRecord,
  ParentSessionDetail,
  CreateParentSessionInput,
  PatchParentSessionInput,
  GuideStyle,
  EvaluationStatus,
  CompletionStatus,
} from "../../domain/v2-parent/v2-parent-session-types.ts";
import { allocateUniqueMysqlVarchar32Id } from "../ids/identifiable-varchar32.ts";

function rowToRecord(row: RowDataPacket): ParentSessionRecord {
  return {
    sessionId: String(row.session_id),
    parentUserId: String(row.parent_user_id ?? ""),
    studentUserId: String(row.student_user_id ?? ""),
    expId: String(row.exp_id ?? ""),
    workId: row.work_id ? String(row.work_id) : null,
    taskId: row.task_id ? String(row.task_id) : null,
    guideStyle: (row.guide_style ?? "gentle") as GuideStyle,
    parentAttestedAt: row.parent_attested_at ? String(row.parent_attested_at) : null,
    errorCount: Number(row.error_count ?? 0),
    materialShortageReported: Number(row.material_shortage_reported ?? 0),
    evaluationStatus: (row.evaluation_status ?? "none") as EvaluationStatus,
    teacherComment: row.teacher_comment ? String(row.teacher_comment) : null,
    teacherStarRating: row.teacher_star_rating != null ? Number(row.teacher_star_rating) : null,
    completionStatus: (row.completion_status ?? "in_progress") as CompletionStatus,
    createTime: String(row.create_time ?? ""),
    updateTime: row.update_time ? String(row.update_time) : null,
  };
}

export async function createParentSession(
  input: CreateParentSessionInput,
): Promise<ParentSessionRecord> {
  const pool = await getMysqlPool();
  const sessionId = await allocateUniqueMysqlVarchar32Id(pool, {
    table: "parent_session",
    column: "session_id",
    label: `ps_${input.parentUserId}_${input.expId}`,
    explicit: undefined,
  });

  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  await pool.execute<ResultSetHeader>(
    `INSERT INTO parent_session
       (session_id, parent_user_id, student_user_id, exp_id, work_id, task_id,
        guide_style, error_count, material_shortage_reported,
        evaluation_status, completion_status, create_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 'none', 'in_progress', ?)`,
    [
      sessionId, input.parentUserId, input.studentUserId, input.expId,
      input.workId ?? null, input.taskId ?? null,
      input.guideStyle ?? "gentle", now,
    ],
  );

  return (await getParentSessionById(sessionId))!;
}

export async function getParentSessionById(
  sessionId: string,
): Promise<ParentSessionRecord | null> {
  const pool = await getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM parent_session WHERE session_id = ?",
    [sessionId],
  );
  return rows.length > 0 ? rowToRecord(rows[0] as RowDataPacket) : null;
}

export async function getParentSessionDetail(
  sessionId: string,
): Promise<ParentSessionDetail | null> {
  const pool = await getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.*,
            COALESCE(e.exp_name, '') AS exp_name,
            COALESCE(stu.user_name, '') AS student_name,
            COALESCE(t.user_name, '') AS teacher_name
     FROM parent_session s
     LEFT JOIN exp_msg e ON e.exp_id = s.exp_id
     LEFT JOIN sys_user stu ON stu.user_id = s.student_user_id
     LEFT JOIN exp_homework h ON h.work_id = s.work_id
     LEFT JOIN sys_user t ON t.user_id = h.teacher_user_id
     WHERE s.session_id = ?`,
    [sessionId],
  );

  if (rows.length === 0) return null;
  const row = rows[0] as RowDataPacket;
  const base = rowToRecord(row);

  // 查关联的报告
  const [reports] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM parent_report WHERE session_id = ?",
    [sessionId],
  );

  return {
    ...base,
    expName: String(row.exp_name ?? ""),
    studentName: String(row.student_name ?? ""),
    teacherName: row.teacher_name ? String(row.teacher_name) : null,
    report: reports.length > 0 ? reportRowToRecord(reports[0] as RowDataPacket) : null,
  };
}

export async function listParentSessionsByParentUserId(
  parentUserId: string,
): Promise<ParentSessionDetail[]> {
  const pool = await getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.*,
            COALESCE(e.exp_name, '') AS exp_name,
            COALESCE(stu.user_name, '') AS student_name,
            COALESCE(t.user_name, '') AS teacher_name
     FROM parent_session s
     LEFT JOIN exp_msg e ON e.exp_id = s.exp_id
     LEFT JOIN sys_user stu ON stu.user_id = s.student_user_id
     LEFT JOIN exp_homework h ON h.work_id = s.work_id
     LEFT JOIN sys_user t ON t.user_id = h.teacher_user_id
     WHERE s.parent_user_id = ?
     ORDER BY s.create_time DESC`,
    [parentUserId],
  );

  if (rows.length === 0) return [];

  // 批量拉取所有关联报告
  const sessionIds = rows.map((r) => r.session_id);
  const placeholders = sessionIds.map(() => "?").join(",");
  const [reportRows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM parent_report WHERE session_id IN (${placeholders})`,
    sessionIds,
  );
  const reportBySession: Record<string, RowDataPacket> = {};
  for (const rr of reportRows) {
    reportBySession[String(rr.session_id)] = rr as RowDataPacket;
  }

  return rows.map((r) => {
    const row = r as RowDataPacket;
    const base = rowToRecord(row);
    const rr = reportBySession[String(row.session_id)];
    return {
      ...base,
      expName: String(row.exp_name ?? ""),
      studentName: String(row.student_name ?? ""),
      teacherName: row.teacher_name ? String(row.teacher_name) : null,
      report: rr ? reportRowToRecord(rr) : null,
    };
  });
}

export async function patchParentSession(
  sessionId: string,
  input: PatchParentSessionInput,
): Promise<void> {
  const pool = await getMysqlPool();
  const sets: string[] = [];
  const params: unknown[] = [];

  if (input.parentAttestedAt !== undefined) {
    sets.push("parent_attested_at = ?");
    params.push(input.parentAttestedAt);
  }
  if (input.errorCount !== undefined) {
    sets.push("error_count = ?");
    params.push(input.errorCount);
  }
  if (input.materialShortageReported !== undefined) {
    sets.push("material_shortage_reported = ?");
    params.push(input.materialShortageReported);
  }
  if (input.guideStyle !== undefined) {
    sets.push("guide_style = ?");
    params.push(input.guideStyle);
  }
  if (input.completionStatus !== undefined) {
    sets.push("completion_status = ?");
    params.push(input.completionStatus);
  }
  if (input.teacherComment !== undefined) {
    sets.push("teacher_comment = ?");
    params.push(input.teacherComment);
  }
  if (input.teacherStarRating !== undefined) {
    sets.push("teacher_star_rating = ?");
    params.push(input.teacherStarRating);
  }
  if (input.evaluationStatus !== undefined) {
    sets.push("evaluation_status = ?");
    params.push(input.evaluationStatus);
  }

  if (sets.length === 0) return;
  sets.push("update_time = NOW()");
  params.push(sessionId);

  await pool.execute<ResultSetHeader>(
    `UPDATE parent_session SET ${sets.join(", ")} WHERE session_id = ?`,
    params,
  );
}

function reportRowToRecord(row: RowDataPacket) {
  return {
    reportId: String(row.report_id),
    sessionId: String(row.session_id),
    summary: row.summary ? String(row.summary) : null,
    strengths: parseJsonArray(row.strengths),
    improvements: parseJsonArray(row.improvements),
    nextRecommendations: parseJsonArray(row.next_recommendations),
    shareCopy: row.share_copy ? String(row.share_copy) : null,
    teacherComment: row.teacher_comment ? String(row.teacher_comment) : null,
    createTime: String(row.create_time ?? ""),
  };
}

function parseJsonArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}
