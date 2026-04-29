import { NextRequest } from "next/server";

import { runExec, runQuery, withErrorHandling } from "../_lib";

type DuplicateRow = { subject_id: string };

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = (await request.json()) as { subject_name?: string; subject_id?: string };
    const name = (body.subject_name ?? "").trim();
    const code = (body.subject_id ?? "").trim().toUpperCase();
    if (!name) throw new Error("学科名称不能为空");
    if (!code) throw new Error("学科编码不能为空");
    if (code.length > 32) throw new Error("学科编码过长");
    if (!/^[A-Z0-9_]+$/.test(code)) throw new Error("学科编码仅允许大写字母、数字和下划线");

    const byName = await runQuery<DuplicateRow>(
      "SELECT subject_id FROM data_school_subject WHERE subject_name = ? LIMIT 1",
      [name],
    );
    if (byName.length > 0) throw new Error(`学科名称“${name}”已存在，请更换名称`);
    const byCode = await runQuery<DuplicateRow>(
      "SELECT subject_id FROM data_school_subject WHERE subject_id = ? LIMIT 1",
      [code],
    );
    if (byCode.length > 0) throw new Error(`学科编码“${code}”已存在，请更换编码`);

    await runExec(
      `INSERT INTO data_school_subject (subject_id, subject_name, status, sort_order, comments)
       VALUES (?, ?, 'y', COALESCE((SELECT MAX(sort_order) + 10 FROM data_school_subject s2), 10), NULL)`,
      [code, name],
    );
    return { id: code };
  });
}
