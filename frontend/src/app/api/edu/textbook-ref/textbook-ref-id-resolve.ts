import { getDbPool } from "@/lib/server/mysql";

/**
 * 教材参考写入/查询前的学科、年级编码解析。
 *
 * 对齐 `database/migrations/bs_exp_data.sql` 数据基线：维表为 `data_school_subject` /
 * `data_school_grade`（`subject_id` / `grade_id` 为 varchar，与控制台维度树一致）。
 * 不按历史迁移 0015/0016 中指向 `edu_subjects.id` / `edu_grades.id` 的 BIGINT 假设解析。
 *
 * 教材书目与章节目录读写对齐基线表 `data_coursebook` / `data_coursebook_chapter` /
 * `data_coursebook_unit`；学科、年级、排序、封面登记 id 等基线无独立列时写入
 * `data_coursebook.comments` 内 JSON 键 `_ref`（见 `textbook-ref-baseline-meta.ts`）。
 */
const schoolSubjectEnabled =
  "(LOWER(TRIM(COALESCE(status, 'y'))) <> 'n')";
const schoolGradeEnabled = "(LOWER(TRIM(COALESCE(status, 'y'))) <> 'n')";

/**
 * 教材参考写入前校验：`subject_id` 须为 `data_school_subject.subject_id`（如 `SUB_SCIENCE`）。
 */
export async function resolveRefSubjectIdFromClient(raw: unknown): Promise<string> {
  const s = String(raw ?? "").trim();
  if (!s) throw new Error("缺少学科");
  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT subject_id FROM data_school_subject WHERE subject_id = ? AND ${schoolSubjectEnabled} LIMIT 1`,
    [s],
  );
  const list = rows as { subject_id: string }[];
  if (list.length === 0) {
    throw new Error(`学科「${s}」在 data_school_subject 中不存在或未启用`);
  }
  return String(list[0]?.subject_id ?? s);
}

/**
 * 可选年级：`grade_id` 须为 `data_school_grade.grade_id`（如 `GRADE_7`）；空表示不限年级。
 */
export async function resolveRefGradeIdFromClient(raw: unknown): Promise<string | null> {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (!s) return null;
  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT grade_id FROM data_school_grade WHERE grade_id = ? AND ${schoolGradeEnabled} LIMIT 1`,
    [s],
  );
  const list = rows as { grade_id: string }[];
  if (list.length === 0) {
    throw new Error(`年级「${s}」在 data_school_grade 中不存在或未启用`);
  }
  return String(list[0]?.grade_id ?? s);
}
