// 用户角色类型
export type UserRole = "teacher" | "student"

// 用户信息
export interface User {
  id: string
  name: string
  avatar: string
  role: UserRole
  school?: string
  grade?: string
}

// 实验难度等级
export type DifficultyLevel = "简单" | "中等" | "困难"

// 实验学科分类
export type SubjectCategory = "physics" | "chemistry" | "biology"

// 适合年级选项
export type GradeLevel = 
  // 兼容旧枚举（逐步迁移中）
  | "小学低年级"
  | "小学高年级"
  | "初一"
  | "初二"
  | "初三"
  | "高一"
  | "高二"
  | "高三"
  | "一年级"
  | "二年级"
  | "三年级"
  | "四年级"
  | "五年级"
  | "六年级"
  | "七年级"
  | "八年级"
  | "九年级"
  | "十年级"
  | "十一年级"
  | "十二年级"

// 视频风格
export type VideoStyle = "cartoon" | "documentary" | "professional" | "fun"

// 实验发布状态
export type ExperimentStatus = "draft" | "pending" | "published" | "rejected"

// AI生成的实验建议
export interface AIExperimentSuggestion {
  title: string
  description: string
  category: SubjectCategory
  subcategory: string
  difficulty: DifficultyLevel
  grades: GradeLevel[]
  duration: string
  materials: Material[]
  steps: ExperimentStep[]
  safetyTips: SafetyTip[]
}

// 实验材料
export interface Material {
  name: string
  quantity: string
  optional?: boolean
}

// 实验步骤
export interface ExperimentStep {
  order: number
  title: string
  description: string
  imageUrl?: string
  tips?: string
}

// 安全提示
export interface SafetyTip {
  type: "warning" | "danger" | "info"
  content: string
}

// 老师信息
export interface TeacherInfo {
  id: string
  name: string
  avatar: string
  title?: string          // 职称
  school?: string         // 学校
  verified?: boolean      // 是否认证
}

// 单条评分记录
export interface ExperimentRating {
  id: string
  experimentId: string
  userId: string
  userName: string
  userAvatar: string
  rating: number           // 1-5星
  comment?: string         // 评价内容
  createdAt: string
}

// 实验数据
export interface Experiment {
  id: string
  title: string
  description: string
  thumbnail: string
  videoUrl?: string
  duration: string
  difficulty: DifficultyLevel
  grades: GradeLevel[]
  rating: number           // 平均评分
  ratingCount: number      // 评分人数
  ratings?: ExperimentRating[] // 评分记录列表
  category: SubjectCategory
  subcategory: string
  createdBy: string
  createdAt: string
  materials: Material[]
  steps: ExperimentStep[]
  safetyTips: SafetyTip[]
  viewCount: number
  likeCount: number
  favoriteCount: number
  status?: ExperimentStatus  // 发布状态：draft草稿, pending待审核, published已发布, rejected已拒绝
  rejectReason?: string      // 拒绝原因
  teacher?: TeacherInfo      // 发布老师信息
}

// 学生作品
export interface StudentWork {
  id: string
  experimentId: string
  experimentTitle: string
  studentId: string
  studentName: string
  studentAvatar: string
  videoUrl: string
  thumbnail: string
  description: string
  createdAt: string
  likeCount: number
  favoriteCount: number
  commentCount: number
  isLiked?: boolean
  isFavorited?: boolean
}

// 关注关系
export interface FollowRelation {
  id: string
  followerId: string      // 关注者ID
  followingId: string     // 被关注者ID
  createdAt: string
}

// 评论
export interface Comment {
  id: string
  workId: string
  userId: string
  userName: string
  userAvatar: string
  userRole: UserRole
  content: string
  createdAt: string
  likes: number
}

// 分享信息
export interface ShareInfo {
  url: string
  title: string
  description: string
  thumbnail: string
}

// 消息类型
export type MessageType = "system" | "comment" | "like" | "follow" | "rating" | "work"

// 消息数据
export interface Message {
  id: string
  type: MessageType
  title: string
  content: string
  fromUser?: {
    id: string
    name: string
    avatar: string
  }
  relatedId?: string        // 关联的实验/作品ID
  relatedTitle?: string     // 关联的实验/作品标题
  read: boolean
  createdAt: string
}
