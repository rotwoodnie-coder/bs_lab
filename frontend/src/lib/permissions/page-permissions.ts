export type PagePermissionMode = "READ" | "WRITE";

export type PagePermissionDefinition = {
  menuCode: string;
  path: string;
  label: string;
  group: string;
};

export type PermissionPresetRole =
  | "Role_Sys_Admin"
  | "Role_District_Admin"
  | "Role_School_Admin"
  | "Role_Researcher"
  | "Role_Teacher"
  | "Role_Student"
  | "Role_Parent";

export const PAGE_PERMISSIONS: readonly PagePermissionDefinition[] = [
  { group: "通用", menuCode: "dashboard", path: "/dashboard", label: "工作台" },
  { group: "通用", menuCode: "profile", path: "/profile", label: "个人中心" },
  { group: "治理层", menuCode: "user_management", path: "/user-management", label: "用户管理" },
  { group: "治理层", menuCode: "role_management", path: "/role-management", label: "角色管理" },
  { group: "治理层", menuCode: "org_management", path: "/org-management", label: "组织管理" },
  { group: "治理层", menuCode: "parent_bindings", path: "/parent-bindings", label: "家长绑定审核" },
  { group: "治理层", menuCode: "class_management", path: "/class-management", label: "班级管理" },
  { group: "治理层", menuCode: "ops_dashboard", path: "/ops/dashboard", label: "运维中心" },
  { group: "治理层", menuCode: "school_statistics", path: "/school-statistics", label: "学校统计" },
  { group: "治理层", menuCode: "district_statistics", path: "/district-statistics", label: "区域统计" },
  { group: "业务层", menuCode: "teacher_experiment_manager", path: "/teacher-experiment-manager", label: "实验管理" },
  { group: "业务层", menuCode: "textbook_management", path: "/textbook-management", label: "教材管理" },
  { group: "业务层", menuCode: "teacher_classroom", path: "/teacher-classroom", label: "我的教学班级" },
  { group: "业务层", menuCode: "teacher_tasks", path: "/teacher-tasks", label: "我的课堂 / 作业" },
  { group: "使用层", menuCode: "student_tasks", path: "/student-tasks", label: "任务中心" },
  { group: "使用层", menuCode: "student_growth", path: "/student-growth", label: "成长足迹" },
  { group: "使用层", menuCode: "family_lab", path: "/family-lab", label: "家庭实验室" },
  { group: "业务层", menuCode: "review_experiments", path: "/review/experiments", label: "实验审核" },
  { group: "治理层", menuCode: "review_student_works", path: "/review/student-works", label: "作品审核" },
  { group: "业务层", menuCode: "review_research_groups", path: "/review/research-groups", label: "课题组审核" },
  { group: "业务层", menuCode: "resource_center", path: "/resource-center", label: "资源中心" },
  { group: "使用层", menuCode: "parent_reports", path: "/parent/reports", label: "实验报告" },
  { group: "通用", menuCode: "experiment_square", path: "/experiment-square", label: "实验广场" },
  { group: "业务层", menuCode: "my_research_groups", path: "/my-research-groups", label: "我的课题组" },
];

export function buildPagePermissionCode(menuCode: string, mode: PagePermissionMode): string {
  return `PAGE_${menuCode}_${mode}`;
}

export function findPagePermissionByPath(path: string): PagePermissionDefinition | undefined {
  return PAGE_PERMISSIONS.find((item) => item.path === path);
}

export function hasPagePermission(permissions: readonly string[], menuCode: string, mode: PagePermissionMode): boolean {
  return permissions.includes(buildPagePermissionCode(menuCode, mode));
}

export const DEFAULT_PRESET_ROLES: readonly PermissionPresetRole[] = [
  "Role_Sys_Admin",
  "Role_District_Admin",
  "Role_School_Admin",
  "Role_Researcher",
  "Role_Teacher",
  "Role_Student",
  "Role_Parent",
];

export function getPermissionPresetByRole(role: PermissionPresetRole): Record<string, { read: boolean; write: boolean }> {
  const preset: Record<string, { read: boolean; write: boolean }> = {};
  for (const page of PAGE_PERMISSIONS) preset[page.menuCode] = { read: false, write: false };
  const set = (codes: string[], writeCodes: string[] = codes) => {
    for (const code of codes) preset[code] = { read: true, write: false };
    for (const code of writeCodes) preset[code] = { read: true, write: true };
  };
  switch (role) {
    case "Role_Sys_Admin": set(PAGE_PERMISSIONS.map((p) => p.menuCode), PAGE_PERMISSIONS.map((p) => p.menuCode)); return preset;
    case "Role_District_Admin": set(["user_management","org_management","parent_bindings","class_management","school_statistics","district_statistics"],["user_management","org_management","parent_bindings","class_management","school_statistics","district_statistics"]); return preset;
    case "Role_School_Admin": set(["user_management","class_management","parent_bindings","school_statistics","review_student_works","teacher_classroom","teacher_tasks","teacher_experiment_manager","experiment_square","profile","dashboard"],["user_management","class_management","parent_bindings","school_statistics","review_student_works"]); return preset;
    case "Role_Researcher": set(["teacher_experiment_manager","textbook_management","review_experiments","review_research_groups","resource_center","teacher_tasks","experiment_square","profile","dashboard"],["teacher_experiment_manager","textbook_management","review_experiments","review_research_groups"]); return preset;
    case "Role_Teacher": set(["teacher_classroom","teacher_tasks","teacher_experiment_manager","my_research_groups","resource_center","experiment_square","student_tasks","profile","dashboard","textbook_management"],["teacher_classroom","teacher_tasks","teacher_experiment_manager","my_research_groups","student_tasks"]); return preset;
    case "Role_Student": set(["student_tasks","student_growth","experiment_square","profile","dashboard"],["student_tasks"]); return preset;
    case "Role_Parent": set(["family_lab","parent_reports","student_growth","experiment_square","profile","dashboard","student_tasks"],["family_lab"]); return preset;
    default: return preset;
  }
}
