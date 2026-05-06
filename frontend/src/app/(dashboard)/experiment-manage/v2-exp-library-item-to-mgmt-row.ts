import { SUBJECT_CASCADE } from "@/data/subject-tree";
import type { V2DictGradeItem, V2DictItem, V2ExpLibraryItem } from "@/lib/v2/v2-exp-api";
import type { EditorPeerRow, EditorPeerWorkflowStatus } from "@/app/(dashboard)/teacher/experiment-editor/utils/editor-peer-row-types";
import { dbStatusToWorkflow, dbStatusToLifecycle } from "@/lib/v2/exp-display-mapping";

function plainFromRich(text: string | null): string {
  if (!text) return "";
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function statusToWorkflow(status: string | null): EditorPeerWorkflowStatus {
  return dbStatusToWorkflow(status);
}

/**
 * 将字典中的学科名映射为「学段 · 学科」展示串，供 `subjectPathFromLabels` 与课标表筛选使用。
 */
export function resolveLibrarySubjectPathLabel(
  item: V2ExpLibraryItem,
  subjects: V2DictItem[],
): string {
  const sn = item.subjectId ? (subjects.find((s) => s.id === item.subjectId)?.name ?? "").trim() : "";
  if (!sn) return "— · —";
  for (const ph of SUBJECT_CASCADE) {
    for (const d of ph.disciplines) {
      if (d.label === sn) return `${ph.label} · ${d.label}`;
    }
  }
  return `— · ${sn}`;
}

export function v2ExpLibraryItemToMgmtRow(
  item: V2ExpLibraryItem,
  ctx: { subjects: V2DictItem[]; grades: V2DictGradeItem[] },
): EditorPeerRow {
  const ws = statusToWorkflow(item.status);
  const subjectPath = resolveLibrarySubjectPathLabel(item, ctx.subjects);
  const gradeNames = (item.grades ?? [])
    .map((g) => ctx.grades.find((x) => x.id === g.gradeId)?.name ?? "")
    .map((x) => String(x).trim())
    .filter(Boolean);
  const gradeLabels = gradeNames.length > 0 ? gradeNames : ["—"];
  const commentsPlain = plainFromRich(item.comments);
  const [phaseLabel, subjectLabel] = subjectPath.split(" · ");
  return {
    id: item.libExpId,
    title: item.libExpName,
    summary: commentsPlain ? commentsPlain.slice(0, 240) : item.libExpName,
    workflowStatus: ws,
    authorName: (item.displayOwnerName ?? item.createUserId ?? "—").trim() || "—",
    subjectLabel: subjectLabel ?? subjectPath,
    phaseLabel: phaseLabel ?? "—",
    gradeLabels,
    mandatory: item.chooseType === "y" ? "mandatory" : "optional",
    curriculumRefShort: `标准试验库 ${item.libExpId}`,
    stepsSummary: "标准试验库条目（步骤与材料请在编辑器中补充）",
    tags: [subjectPath, ...gradeLabels].filter((t) => t && t !== "—"),
    lastReviewComment: undefined,
    copyCount: 0,
    taskCount: 0,
    sourceExperimentId: null,
    contentVersion: 1,
    isStandard: true,
    lifecycleStatus: dbStatusToLifecycle(item.status),
    rejectReason: undefined,
    coverVideoUrl: null,
    durationHint: "—",
    sourceType: 'library' as const,
    libraryId: item.libExpId,
    publishStatus: item.status,
  };
}
