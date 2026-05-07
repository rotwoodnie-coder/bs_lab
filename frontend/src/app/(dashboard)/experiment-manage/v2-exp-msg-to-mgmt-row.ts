import type { EditorPeerRow, EditorPeerWorkflowStatus } from "@/app/(dashboard)/teacher/experiment-editor/utils/editor-peer-row-types";
import type { V2ExpMsgItem } from "@/lib/v2/v2-exp-api";
import { dbStatusToWorkflow, dbStatusToLifecycle, userTypeLabel as userTypeLabelShared } from "@/lib/v2/exp-display-mapping";

function plainFromRich(text: string | null): string {
  if (!text) return "";
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function statusToWorkflow(status: string | null): EditorPeerWorkflowStatus {
  return dbStatusToWorkflow(status);
}

/**
 * 将 `/v2/exp` 列表项映射为编辑器/卡片共用的 `EditorPeerRow`（展示字段以库为准）。
 */
function createUserTypeLabel(t: V2ExpMsgItem["createUserType"]): string {
  return userTypeLabelShared(t);
}

function durationHintFromClassHour(classHour: number | null | undefined): string {
  if (classHour == null || Number.isNaN(Number(classHour))) return "—";
  const h = Number(classHour);
  const minutes = Math.max(5, Math.round(h * 45));
  return `约 ${minutes} 分钟`;
}

export function v2ExpMsgItemToMgmtRow(
  item: V2ExpMsgItem,
  labels: { subject: string; grade: string; authorDisplay: string },
): EditorPeerRow {
  const ws = statusToWorkflow(item.status);
  const principle = plainFromRich(item.expPrinciple);
  const roleLabel = createUserTypeLabel(item.createUserType);
  return {
    id: item.expId,
    title: item.expName,
    summary: principle ? principle.slice(0, 240) : item.expName,
    workflowStatus: ws,
    authorName: labels.authorDisplay,
    authorRoleLabel: roleLabel || undefined,
    subjectLabel: labels.subject,
    gradeLabels: labels.grade && labels.grade !== "—" ? [labels.grade] : ["—"],
    mandatory: item.chooseType === "y" ? "mandatory" : "optional",
    curriculumRefShort: item.standardExpId ? `关联标准库 ${item.standardExpId}` : "—",
    stepsSummary: "步骤与材料见试验详情",
    tags: [labels.subject, labels.grade].filter((t) => t && t !== "—"),
    lastReviewComment: item.confirmComments ?? undefined,
    copyCount: item.likeNum,
    taskCount: item.evaluateNum,
    sourceExperimentId: item.linkExpId ?? null,
    contentVersion: 1,
    isStandard: Boolean(item.standardExpId),
    lifecycleStatus: dbStatusToLifecycle(item.status),
    rejectReason:
      item.status === "n" ? (item.rejectReason?.trim() || item.confirmComments?.trim() || undefined) : undefined,
    // 封面优先级：exp_pic.pic_url（实验图片）> exp_video.video_url（实验视频）
    coverVideoUrl: item.coverPicUrl?.trim() || item.coverVideoUrl?.trim() || null,
    durationHint: durationHintFromClassHour(item.classHour),
    sourceType: 'msg',
    publishStatus: item.status,
  };
}
