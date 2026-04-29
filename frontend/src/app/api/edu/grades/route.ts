import { NextRequest } from "next/server";

import { runExec, withErrorHandling } from "../_lib";

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = (await request.json()) as { grade_name?: string; grade_id?: string };
    const name = (body.grade_name ?? "").trim();
    const code = (body.grade_id ?? "").trim().toUpperCase();
    if (!code) throw new Error("年级编码不能为空");
    if (code.length > 32) throw new Error("年级编码过长");
    if (!name) throw new Error("年级名称不能为空");
    await runExec(
      `INSERT INTO data_school_grade (grade_id, grade_name, status, sort_order, school_level_id, comments)
       VALUES (?, ?, 'y', COALESCE((SELECT MAX(sort_order) + 10 FROM data_school_grade g2), 10), NULL, NULL)`,
      [code, name],
    );
    return { ok: true };
  });
}
