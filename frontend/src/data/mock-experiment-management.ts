import { PRIMARY_SCIENCE_EXPERIMENT_LIST } from "@/data/primary-science-experiment-list.generated";

export type ExperimentWorkflowStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "published"
  | "archived";

export type ExperimentLifecycleStatus = "DRAFT" | "PENDING" | "PUBLISHED" | "STANDARD";
export type ExperimentMandatory = "mandatory" | "optional";

export const EXPERIMENT_LIFECYCLE_LABEL: Record<ExperimentLifecycleStatus, string> = {
  DRAFT: "草稿中",
  PENDING: "待评审",
  PUBLISHED: "已发布",
  STANDARD: "标杆",
};

export const WORKFLOW_STATUS_LABEL: Record<ExperimentWorkflowStatus, string> = {
  draft: "草稿",
  submitted: "已提交",
  in_review: "评审中",
  changes_requested: "需修改",
  approved: "已通过",
  published: "已上架",
  archived: "已归档",
};

export const MANDATORY_LABEL: Record<ExperimentMandatory, string> = {
  mandatory: "必做",
  optional: "选做",
};

export type ExperimentMgmtRow = {
  id: string;
  title: string;
  summary: string;
  workflowStatus: ExperimentWorkflowStatus;
  authorName: string;
  subjectLabel: string;
  gradeLabels: string[];
  mandatory: ExperimentMandatory;
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
  lifecycleStatus?: ExperimentLifecycleStatus;
  /** 来自 `exp_video` 首条封面，优先于本地视频库 */
  coverVideoUrl?: string | null;
  /** 发布人类型展示：教师 / 学生 */
  authorRoleLabel?: string;
  /** 由 `class_hour` 推导的时长文案 */
  durationHint?: string;
};

export const WORKFLOW_STATUS_ORDER: ExperimentWorkflowStatus[] = [
  "draft",
  "submitted",
  "in_review",
  "changes_requested",
  "approved",
  "published",
  "archived",
];

export function deriveLifecycleStatusFromWorkflow(
  workflowStatus: ExperimentWorkflowStatus,
  isStandard?: boolean,
): ExperimentLifecycleStatus {
  if (isStandard) return "STANDARD";
  if (workflowStatus === "published") return "PUBLISHED";
  if (workflowStatus === "submitted" || workflowStatus === "in_review" || workflowStatus === "approved") return "PENDING";
  return "DRAFT";
}

export function nextWorkflowStatus(current: ExperimentWorkflowStatus): ExperimentWorkflowStatus {
  const i = WORKFLOW_STATUS_ORDER.indexOf(current);
  return WORKFLOW_STATUS_ORDER[(i + 1) % WORKFLOW_STATUS_ORDER.length]!;
}

export function isPendingReviewStatus(status: ExperimentWorkflowStatus): boolean {
  return status === "submitted" || status === "in_review";
}

export function getLifecycleStatusForRow(
  row: Pick<ExperimentMgmtRow, "workflowStatus" | "isStandard" | "lifecycleStatus">,
): ExperimentLifecycleStatus {
  return row.lifecycleStatus ?? deriveLifecycleStatusFromWorkflow(row.workflowStatus, row.isStandard);
}

export function migrateStoredExperimentMgmtRow(raw: Record<string, unknown>): ExperimentMgmtRow {
  const row = raw as Partial<ExperimentMgmtRow> & { sameStyleHeatScore?: number; derivedTopicCount?: number };
  const copyCount =
    typeof row.copyCount === "number"
      ? row.copyCount
      : typeof row.sameStyleHeatScore === "number"
        ? Math.min(100, Math.round(row.sameStyleHeatScore / 10))
        : 0;
  const taskCount =
    typeof row.taskCount === "number"
      ? row.taskCount
      : typeof row.derivedTopicCount === "number"
        ? row.derivedTopicCount
        : 0;
  return normalizeExperimentMgmtRow({ ...(row as ExperimentMgmtRow), copyCount, taskCount });
}

export function normalizeExperimentMgmtRow(row: ExperimentMgmtRow): ExperimentMgmtRow {
  const lifecycleStatus = deriveLifecycleStatusFromWorkflow(row.workflowStatus, row.isStandard);
  const copyCount = row.copyCount ?? 0;
  const taskCount = row.taskCount ?? 0;
  if (row.lifecycleStatus === lifecycleStatus && (row.copyCount ?? 0) === copyCount && (row.taskCount ?? 0) === taskCount) {
    return row;
  }
  return { ...row, copyCount, taskCount, lifecycleStatus };
}

export function normalizeExperimentMgmtRows(rows: ExperimentMgmtRow[]): ExperimentMgmtRow[] {
  return rows.map((row) => normalizeExperimentMgmtRow(row));
}

const WORKFLOW_CYCLE: readonly ExperimentWorkflowStatus[] = ["draft", "submitted", "in_review", "approved", "published"];

export const INITIAL_EXPERIMENT_MGMT_ROWS: ExperimentMgmtRow[] = PRIMARY_SCIENCE_EXPERIMENT_LIST.map((item, index) => {
  const workflowStatus = WORKFLOW_CYCLE[index % WORKFLOW_CYCLE.length];
  const mandatoryText = item.mandatory === "mandatory" ? "必做" : "选做";
  return {
    id: item.id,
    title: item.experimentName,
    summary: `${item.experimentName}（${item.gradeRangeRaw}，${mandatoryText}）`,
    workflowStatus,
    authorName: "教研组",
    subjectLabel: "科学试验列表",
    gradeLabels: item.gradeLabels,
    mandatory: item.mandatory,
    curriculumRefShort: `${item.gradeRangeRaw} ${mandatoryText}`,
    stepsSummary: "按试验目标完成准备、实施、记录与反思",
    tags: [item.gradeRangeRaw, mandatoryText],
    copyCount: index % 9,
    taskCount: index % 5,
    isStandard: index % 6 === 0,
    lifecycleStatus: deriveLifecycleStatusFromWorkflow(workflowStatus, index % 6 === 0),
    contentVersion: 1,
  };
});
