/**
 * V2 家长亲子报告 MySQL 仓库
 * 对应表：parent_report
 */
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getMysqlPool } from "../mysql/mysql-client.ts";
import type {
  ParentReportRecord,
  CreateParentReportInput,
} from "../../domain/v2-parent/v2-parent-session-types.ts";
import { allocateUniqueMysqlVarchar32Id } from "../ids/identifiable-varchar32.ts";

export async function createParentReport(
  input: CreateParentReportInput,
): Promise<ParentReportRecord> {
  const pool = await getMysqlPool();
  const reportId = await allocateUniqueMysqlVarchar32Id(pool, {
    table: "parent_report",
    column: "report_id",
    label: `pr_${input.sessionId}`,
    explicit: undefined,
  });

  await pool.execute<ResultSetHeader>(
    `INSERT INTO parent_report
       (report_id, session_id, summary, strengths, improvements,
        next_recommendations, share_copy, teacher_comment)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      reportId, input.sessionId,
      input.summary,
      JSON.stringify(input.strengths ?? []),
      JSON.stringify(input.improvements ?? []),
      JSON.stringify(input.nextRecommendations ?? []),
      input.shareCopy ?? null,
      input.teacherComment ?? null,
    ],
  );

  const created = await getParentReportBySessionId(input.sessionId);
  return created!;
}

export async function getParentReportBySessionId(
  sessionId: string,
): Promise<ParentReportRecord | null> {
  const pool = await getMysqlPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM parent_report WHERE session_id = ?",
    [sessionId],
  );
  if (rows.length === 0) return null;
  return rowToRecord(rows[0] as RowDataPacket);
}

function rowToRecord(row: RowDataPacket): ParentReportRecord {
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
