import { UserRole } from "@/types/auth";

export type WorkbenchCard = {
  id: string;
  title: string;
  description?: string;
  href: string;
  /** purely presentational badge */
  badge?: string;
};

export type WorkbenchConfig = {
  title: string;
  subtitle?: string;
  cards: WorkbenchCard[];
};

export const WORKBENCH_CONFIG_BY_ROLE: Record<UserRole, WorkbenchConfig> = {
  [UserRole.TEACHER]: {
    title: "教师工作台",
    subtitle: "班级与任务的日常入口",
    cards: [
      { id: "exp", title: "实验课程管理", description: "新增/编辑/发布实验课程", href: "/experiment-manage" },
      { id: "class", title: "班级管理", description: "行政班与学生列表（）", href: "/class/home" },
      { id: "assign", title: "作业任务", description: "发布与管理作业任务", href: "/teacher/assignments" },
      { id: "grading", title: "报告批改", description: "进入批改队列", href: "/teacher/reports" },
    ],
  },
  [UserRole.RESEARCHER]: {
    title: "教研工作台",
    subtitle: "内容治理与评审入口",
    cards: [
      { id: "review", title: "实验方案评审", description: "处理待评审队列", href: "/researcher/reviews" },
      { id: "curriculum", title: "实验列表", description: "标准实验目录", href: "/console/settings/experiments" },
    ],
  },
  [UserRole.SCHOOL_ADMIN]: {
    title: "校级管理员工作台",
    subtitle: "校内组织与运行概览",
    cards: [
      { id: "users", title: "用户管理", description: "账号管理与导入导出", href: "/console/settings/system/users" },
      { id: "org", title: "组织架构", description: "学校/班级组织结构", href: "/console/settings/system/organizations" },
      { id: "notify", title: "学校通知", description: "发布与查看通知", href: "/console/operations/notifications" },
    ],
  },
  [UserRole.DISTRICT_ADMIN]: {
    title: "区级管理员工作台",
    subtitle: "区域治理与数据入口",
    cards: [
      { id: "overview", title: "全区看板", description: "区域实验开展总览", href: "/district/overview" },
      { id: "audit", title: "操作记录", description: "审计与留痕（）", href: "/console/operations/audit-log" },
      { id: "dir", title: "实验项目", description: "实验目录与条目治理", href: "/console/settings/experiments" },
    ],
  },
  [UserRole.STUDENT]: {
    title: "学生工作台",
    subtitle: "今天要做什么",
    cards: [
      { id: "tasks", title: "我的任务", description: "查看待完成的实验任务", href: "/experiments" },
      { id: "challenge", title: "实验闯关", description: "闯关式练习与挑战", href: "/student/experiment-challenge" },
      { id: "footprints", title: "成长足迹", description: "学习轨迹与成果", href: "/student/footprints" },
    ],
  },
  [UserRole.PARENT]: {
    title: "家长工作台",
    subtitle: "关注孩子的进度与报告",
    cards: [
      { id: "tasks", title: "任务中心", description: "查看孩子待完成事项", href: "/parent/tasks" },
      { id: "lab", title: "家庭实验室", description: "家庭实验与陪伴建议", href: "/parent/lab" },
      { id: "progress", title: "孩子进度", description: "进度与足迹入口", href: "/student/footprints" },
    ],
  },
  [UserRole.SUPER_ADMIN]: {
    title: "超级管理员工作台",
    subtitle: "联调入口（）",
    cards: [
      { id: "roles", title: "角色与权限", description: "RBAC 权限矩阵", href: "/console/settings/system/roles" },
      { id: "overview", title: "全区看板", description: "区域实验开展总览", href: "/district/overview" },
      { id: "exp", title: "实验课程管理", description: "实验课程流转与状态", href: "/experiment-manage" },
    ],
  },
};

