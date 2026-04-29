import { NextRequest } from "next/server";

import { runExec, runQuery, withErrorHandling } from "../_lib";
import { EFFECTIVE_SCHOOL_LEVEL_ID_SQL, newGradeSubjectSeqId, schoolDictStatusEnabledSql } from "../edu-dimension-v2-shared";

type GradeRow = { grade_id: string };

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = (await request.json()) as { level_id?: string; subject_id?: string };
    const levelId = (body.level_id ?? "").trim();
    const subjectId = (body.subject_id ?? "").trim();
    if (!levelId) throw new Error("level_id 非法（对应 data_school_level.level_id）");
    if (!subjectId) throw new Error("subject_id 非法");

    const rows = await runQuery<GradeRow>(
      `SELECT g.grade_id
       FROM data_school_grade g
       WHERE (${EFFECTIVE_SCHOOL_LEVEL_ID_SQL}) = ?
         AND ${schoolDictStatusEnabledSql("g")}
       ORDER BY g.sort_order ASC, g.grade_id ASC`,
      [levelId],
    );
    if (!rows.length) throw new Error("当前学段下暂无可用年级，无法新增学科关联");

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
        [seqId, subjectId, gradeId, subjectId, gradeId],
      );
    }
    return { ok: true };
  });
}
