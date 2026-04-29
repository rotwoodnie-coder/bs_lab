import type { CatalogCategory, CatalogCore } from "@/lib/experiment-catalog-api";
import type { CoreApiActor } from "@/lib/core-api-shared";
import type { UserRole } from "@/types/auth";

import type { SchoolDimensionSnapshot } from "../education/subject-grades/page.types";
import type { V2ExpLibraryItem } from "@/lib/v2/v2-exp-api";

/** 控制台实验列表（详情编辑）与列表拉取共用的 CoreApiActor，供 /v2/exp-library 调用。 */
export function buildExpCatalogListActor(role: UserRole, orgId: string): CoreApiActor {
  return {
    role,
    orgId,
    userId: `console-${role}-exp-catalog`,
    userName: "控制台实验目录",
  };
}

/** V2 无实验类型维表：表单用单条占位，id 稳定即可。 */
export const V2_EXP_LIBRARY_PLACEHOLDER_CATEGORY: CatalogCategory = {
  id: "v2-exp-library",
  code: "EXP_LIBRARY",
  name: "标准试验库",
  description: null,
  sortOrder: 0,
  status: 1,
};

function parseStandardCodeFromComments(comments: string | null | undefined): string {
  const raw = (comments ?? "").trim();
  if (!raw) return "";
  const m = raw.match(/^standard_code:\s*(.+)$/i);
  return (m ? m[1] : raw).trim().slice(0, 128);
}

function v2StatusToCatalogStatus(status: string | null | undefined): number {
  const v = (status ?? "y").trim().toLowerCase();
  return v === "n" ? 0 : 1;
}

function lookupLevelName(snapshot: SchoolDimensionSnapshot | null, levelId: string): string | undefined {
  return snapshot?.levels.find((s) => s.levelId === levelId)?.levelName;
}

function lookupSubjectName(snapshot: SchoolDimensionSnapshot | null, subjectId: string): string | undefined {
  return snapshot?.subjects.find((s) => s.subjectId === subjectId)?.subjectName;
}

/**
 * 将 `exp_library` 列表/详情行映射为控制台表格与详情仍使用的 `CatalogCore` 形态。
 */
export function v2ExpLibraryItemToCatalogCore(
  row: V2ExpLibraryItem,
  snapshot: SchoolDimensionSnapshot | null,
): CatalogCore {
  const gradeIds = (row.grades ?? []).map((g) => g.gradeId).filter(Boolean);
  const codeFromDb = parseStandardCodeFromComments(row.comments);
  const stageId = row.schoolLevelId ?? "";
  const subjectId = row.subjectId ?? "";
  return {
    id: row.libExpId,
    standardCode: codeFromDb || row.libExpId.slice(0, 24),
    displayName: row.libExpName,
    nameFingerprint: row.libExpId,
    fingerprintVersion: 1,
    stageId,
    subjectId,
    gradeIds,
    isMandatory: row.chooseType === "y" ? 1 : 0,
    expCategoryId: V2_EXP_LIBRARY_PLACEHOLDER_CATEGORY.id,
    officialVideoRegistryId: null,
    officialVideoReachable: null,
    officialVideoProcessingStatus: "NONE",
    status: v2StatusToCatalogStatus(row.status),
    stageName: lookupLevelName(snapshot, stageId),
    subjectName: lookupSubjectName(snapshot, subjectId),
    categoryName: V2_EXP_LIBRARY_PLACEHOLDER_CATEGORY.name,
    categoryCode: V2_EXP_LIBRARY_PLACEHOLDER_CATEGORY.code,
    pendingEdgeCount: 0,
    closureComplete: true,
    createdByActorId: row.createUserId ?? null,
    createdByActorDisplayName: row.displayOwnerName ?? null,
    updatedAt: row.updateTime ?? row.createTime ?? undefined,
    createdAt: row.createTime ?? undefined,
  };
}
