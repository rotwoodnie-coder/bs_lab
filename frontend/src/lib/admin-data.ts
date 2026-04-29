// Admin Cockpit 专用数据与类型定义

export type WorkflowStage = "needs_definition" | "ai_generating" | "human_review" | "grey_release" | "published"
export type LockStatus = "locked" | "unlocked"
export type ResourceHealth = "healthy" | "warning" | "error" | "offline"

export interface AuditLogEntry {
  id: string
  actor: string
  actorAvatar: string
  actorRole: "admin" | "teacher" | "system" | "ai"
  action: string
  detail?: string
  timestamp: string
}

export interface ExperimentResource {
  videoStreamStatus: ResourceHealth
  videoStreamUrl?: string
  webglContainerHealth: ResourceHealth
  webglContainerVersion?: string
  aiTranslationProgress: number // 0-100
  aiTranslationStatus: ResourceHealth
}

export interface AdminExperiment {
  id: string
  title: string
  category: "physics" | "chemistry" | "biology"
  subcategory: string
  aiDifficultyScore: number // 0-100, AI预测原始分
  adminDifficultyOverride?: number // 管理员覆盖值
  status: "draft" | "pending" | "published" | "locked"
  workflowStage: WorkflowStage
  createdBy: string
  createdAt: string
  updatedAt: string
  auditLog: AuditLogEntry[]
  resources: ExperimentResource
}

export interface StudentWorkAdmin {
  id: string
  experimentId: string
  experimentTitle: string
  studentName: string
  studentAvatar: string
  thumbnail: string
  submittedAt: string
  lockStatus: LockStatus
  accessPolicy: "public" | "class_only" | "teacher_only" | "private"
  viewCount: number
}

