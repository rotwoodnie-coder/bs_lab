import { NextRequest } from "next/server";

import { runExec, runQuery, withErrorHandling } from "../../_lib";
import {
  EFFECTIVE_SCHOOL_LEVEL_ID_SQL,
  newGradeSubjectSeqId,
  schoolDictStatusEnabledSql,
} from "../../edu-dimension-v2-shared";

type MatrixGradeRow = { grade_id: string };

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ subjectId: string }> },
) {
  return withErrorHandling(async () => {
    const { subjectId } = await context.params;
    const subjectIdStr = (subjectId ?? "").trim();
    if (!subjectIdStr) throw new Error("subjectId 非法");

    const body = (await request.json()) as { level_id?: string; subject_id?: string; grade_ids?: string[] };
    const levelId = (body.level_id ?? "").trim();
    if (!levelId) throw new Error("levelId 非法（对应 data_school_level.level_id）");

    const selectedSet = new Set((body.grade_ids ?? []).map((g) => String(g).trim()).filter(Boolean));

    const rows = await runQuery<MatrixGradeRow>(
      `SELECT g.grade_id
       FROM data_school_grade g
       WHERE (${EFFECTIVE_SCHOOL_LEVEL_ID_SQL}) = ?
         AND ${schoolDictStatusEnabledSql("g")}
       ORDER BY g.sort_order ASC, g.grade_id ASC`,
      [levelId],
    );
    const allStageGradeIds = rows.map((row) => row.grade_id);
    for (let i = 0; i < allStageGradeIds.length; i++) {
      const gradeId = allStageGradeIds[i];
      if (!gradeId) continue;
      if (selectedSet.has(gradeId)) {
        const seqId = newGradeSubjectSeqId();
        await runExec(
          `INSERT INTO data_school_grade_subject (seq_id, subject_id, grade_id)
           SELECT ?, ?, ?
           FROM DUAL
           WHERE NOT EXISTS (
             SELECT 1 FROM data_school_grade_subject t
             WHERE t.subject_id = ? AND t.grade_id = ?
           )`,
          [seqId, subjectIdStr, gradeId, subjectIdStr, gradeId],
        );
      } else {
        await runExec(
          "DELETE FROM data_school_grade_subject WHERE subject_id = ? AND grade_id = ?",
          [subjectIdStr, gradeId],
        );
      }
    }

    return { ok: true };
  });
}
