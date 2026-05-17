/**
 * 实验编辑器侧「标准库列表行 / 工具条状态」展示模型（不依赖 `@/data/mock-experiment-management`）。
 */
import { SUBJECT_CASCADE } from "@/data/subject-tree";
import type { V2DictGradeItem, V2DictItem, V2ExpMsgDetail, V2ExpMsgItem } from "@/lib/v2/v2-exp-api";
import type { EducationPhase, SubjectDiscipline } from "@/types/subject";
import {
  EXP_MSG_STATUS_LABEL,
  EXP_CHOOSE_TYPE_LABEL,
} from "@/lib/v2/exp-display-mapping";

import { phaseLabelOf } from "../hooks/editor-bootstrap-utils";
import type { PhaseKey } from "../types";
import { resolvePhaseDisciplineGradesFromV2Detail } from "./build-editor-hydration-from-v2-detail";

export type EditorPeerWorkflowStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "published"
  | "archived";

export type EditorPeerLifecycleStatus = "DRAFT" | "PENDING" | "PUBLISHED" | "STANDARD";
export type EditorPeerMandatory = "mandatory" | "optional";

export const EDITOR_PEER_LIFECYCLE_LABEL: Record<EditorPeerLifecycleStatus, string> = {
  DRAFT: "草稿中",
  PENDING: "待评审",
  PUBLISHED: EXP_MSG_STATUS_LABEL.y,
  STANDARD: "标杆",
};

export const EDITOR_PEER_WORKFLOW_LABEL: Record<EditorPeerWorkflowStatus, string> = {
  draft: EXP_MSG_STATUS_LABEL.t,
  submitted: "已提交",
  in_review: "评审中",
  changes_requested: EXP_MSG_STATUS_LABEL.n,
  approved: EXP_MSG_STATUS_LABEL.y,
  published: "已上架",
  archived: "已归档",
};

export const EDITOR_PEER_MANDATORY_LABEL: Record<EditorPeerMandatory, string> = {
  mandatory: EXP_CHOOSE_TYPE_LABEL.y,
  optional: EXP_CHOOSE_TYPE_LABEL.n,
};

export type EditorPeerRow = {
  id: string;
  title: string;
  summary: string;
  workflowStatus: EditorPeerWorkflowStatus;
  authorName: string;
  subjectLabel: string;
  phaseLabel?: string;
  gradeLabels: string[];
  mandatory: EditorPeerMandatory;
  curriculumRefShort: string;
  stepsSummary: string;
  tags: string[];
  lastReviewComment?: string;
  lastReviewScore?: number;
  lastReviewAt?: string;
  rejectReason?: string;
  copyCount?: number;
  taskCount?: number;
  sourceExperimentId?: string | null;
  contentVersion?: number;
  isStandard?: boolean;
  lifecycleStatus?: EditorPeerLifecycleStatus;
  coverVideoUrl?: string | null;
  authorRoleLabel?: string;
  durationHint?: string;
  /** 来源类型：'msg' 来自教师实验(exp_msg)，'library' 来自标准试验库(exp_library) */
  sourceType: 'library' | 'msg';
  /** exp_library 主键（当 sourceType='library' 时有值） */
  libraryId?: string;
  /** 发布状态（DB 原始状态码） */
  publishStatus?: string | null;
  /** 关联实验的阶段／学科／年级（从 V2 详情透传，用于关联填充） */
  phase?: EducationPhase | null;
  discipline?: SubjectDiscipline | null;
  gradeCodes?: string[];
  disciplineLabel?: string;
};

export function deriveEditorPeerLifecycleFromWorkflow(
  workflowStatus: EditorPeerWorkflowStatus,
  isStandard?: boolean,
): EditorPeerLifecycleStatus {
  if (isStandard) return "STANDARD";
  if (workflowStatus === "published") return "PUBLISHED";
  if (workflowStatus === "submitted" || workflowStatus === "in_review" || workflowStatus === "approved") return "PENDING";
  return "DRAFT";
}

export function editorPeerIsPendingReviewStatus(status: EditorPeerWorkflowStatus): boolean {
  return status === "submitted" || status === "in_review";
}

export function editorPeerLifecycleForRow(
  row: Pick<EditorPeerRow, "workflowStatus" | "isStandard" | "lifecycleStatus">,
): EditorPeerLifecycleStatus {
  return row.lifecycleStatus ?? deriveEditorPeerLifecycleFromWorkflow(row.workflowStatus, row.isStandard);
}

function disciplineLabelFor(code: SubjectDiscipline): string {
  for (const ph of SUBJECT_CASCADE) {
    const d = ph.disciplines.find((x) => x.discipline === code);
    if (d) return d.label;
  }
  return code;
}

function v2StatusToWorkflow(status: string | null | undefined): EditorPeerWorkflowStatus {
  if (status === "y") return "published";
  if (status === "n") return "changes_requested";
  return "draft";
}

/** 由教师实验 `exp_msg` 构造工具条 / 旗帜用行（仅 V2 数据）。 */
export function editorPeerRowFromV2ExpMsgItem(
  d: V2ExpMsgItem,
  ctx: { subjects: V2DictItem[]; grades: V2DictGradeItem[] },
): EditorPeerRow {
  const tax = resolvePhaseDisciplineGradesFromV2Detail(d as V2ExpMsgDetail, ctx.subjects, ctx.grades);
  const phaseLabel = phaseLabelOf(tax.phase as PhaseKey);
  const discLabel = disciplineLabelFor(tax.discipline);
  const subjectLabel = `${phaseLabel} · ${discLabel}`;
  const gradeLabels =
    tax.selectedGradeCodes.length > 0
      ? tax.selectedGradeCodes
          .map((id) => ctx.grades.find((g) => g.id === id)?.name ?? id)
          .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      : [];

  const workflowStatus = v2StatusToWorkflow(d.status);
  const isStandard = Boolean(d.standardExpId?.trim());
  const lifecycleStatus = deriveEditorPeerLifecycleFromWorkflow(workflowStatus, isStandard);

  return {
    id: d.expId,
    title: d.expName?.trim() || "未命名实验",
    summary: (d.expPrinciple ?? "").slice(0, 240),
    workflowStatus,
    authorName: (d.displayOwnerName ?? d.createUserId ?? "—").toString().trim() || "—",
    subjectLabel,
    gradeLabels: gradeLabels.length ? gradeLabels : ["—"],
    mandatory: d.chooseType === "y" ? "mandatory" : "optional",
    curriculumRefShort: (d.unitId ?? d.coursebookId ?? "").trim() ? "已关联教材/单元" : "",
    stepsSummary: "",
    tags: [subjectLabel, ...(gradeLabels.length ? gradeLabels : ["—"])].filter((t) => t && t !== "—"),
    rejectReason: d.rejectReason ?? undefined,
    isStandard,
    lifecycleStatus,
    // 封面优先级：exp_pic.pic_url（实验图片）> exp_video.video_url（实验视频）
    coverVideoUrl: d.coverPicUrl?.trim() || d.coverVideoUrl?.trim() || null,
    copyCount: 0,
    taskCount: 0,
    sourceExperimentId: d.linkExpId ?? null,
    contentVersion: 1,
    sourceType: 'msg',
    publishStatus: d.status,
  };
}