// 模拟管理员实验数据
export const mockAdminExperiments: AdminExperiment[] = [
  {
    id: "exp-001",
    title: "牛顿摆实验",
    category: "physics",
    subcategory: "力学",
    aiDifficultyScore: 62,
    status: "published",
    workflowStage: "published",
    createdBy: "李明华",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
    auditLog: [
      {
        id: "al-001",
        actor: "李明华",
        actorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
        actorRole: "teacher",
        action: "创建实验",
        detail: "初始草稿",
        timestamp: "2024-01-15T08:00:00Z",
      },
      {
        id: "al-002",
        actor: "AI 系统",
        actorAvatar: "",
        actorRole: "ai",
        action: "难度预测",
        detail: "AI 预测难度评分 62/100（中等偏难）",
        timestamp: "2024-01-15T08:05:00Z",
      },
      {
        id: "al-003",
        actor: "李明华",
        actorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
        actorRole: "teacher",
        action: "提交审核",
        detail: "从草稿 → 待审核",
        timestamp: "2024-01-16T10:00:00Z",
      },
      {
        id: "al-004",
        actor: "王管理员",
        actorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face",
        actorRole: "admin",
        action: "审核通过",
        detail: "内容符合课程标准，批准发布",
        timestamp: "2024-01-17T09:30:00Z",
      },
      {
        id: "al-005",
        actor: "系统",
        actorAvatar: "",
        actorRole: "system",
        action: "正式发布",
        detail: "灰度发布完成，全量上线",
        timestamp: "2024-01-20T14:30:00Z",
      },
    ],
    resources: {
      videoStreamStatus: "healthy",
      videoStreamUrl: "https://stream.example.com/exp-001",
      webglContainerHealth: "healthy",
      webglContainerVersion: "v2.4.1",
      aiTranslationProgress: 100,
      aiTranslationStatus: "healthy",
    },
  },
  {
    id: "exp-002",
    title: "火山喷发模拟",
    category: "chemistry",
    subcategory: "酸碱反应",
    aiDifficultyScore: 28,
    status: "published",
    workflowStage: "published",
    createdBy: "王晓芳",
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-01-18T16:00:00Z",
    auditLog: [
      {
        id: "al-010",
        actor: "王晓芳",
        actorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face",
        actorRole: "teacher",
        action: "创建实验",
        timestamp: "2024-01-10T09:00:00Z",
      },
      {
        id: "al-011",
        actor: "AI 系统",
        actorAvatar: "",
        actorRole: "ai",
        action: "难度预测",
        detail: "AI 预测难度评分 28/100（简单）",
        timestamp: "2024-01-10T09:03:00Z",
      },
      {
        id: "al-012",
        actor: "王管理员",
        actorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face",
        actorRole: "admin",
        action: "审核通过",
        timestamp: "2024-01-15T11:00:00Z",
      },
    ],
    resources: {
      videoStreamStatus: "healthy",
      webglContainerHealth: "warning",
      webglContainerVersion: "v2.3.0",
      aiTranslationProgress: 100,
      aiTranslationStatus: "healthy",
    },
  },
  {
    id: "exp-003",
    title: "植物细胞观察",
    category: "biology",
    subcategory: "细胞",
    aiDifficultyScore: 55,
    status: "pending",
    workflowStage: "human_review",
    createdBy: "李明华",
    createdAt: "2024-01-08T10:00:00Z",
    updatedAt: "2024-01-22T09:00:00Z",
    auditLog: [
      {
        id: "al-020",
        actor: "李明华",
        actorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
        actorRole: "teacher",
        action: "创建实验",
        timestamp: "2024-01-08T10:00:00Z",
      },
      {
        id: "al-021",
        actor: "AI 系统",
        actorAvatar: "",
        actorRole: "ai",
        action: "AI 内容生成",
        detail: "自动生成实验步骤与材料清单",
        timestamp: "2024-01-08T10:10:00Z",
      },
      {
        id: "al-022",
        actor: "李明华",
        actorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
        actorRole: "teacher",
        action: "提交审核",
        detail: "等待管理员人工校对",
        timestamp: "2024-01-22T09:00:00Z",
      },
    ],
    resources: {
      videoStreamStatus: "offline",
      webglContainerHealth: "healthy",
      aiTranslationProgress: 76,
      aiTranslationStatus: "warning",
    },
  },
  {
    id: "exp-004",
    title: "彩虹牛奶实验",
    category: "chemistry",
    subcategory: "表面张力",
    aiDifficultyScore: 19,
    adminDifficultyOverride: 25,
    status: "draft",
    workflowStage: "ai_generating",
    createdBy: "张伟",
    createdAt: "2024-01-20T14:00:00Z",
    updatedAt: "2024-01-20T15:30:00Z",
    auditLog: [
      {
        id: "al-030",
        actor: "张伟",
        actorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
        actorRole: "teacher",
        action: "创建实验",
        timestamp: "2024-01-20T14:00:00Z",
      },
      {
        id: "al-031",
        actor: "AI 系统",
        actorAvatar: "",
        actorRole: "ai",
        action: "AI 内容生成中",
        detail: "正在生成实验说明视频脚本…",
        timestamp: "2024-01-20T14:05:00Z",
      },
      {
        id: "al-032",
        actor: "王管理员",
        actorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face",
        actorRole: "admin",
        action: "覆盖难度评分",
        detail: "AI 预测 19 → 管理员覆盖为 25",
        timestamp: "2024-01-20T15:30:00Z",
      },
    ],
    resources: {
      videoStreamStatus: "offline",
      webglContainerHealth: "offline",
      aiTranslationProgress: 42,
      aiTranslationStatus: "warning",
    },
  },
  {
    id: "exp-005",
    title: "光的折射实验",
    category: "physics",
    subcategory: "光学",
    aiDifficultyScore: 33,
    status: "locked",
    workflowStage: "published",
    createdBy: "李明华",
    createdAt: "2024-01-18T11:00:00Z",
    updatedAt: "2024-01-25T08:00:00Z",
    auditLog: [
      {
        id: "al-040",
        actor: "李明华",
        actorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
        actorRole: "teacher",
        action: "创建实验",
        timestamp: "2024-01-18T11:00:00Z",
      },
      {
        id: "al-041",
        actor: "王管理员",
        actorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face",
        actorRole: "admin",
        action: "锁定实验",
        detail: "内容待复核，临时锁定访问权限",
        timestamp: "2024-01-25T08:00:00Z",
      },
    ],
    resources: {
      videoStreamStatus: "healthy",
      webglContainerHealth: "error",
      webglContainerVersion: "v2.4.1",
      aiTranslationProgress: 100,
      aiTranslationStatus: "healthy",
    },
  },
  {
    id: "exp-006",
    title: "蚂蚁行为观察",
    category: "biology",
    subcategory: "动物行为",
    aiDifficultyScore: 44,
    status: "pending",
    workflowStage: "grey_release",
    createdBy: "王晓芳",
    createdAt: "2024-01-12T13:00:00Z",
    updatedAt: "2024-01-24T10:00:00Z",
    auditLog: [
      {
        id: "al-050",
        actor: "王晓芳",
        actorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face",
        actorRole: "teacher",
        action: "创建实验",
        timestamp: "2024-01-12T13:00:00Z",
      },
      {
        id: "al-051",
        actor: "王管理员",
        actorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face",
        actorRole: "admin",
        action: "进入灰度发布",
        detail: "开放 10% 用户访问，监测反馈",
        timestamp: "2024-01-24T10:00:00Z",
      },
    ],
    resources: {
      videoStreamStatus: "warning",
      webglContainerHealth: "healthy",
      aiTranslationProgress: 88,
      aiTranslationStatus: "healthy",
    },
  },
]

