/** 全区资源库与评审数据（纯 UI，无后端） */

export type ResourceKind = "video" | "pdf" | "package";

export type ResourceItem = {
  id: string;
  title: string;
  /** 封面用渐变类名片段，避免硬编码色值 */
  coverClassName: string;
  downloads: number;
  views: number;
  fileBadge: string;
  stage: string;
  subject: string;
  kind: ResourceKind;
  pdfPageCount?: number;
};

export const RESOURCE_STAGES = ["全部", "小学"] as const;
export const RESOURCE_SUBJECTS = ["全部", "科学"] as const;
export const RESOURCE_TYPES = ["全部", "视频", "课件", "压缩包"] as const;

export const MOCK_RESOURCES: ResourceItem[] = [
  {
    id: "r-1",
    title: "观察植物生长 · 示范录像",
    coverClassName: "from-primary/30 via-primary/10 to-muted",
    downloads: 1280,
    views: 5600,
    fileBadge: "MP4",
    stage: "小学",
    subject: "科学",
    kind: "video",
  },
  {
    id: "r-2",
    title: "水的三态变化 · 实验手册",
    coverClassName: "from-secondary/40 via-muted to-accent/20",
    downloads: 890,
    views: 3200,
    fileBadge: "PDF",
    stage: "小学",
    subject: "科学",
    kind: "pdf",
    pdfPageCount: 12,
  },
  {
    id: "r-3",
    title: "影子与太阳高度 · 观察微课",
    coverClassName: "from-accent/30 via-primary/15 to-muted",
    downloads: 2100,
    views: 9800,
    fileBadge: "MP4",
    stage: "小学",
    subject: "科学",
    kind: "video",
  },
  {
    id: "r-4",
    title: "小电路点亮灯泡 · 素材包",
    coverClassName: "from-muted via-secondary/25 to-primary/20",
    downloads: 456,
    views: 1200,
    fileBadge: "ZIP",
    stage: "小学",
    subject: "科学",
    kind: "package",
  },
  {
    id: "r-5",
    title: "小学科学：水的三态变化",
    coverClassName: "from-primary/20 via-accent/25 to-secondary/20",
    downloads: 3400,
    views: 12000,
    fileBadge: "PDF",
    stage: "小学",
    subject: "科学",
    kind: "pdf",
    pdfPageCount: 8,
  },
  {
    id: "r-6",
    title: "制作简易温度计 · 动画讲解",
    coverClassName: "from-secondary/30 to-muted",
    downloads: 720,
    views: 4100,
    fileBadge: "MP4",
    stage: "小学",
    subject: "科学",
    kind: "video",
  },
];

export type PendingReviewItem = {
  id: string;
  title: string;
  school: string;
  author: string;
  submittedAt: string;
};

export const MOCK_PENDING_REVIEWS: PendingReviewItem[] = [
  {
    id: "p-1",
    title: "校本课程 · 桥梁承重探究课件",
    school: "市实验小学",
    author: "张老师",
    submittedAt: "2026-04-10",
  },
  {
    id: "p-2",
    title: "影子长度观测课堂实录（剪辑版）",
    school: "区实验学校",
    author: "李老师",
    submittedAt: "2026-04-09",
  },
  {
    id: "p-3",
    title: "小学科学安全操作清单 PDF",
    school: "阳光中学",
    author: "王老师",
    submittedAt: "2026-04-08",
  },
];
