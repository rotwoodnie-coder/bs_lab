/**
 * 教研课题组 Mock，与 docs/contracts/research-project-group-mock.md 状态机对齐。
 */

export type ResearchProjectGroupStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "rejected"
  | "suspended"
  | "archived";

export type ResearchProjectGroupStatsSnapshot = {
  /** 关联实验会话的完成率聚合（闭环 B） */
  avgCompletionPct: number;
  sessionCount: number;
  completedCount: number;
  computedAt: string;
};

export type ResearchProjectGroupMock = {
  id: string;
  name: string;
  introduction: string;
  subjectLabel: string;
  creatorName: string;
  memberNames: string[];
  status: ResearchProjectGroupStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  /** 课题试点关注的实验 id（用于从 UnifiedSession 聚合指标） */
  focusExperimentIds?: string[];
  /** 校验时可写入或展示的统计快照 */
  statsSnapshot?: ResearchProjectGroupStatsSnapshot | null;
};

export const RESEARCH_PROJECT_GROUP_STATUS_LABEL: Record<ResearchProjectGroupStatus, string> = {
  draft: "草稿",
  pending_review: "待审核",
  active: "已生效",
  rejected: "已驳回",
  suspended: "已暂停",
  archived: "已归档",
};

export const MOCK_RESEARCH_PROJECT_GROUPS: readonly ResearchProjectGroupMock[] = [
  {
    id: "trpg-mock-01",
    name: "小学科学探究协作组",
    introduction:
      "聚焦课标「物质的结构与性质」探究活动，组内共享实验方案与课堂观察量表，与区本目录实验互引。",
    subjectLabel: "科学",
    creatorName: "张老师",
    memberNames: ["张老师", "王老师", "赵老师"],
    status: "pending_review",
    submittedAt: "2026-04-10",
    reviewedAt: null,
    reviewNote: null,
  },
  {
    id: "trpg-mock-02",
    name: "物质科学微项目课题组",
    introduction: "以微项目串联家庭小实验与课堂探究，沉淀可复用的材料清单与安全提示。",
    subjectLabel: "科学",
    creatorName: "李老师",
    memberNames: ["李老师", "周老师"],
    status: "active",
    submittedAt: "2026-03-22",
    reviewedAt: "2026-03-24",
    reviewNote: "目标与区本方向一致，同意生效。",
    focusExperimentIds: ["baoshan-100-sci-001", "baoshan-100-sci-002"],
  },
  {
    id: "trpg-mock-03",
    name: "四年级跨学科STEM小组（草稿）",
    introduction: "拟与信息科技组联合设计「传感与记录」主题周，成员与课表待最终确认。",
    subjectLabel: "科学 · 信息",
    creatorName: "陈老师",
    memberNames: ["陈老师"],
    status: "draft",
    submittedAt: null,
    reviewedAt: null,
    reviewNote: null,
  },
  {
    id: "trpg-mock-04",
    name: "生命科学拓展课题组",
    introduction: "原计划与校外基地联动，因材料审批未通过暂缓，待修改后重提。",
    subjectLabel: "科学",
    creatorName: "刘老师",
    memberNames: ["刘老师", "孙老师"],
    status: "rejected",
    submittedAt: "2026-03-01",
    reviewedAt: "2026-03-05",
    reviewNote: "校外联动需补充安全预案与校方备案编号。",
  },
] as const;

export function filterResearchProjectGroupsByStatus(
  rows: readonly ResearchProjectGroupMock[],
  status: ResearchProjectGroupStatus | "all",
): ResearchProjectGroupMock[] {
  if (status === "all") return [...rows];
  return rows.filter((r) => r.status === status);
}