// 模拟学生作品管理数据
export const mockStudentWorksAdmin: StudentWorkAdmin[] = [
  {
    id: "work-001",
    experimentId: "exp-002",
    experimentTitle: "火山喷发模拟",
    studentName: "张小红",
    studentAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
    thumbnail: "https://images.unsplash.com/photo-1563207153-f403bf289096?w=300&h=200&fit=crop",
    submittedAt: "2024-01-22T14:00:00Z",
    lockStatus: "unlocked",
    accessPolicy: "public",
    viewCount: 245,
  },
  {
    id: "work-002",
    experimentId: "exp-004",
    experimentTitle: "彩虹牛奶实验",
    studentName: "王小华",
    studentAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
    thumbnail: "https://images.unsplash.com/photo-1628689469838-524a4a973b8e?w=300&h=200&fit=crop",
    submittedAt: "2024-01-21T10:30:00Z",
    lockStatus: "unlocked",
    accessPolicy: "class_only",
    viewCount: 189,
  },
  {
    id: "work-003",
    experimentId: "exp-001",
    experimentTitle: "牛顿摆实验",
    studentName: "刘小强",
    studentAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
    thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300&h=200&fit=crop",
    submittedAt: "2024-01-20T16:00:00Z",
    lockStatus: "locked",
    accessPolicy: "teacher_only",
    viewCount: 67,
  },
  {
    id: "work-004",
    experimentId: "exp-003",
    experimentTitle: "植物细胞观察",
    studentName: "陈小美",
    studentAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face",
    thumbnail: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=300&h=200&fit=crop",
    submittedAt: "2024-01-19T11:00:00Z",
    lockStatus: "unlocked",
    accessPolicy: "public",
    viewCount: 312,
  },
  {
    id: "work-005",
    experimentId: "exp-005",
    experimentTitle: "光的折射实验",
    studentName: "赵小明",
    studentAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop",
    submittedAt: "2024-01-23T09:30:00Z",
    lockStatus: "locked",
    accessPolicy: "private",
    viewCount: 23,
  },
  {
    id: "work-006",
    experimentId: "exp-006",
    experimentTitle: "蚂蚁行为观察",
    studentName: "孙小丽",
    studentAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop",
    submittedAt: "2024-01-24T13:00:00Z",
    lockStatus: "unlocked",
    accessPolicy: "class_only",
    viewCount: 156,
  },
]
