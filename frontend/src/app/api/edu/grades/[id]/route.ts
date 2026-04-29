import { NextRequest } from "next/server";

import { runExec, withErrorHandling } from "../../_lib";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return withErrorHandling(async () => {
    const { id } = await context.params;
    const prevGradeId = (id ?? "").trim();
    if (!prevGradeId) throw new Error("gradeId 非法");
    const body = (await request.json()) as { grade_name?: string; grade_id?: string; active_status?: 0 | 1 };
    const name = (body.grade_name ?? "").trim();
    const code = (body.grade_id ?? "").trim().toUpperCase();
    const status = body.active_status === 0 ? 0 : 1;
    if (!name) throw new Error("年级名称不能为空");
    if (!code) throw new Error("年级编码不能为空");
    if (code.length > 32) throw new Error("年级编码过长");
    const st = status === 1 ? "y" : "n";

    if (code !== prevGradeId) {
      await runExec(
        `UPDATE data_school_grade_subject SET grade_id = ? WHERE grade_id = ?`,
        [code, prevGradeId],
      );
      await runExec(
        `UPDATE data_school_grade SET grade_id = ?, grade_name = ?, status = ? WHERE grade_id = ?`,
        [code, name, st, prevGradeId],
      );
    } else {
      await runExec(`UPDATE data_school_grade SET grade_name = ?, status = ? WHERE grade_id = ?`, [
        name,
        st,
        prevGradeId,
      ]);
    }
    return { ok: true };
  });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return withErrorHandling(async () => {
    const { id } = await context.params;
    const gradeId = (id ?? "").trim();
    if (!gradeId) throw new Error("gradeId 非法");
    await runExec("DELETE FROM data_school_grade_subject WHERE grade_id = ?", [gradeId]);
    await runExec("DELETE FROM data_school_grade WHERE grade_id = ?", [gradeId]);
    return { ok: true };
  });
}
