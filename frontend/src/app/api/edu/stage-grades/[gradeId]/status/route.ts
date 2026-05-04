import { NextRequest } from "next/server";

import { runExec, runQuery, withErrorHandling } from "../../../_lib";
import { effectiveSchoolLevelIdSqlForAlias, newGradeSubjectSeqId } from "../../../edu-dimension-v2-shared";

type SubjectRow = { subject_id: string };

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ gradeId: string }> },
) {
  return withErrorHandling(async () => {
    const { gradeId } = await context.params;
    const gradeIdStr = (gradeId ?? "").trim();
    if (!gradeIdStr) throw new Error("gradeId 非法");
    const body = (await request.json()) as { level_id?: string; active_status?: 0 | 1 };
    const levelId = (body.level_id ?? "").trim();
    const status = body.active_status === 0 ? 0 : 1;
    if (!levelId) throw new Error("levelId 非法（对应 data_school_level.level_id）");

    const effGx = effectiveSchoolLevelIdSqlForAlias("gx");

    if (status === 0) {
      await runExec(
        `UPDATE data_school_grade g
         SET g.status = 'n'
         WHERE g.grade_id = ?
           AND (${effectiveSchoolLevelIdSqlForAlias("g")}) = ?`,
        [gradeIdStr, levelId],
      );
      // 仅删除归属于该学段的矩阵行，避免已切换学段的年级误删
      await runExec(
        `DELETE gs FROM data_school_grade_subject gs
         INNER JOIN data_school_grade g ON g.grade_id = gs.grade_id
         WHERE gs.grade_id = ?
           AND (${effectiveSchoolLevelIdSqlForAlias("g")}) = ?`,
        [gradeIdStr, levelId],
      );
      return { ok: true };
    }

    await runExec(
      `UPDATE data_school_grade g
       SET g.status = 'y'
       WHERE g.grade_id = ?
         AND (${effectiveSchoolLevelIdSqlForAlias("g")}) = ?`,
      [gradeIdStr, levelId],
    );

    const subjectRows = await runQuery<SubjectRow>(
      `SELECT DISTINCT gs.subject_id
       FROM data_school_grade_subject gs
       INNER JOIN data_school_grade gx ON gx.grade_id = gs.grade_id
       WHERE (${effGx}) = ?`,
      [levelId],
    );
    for (let i = 0; i < subjectRows.length; i++) {
      const sid = subjectRows[i]?.subject_id;
      if (!sid) continue;
      const seqId = newGradeSubjectSeqId();
      await runExec(
        `INSERT INTO data_school_grade_subject (seq_id, subject_id, grade_id)
         SELECT ?, ?, ?
         FROM DUAL
         WHERE NOT EXISTS (
           SELECT 1 FROM data_school_grade_subject t
           WHERE t.subject_id = ? AND t.grade_id = ?
         )`,
        [seqId, sid, gradeIdStr, sid, gradeIdStr],
      );
    }
    return { ok: true };
  });
}
