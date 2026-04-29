import { runLegacyQuery as runQuery } from "@/lib/server/mysql";

import { withErrorHandling } from "../_lib";

type EditionRow = {
  id: number;
  code: string;
  name: string;
  sort_order: number;
  status: number;
};

export async function GET() {
  return withErrorHandling(async () => {
    const rows = await runQuery<EditionRow>(
      "SELECT id, code, name, sort_order, status FROM edu_editions WHERE status = 1 ORDER BY sort_order ASC, id ASC",
    );
    return {
      editions: rows.map((r) => ({
        id: String(r.id),
        code: r.code,
        name: r.name,
        sortOrder: r.sort_order,
        status: r.status,
      })),
    };
  });
}
