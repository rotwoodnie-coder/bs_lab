import { NextResponse } from "next/server";

import { runExec, runQuery } from "@/lib/server/mysql";

import type { SchoolDimensionSnapshot } from "@/app/(dashboard)/console/settings/education/subject-grades/page.types";

import { fetchEduSnapshotLegacy } from "./edu-dimension-snapshot-legacy";
import { fetchEduSnapshotV2 } from "./edu-dimension-snapshot-v2";

export { runExec, runQuery };

/**
 * 教学维度快照：默认只读 `DATABASE_URL` 主库 `data_school_*`（与控制台写入一致）。
 * 仅当需要临时对接旧库时设置 `EDU_DIMENSIONS_SOURCE=legacy`（读 `bs_lab_data.edu_*`）。
 * 不必再配置 `=v2`：默认即是 V2。
 */
export async function fetchEduSnapshot(): Promise<SchoolDimensionSnapshot> {
  const mode = process.env.EDU_DIMENSIONS_SOURCE?.trim().toLowerCase();
  if (mode === "legacy") return fetchEduSnapshotLegacy();
  return fetchEduSnapshotV2();
}

export async function withErrorHandling<T>(fn: () => Promise<T>) {
  try {
    const data = await fn();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "服务异常",
      },
      { status: 500 },
    );
  }
}
