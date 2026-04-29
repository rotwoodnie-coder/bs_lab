import { NextRequest } from "next/server";

import { runExec, withErrorHandling } from "../../_lib";
import { EFFECTIVE_SCHOOL_LEVEL_ID_SQL } from "../../edu-dimension-v2-shared";

export async function PATCH(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = (await request.json()) as { level_id?: string; grade_ids_in_order?: string[] };
    const levelId = (body.level_id ?? "").trim();
    if (!levelId) throw new Error("levelId 非法（对应 data_school_level.level_id）");
    const gradeIdsInOrder = body.grade_ids_in_order ?? [];
    for (let i = 0; i < gradeIdsInOrder.length; i++) {
      const gradeId = (gradeIdsInOrder[i] ?? "").trim();
      if (!gradeId) continue;
      await runExec(
        `UPDATE data_school_grade g
         SET g.sort_order = ?
         WHERE g.grade_id = ?
           AND (${EFFECTIVE_SCHOOL_LEVEL_ID_SQL}) = ?`,
        [(i + 1) * 10, gradeId, levelId],
      );
    }
    return { ok: true };
  });
}
