export type PagePermissionMode = "READ" | "WRITE";

export type PagePermissionDefinition = {
  menuCode: string;
  path: string;
  label: string;
};

/**
 * 页面权限目录（系统级全量）。
 *
 * 与前端 frontend/src/lib/permissions/page-permissions.ts 保持完全一致，
 * 保证 resolvePermissionCodes("Role_Sys_Admin") 生成正确的 PAGE_* 权限码。
 *
 * 以下为 0055 方案的 24 项新版 menu_code + 2 项无替换的遗留页面。
 * 0052 旧版 menu_code（console_system_*、teacher_*、researcher_* 等）已于迁移 0062 禁用。
 */
export const PAGE_PERMISSIONS: readonly PagePermissionDefinition[] = [
  { menuCode: "dashboard", path: "/dashboard", label: "工作台" },
  { menuCode: "profile", path: "/profile", label: "个人中心" },
  { menuCode: "user_management", path: "/console/settings/system/users", label: "用户管理" },
  { menuCode: "role_management", path: "/console/settings/system/roles", label: "角色管理" },
  { menuCode: "org_management", path: "/console/settings/system/organizations", label: "组织管理" },
  { menuCode: "parent_bindings", path: "/console/settings/system/parent-bindings", label: "家长绑定审核" },
  { menuCode: "class_management", path: "/system-manage/teacher-class", label: "班级管理" },
  { menuCode: "ops_dashboard", path: "/console/operations/dashboard", label: "运维中心" },
  { menuCode: "school_statistics", path: "/school-statistics", label: "学校统计" },
  { menuCode: "district_statistics", path: "/district-statistics", label: "区域统计" },
  { menuCode: "teacher_experiment_manager", path: "/experiment-manage", label: "实验管理" },
  { menuCode: "textbook_management", path: "/console/settings/textbooks", label: "教材管理" },
  { menuCode: "teacher_classroom", path: "/teacher/assignments", label: "我的教学班级" },
  { menuCode: "teacher_tasks", path: "/teacher-tasks", label: "我的课堂 / 作业" },
  { menuCode: "student_tasks", path: "/experiments", label: "任务中心" },
  { menuCode: "student_growth", path: "/student/footprints", label: "成长足迹" },
  { menuCode: "family_lab", path: "/parent/lab", label: "家庭实验室" },
  { menuCode: "review_experiments", path: "/console/review/experiments", label: "实验审核" },
  { menuCode: "review_student_works", path: "/console/review/student-works", label: "作品审核" },
  { menuCode: "review_research_groups", path: "/console/review/research-groups", label: "课题组审核" },
  { menuCode: "resource_center", path: "/resources", label: "资源中心" },
  { menuCode: "parent_reports", path: "/parent/reports", label: "实验报告" },
  { menuCode: "experiment_square", path: "/experiment-square", label: "实验广场" },
  { menuCode: "my_research_groups", path: "/teacher/research-project-groups", label: "我的课题组" },
  // 0063 补充：原有真实页面但 0062 误禁用或从未入库
  { menuCode: "experiment_catalog", path: "/console/settings/experiments", label: "实验列表" },
  { menuCode: "teaching_research_groups", path: "/researcher/teaching-research-groups", label: "教研组管理" },
  { menuCode: "experimental_materials", path: "/experimental-materials", label: "实验材料库" },
  { menuCode: "teacher_experiment_preview", path: "/teacher/experiment-preview", label: "实验预览" },
  { menuCode: "teacher_question_bank", path: "/teacher/question-bank", label: "题库管理" },
  { menuCode: "student_challenge", path: "/student/experiment-challenge", label: "实验闯关" },
  { menuCode: "parent_task_center", path: "/parent/tasks", label: "任务中心" },
  { menuCode: "messages_center", path: "/messages", label: "消息中心" },
  { menuCode: "user_settings", path: "/settings", label: "系统设置" },
  // 以下两项为 0052 旧版菜单中无 0055 方案替代、且页面仍在使用的遗留项
  { menuCode: "console_settings_dictionaries", path: "/console/settings/dictionaries", label: "字典管理" },
  { menuCode: "console_assessment_questions", path: "/console/assessment/questions", label: "题库管理" },
];

export function buildPagePermissionCode(menuCode: string, mode: PagePermissionMode): string {
  return `PAGE_${menuCode}_${mode}`;
}

export function findPagePermissionByPath(path: string): PagePermissionDefinition | undefined {
  return PAGE_PERMISSIONS.find((item) => item.path === path);
}
