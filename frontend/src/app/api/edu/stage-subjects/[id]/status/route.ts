import { NextRequest } from "next/server";

import { runExec, runQuery, withErrorHandling } from "../../../_lib";
import {
  EFFECTIVE_SCHOOL_LEVEL_ID_SQL,
  newGradeSubjectSeqId,
  schoolDictStatusEnabledSql,
} from "../../../edu-dimension-v2-shared";

/** 路径 id 为 `` `${levelId}:${subjectId}` ``，与 `data_school_level.level_id` + `data_school_subject.subject_id` 一致 */
function parseLevelSubjectLinkKey(value: string): { levelId: string; subjectId: string } | null {
  const idx = value.indexOf(":");
  if (idx <= 0) return null;
  const levelId = value.slice(0, idx).trim();
  const subjectId = value.slice(idx + 1).trim();
  if (!levelId || !subjectId) return null;
  return { levelId, subjectId };
}

type GradeRow = { grade_id: string };

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await context.params;
    const pair = parseLevelSubjectLinkKey(id ?? "");
    if (!pair) {
      throw new Error("关联 ID 格式错误，应为 levelId:subjectId（对应库主键语义）");
    }
    const body = (await request.json()) as { active_status?: number };
    const status = body.active_status === 0 ? 0 : 1;

    if (status === 0) {
      await runExec(
        `DELETE gs FROM data_school_grade_subject gs
         INNER JOIN data_school_grade g ON g.grade_id = gs.grade_id
         WHERE gs.subject_id = ?
           AND (${EFFECTIVE_SCHOOL_LEVEL_ID_SQL}) = ?`,
        [pair.subjectId, pair.levelId],
      );
      return { ok: true };
    }

    const rows = await runQuery<GradeRow>(
      `SELECT g.grade_id
       FROM data_school_grade g
       WHERE (${EFFECTIVE_SCHOOL_LEVEL_ID_SQL}) = ?
         AND ${schoolDictStatusEnabledSql("g")}
       ORDER BY g.sort_order ASC, g.grade_id ASC`,
      [pair.levelId],
    );
    for (let i = 0; i < rows.length; i++) {
      const gradeId = rows[i]?.grade_id;
      if (!gradeId) continue;
      const seqId = newGradeSubjectSeqId();
      await runExec(
        `INSERT INTO data_school_grade_subject (seq_id, subject_id, grade_id)
         SELECT ?, ?, ?
         FROM DUAL
         WHERE NOT EXISTS (
           SELECT 1 FROM data_school_grade_subject t
           WHERE t.subject_id = ? AND t.grade_id = ?
         )`,
        [seqId, pair.subjectId, gradeId, pair.subjectId, gradeId],
      );
    }
    return { ok: true };
  });
}
