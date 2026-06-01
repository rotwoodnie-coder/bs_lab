export const NAV_LABELS = {
  home: "首页",
  "class-tasks": "实验库",
  "student-challenge": "实验闯关",
  footprints: "成长足迹",
  "mgmt-my-tasks": "我的任务",
  "mgmt-child-progress": "孩子进度",
  "mgmt-parent-tasks": "任务中心",
  "parent-lab": "家庭实验室",
  "teacher-home": "工作台",
  "mgmt-class": "班级管理",
  "my-classes": "教师授课管理",
  "teacher-assignments": "作业任务",
  "mgmt-grade": "报告批改",
  "exp-mgmt": "实验课程管理",
  "exp-question-bank": "实验题库",
  "community-court": "社区与法庭",
  "virtual-experiment": "虚拟实验管理",
  "teacher-materials": "实验素材库",
  "mgmt-materials-lib": "实验材料库",
  "console-system-base": "用户管理",
  "wb-all": "工作台直达",
  "wb-student": "学生工作台",
  "wb-parent": "家长工作台",
  "wb-teacher": "教师工作台",
  "wb-researcher": "教研工作台",
  "wb-school-admin": "校级管理员工作台",
  "wb-district-admin": "区级管理员工作台",
  "wb-super-admin": "超级管理员工作台",
  "sys-orgs": "组织架构",
  "sys-roles": "角色与权限",
  "console-cfg-incentives": "积分与激励",
  "plat-notify": "学校通知",
  "plat-audit": "操作记录",
  "console-res-subject": "教学架构管理",
  "console-res-experiments": "实验列表",
  "console-review-experiments": "实验评审",
  "console-review-student-works": "作品审核",
  "console-review-research-groups": "课题组审核",
  "console-ai-strategies": "AI 引导语与策略",
  "console-reports-templates": "实验报告模板",
  "console-analytics-district": "做实验数据一览",
  "console-social-review": "评价与审核",
  "console-social-dynamics": "实验圈动态",
  "console-social-court": "小法庭",
  "console-social-topics": "话题与挑战",
  "console-review-project-groups": "课题组校验",
  "researcher-teaching-research-groups": "教研组管理",
  "research-project-groups-console": "课题组管理",
  "teacher-research-project-groups": "教研组管理",
  "admin-subject-config": "实验领域",
  "admin-simulation-dev": "模拟开发配置",
  "dist-overview": "全区看板",
  "ops-dashboard": "运维概览",
  "ops-dict-sync": "业务字典同步",
  "ops-data-export": "数据导出",
  "ops-cache-mgmt": "缓存管理",
  "ops-consistency": "数据一致性检查",
  "ops-auto-heal": "自动修复",
  messages: "消息",
  profile: "个人中心",
  settings: "系统设置",
  "ai-assistant": "AI 助教",
} as const;

export type NavLabelId = keyof typeof NAV_LABELS;

export function getNavLabel(id: NavLabelId): string;
export function getNavLabel(id: string, fallback: string): string;
export function getNavLabel(id: string, fallback?: string): string {
  const label = (NAV_LABELS as Record<string, string>)[id];
  if (label) return label;
  if (!fallback) {
    throw new Error(`[nav-labels] Missing label for nav id: ${id}`);
  }
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[nav-labels] Missing label for nav id: ${id}`);
  }
  return fallback;
}
