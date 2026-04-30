export type PagePermissionMode = "READ" | "WRITE";

export type PagePermissionDefinition = {
  menuCode: string;
  path: string;
  label: string;
};

/**
 * 第一版静态页面权限目录。
 * 说明：当前仍采用手工维护，不做自动收集。
 */
export const PAGE_PERMISSIONS: readonly PagePermissionDefinition[] = [
  { menuCode: "console_system_users", path: "/console/settings/system/users", label: "用户管理" },
  { menuCode: "console_system_roles", path: "/console/settings/system/roles", label: "角色管理" },
  { menuCode: "console_system_orgs", path: "/console/settings/system/organizations", label: "组织管理" },
  { menuCode: "console_system_parent_bindings", path: "/console/settings/system/parent-bindings", label: "家长绑定审核" },
  { menuCode: "console_settings_experiments", path: "/console/settings/experiments", label: "实验管理" },
  { menuCode: "console_settings_textbooks", path: "/console/settings/textbooks", label: "教材管理" },
  { menuCode: "console_settings_dictionaries", path: "/console/settings/dictionaries", label: "字典管理" },
  { menuCode: "console_assessment_questions", path: "/console/assessment/questions", label: "题库管理" },
  { menuCode: "console_operations_dashboard", path: "/console/operations/dashboard", label: "运维中心" },
  { menuCode: "console_operations_dict_sync", path: "/console/operations/dict-sync", label: "业务字典同步" },
  { menuCode: "console_operations_data_export", path: "/console/operations/data-export", label: "数据导出" },
  { menuCode: "console_operations_cache_mgmt", path: "/console/operations/cache-mgmt", label: "缓存管理" },
  { menuCode: "console_operations_consistency", path: "/console/operations/consistency", label: "一致性检查" },
  { menuCode: "console_operations_audit_log", path: "/console/operations/audit-log", label: "操作记录" },
  { menuCode: "console_operations_notifications", path: "/console/operations/notifications", label: "学校通知" },
  { menuCode: "teacher_my_teaching_class", path: "/teacher/my-teaching-class", label: "我的教学班级" },
  { menuCode: "teacher_classroom_teaching", path: "/teacher/classroom-teaching", label: "我的课堂" },
  { menuCode: "teacher_experiment_manage", path: "/experiment-manage", label: "实验管理" },
  { menuCode: "teacher_experiment_preview", path: "/teacher/experiment-preview", label: "实验预览" },
  { menuCode: "teacher_question_bank", path: "/teacher/question-bank", label: "题库管理" },
  { menuCode: "teacher_research_group", path: "/teacher/research-project-groups", label: "教研组管理" },
  { menuCode: "teacher_class_config", path: "/system-manage/teacher-class", label: "教课关系管理" },
  { menuCode: "teacher_publish_task", path: "/experiment-manage/publish", label: "实验作业分配" },
  { menuCode: "researcher_experiments", path: "/console/settings/experiments", label: "实验评审/管理" },
  { menuCode: "researcher_textbooks", path: "/console/settings/textbooks", label: "教材管理" },
  { menuCode: "researcher_dictionaries", path: "/console/settings/dictionaries", label: "字典管理" },
  { menuCode: "researcher_question_bank", path: "/console/assessment/questions", label: "题库管理" },
  { menuCode: "researcher_research_group", path: "/teacher/research-project-groups", label: "教研组管理" },
  { menuCode: "student_experiments", path: "/experiments", label: "实验库" },
  { menuCode: "student_challenge", path: "/student/experiment-challenge", label: "实验闯关" },
  { menuCode: "student_footprints", path: "/student/footprints", label: "成长足迹" },
  { menuCode: "parent_tasks", path: "/parent/tasks", label: "任务中心" },
  { menuCode: "parent_lab", path: "/parent/lab", label: "家庭实验室" },
  { menuCode: "home", path: "/", label: "首页" },
  { menuCode: "messages", path: "/messages", label: "消息" },
  { menuCode: "profile", path: "/profile", label: "个人中心" },
  { menuCode: "settings", path: "/settings", label: "系统设置" },
  { menuCode: "experimental_materials", path: "/experimental-materials", label: "实验材料库" },
  { menuCode: "resources", path: "/resources", label: "实验工坊" },
];

export function buildPagePermissionCode(menuCode: string, mode: PagePermissionMode): string {
  return `PAGE_${menuCode}_${mode}`;
}

export function findPagePermissionByPath(path: string): PagePermissionDefinition | undefined {
  return PAGE_PERMISSIONS.find((item) => item.path === path);
}
