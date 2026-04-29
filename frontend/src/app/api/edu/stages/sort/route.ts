import { NextRequest } from "next/server";

import { runExec, withErrorHandling } from "../../_lib";

export async function PATCH(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = (await request.json()) as { level_ids_in_order?: string[]; stage_ids_in_order?: string[] };
    const levelIdsInOrder = body.level_ids_in_order ?? body.stage_ids_in_order ?? [];
    for (let i = 0; i < levelIdsInOrder.length; i++) {
      const levelId = (levelIdsInOrder[i] ?? "").trim();
      if (!levelId) continue;
      await runExec("UPDATE data_school_level SET sort_order = ? WHERE level_id = ?", [
        (i + 1) * 10,
        levelId,
      ]);
    }
    return { ok: true };
  });
}
