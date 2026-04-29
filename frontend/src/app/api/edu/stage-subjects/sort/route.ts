import { NextRequest } from "next/server";

import { runExec, withErrorHandling } from "../../_lib";

function parseStageSubjectRelationId(value: string): { stageId: string; subjectId: string } | null {
  const idx = value.indexOf(":");
  if (idx <= 0) return null;
  const stageId = value.slice(0, idx).trim();
  const subjectId = value.slice(idx + 1).trim();
  if (!stageId || !subjectId) return null;
  return { stageId, subjectId };
}

export async function PATCH(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = (await request.json()) as { relation_ids_in_order?: string[] };
    const relationIdsInOrder = body.relation_ids_in_order ?? [];
    for (let i = 0; i < relationIdsInOrder.length; i++) {
      const pair = parseStageSubjectRelationId(relationIdsInOrder[i] ?? "");
      if (!pair) continue;
      await runExec(
        "UPDATE data_school_subject SET sort_order = ? WHERE subject_id = ?",
        [(i + 1) * 10, pair.subjectId],
      );
    }
    return { ok: true };
  });
}
