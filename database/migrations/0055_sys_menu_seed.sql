-- ==========================================================
-- 0055: 系统菜单目录初始化（可单独执行）
-- 适配文档：docs/auth/05-system-role-menu-governance-final.md
-- 说明：仅初始化 sys_menu，便于独立验收菜单目录。
-- ==========================================================

INSERT INTO `sys_menu`
(`parent_id`, `menu_name`, `menu_code`, `menu_type`, `path`, `component`, `sort_order`, `status`, `comments`, `create_time`)
VALUES
(NULL, '工作台', 'dashboard', 'page', '/dashboard', NULL, 10, 'y', '工作台', NOW()),
(NULL, '个人中心', 'profile', 'page', '/profile', NULL, 20, 'y', '个人中心', NOW()),
(NULL, '用户管理', 'user_management', 'page', '/user-management', NULL, 30, 'y', '治理层-用户管理', NOW()),
(NULL, '角色管理', 'role_management', 'page', '/role-management', NULL, 40, 'y', '治理层-角色管理', NOW()),
(NULL, '组织管理', 'org_management', 'page', '/org-management', NULL, 50, 'y', '治理层-组织管理', NOW()),
(NULL, '家长绑定审核', 'parent_bindings', 'page', '/parent-bindings', NULL, 60, 'y', '治理层-家长绑定审核', NOW()),
(NULL, '班级管理', 'class_management', 'page', '/class-management', NULL, 70, 'y', '治理层-班级管理（含教师分配）', NOW()),
(NULL, '运维中心', 'ops_dashboard', 'page', '/ops/dashboard', NULL, 80, 'y', '治理层-运维中心', NOW()),
(NULL, '学校统计', 'school_statistics', 'page', '/school-statistics', NULL, 90, 'y', '治理层-学校统计', NOW()),
(NULL, '区域统计', 'district_statistics', 'page', '/district-statistics', NULL, 100, 'y', '治理层-区域统计', NOW()),
(NULL, '实验管理', 'teacher_experiment_manager', 'page', '/teacher-experiment-manager', NULL, 110, 'y', '业务层-实验管理', NOW()),
(NULL, '教材管理', 'textbook_management', 'page', '/textbook-management', NULL, 120, 'y', '业务层-教材管理', NOW()),
(NULL, '我的教学班级', 'teacher_classroom', 'page', '/teacher-classroom', NULL, 130, 'y', '教师端-我的教学班级', NOW()),
(NULL, '我的课堂/作业', 'teacher_tasks', 'page', '/teacher-tasks', NULL, 140, 'y', '教师端-我的课堂/作业', NOW()),
(NULL, '任务中心', 'student_tasks', 'page', '/student-tasks', NULL, 150, 'y', '学生端-任务中心', NOW()),
(NULL, '成长足迹', 'student_growth', 'page', '/student-growth', NULL, 160, 'y', '学生端-成长足迹', NOW()),
(NULL, '家庭实验室', 'family_lab', 'page', '/family-lab', NULL, 170, 'y', '家长端-家庭实验室', NOW()),
(NULL, '实验审核', 'review_experiments', 'page', '/review/experiments', NULL, 180, 'y', '业务层-实验审核', NOW()),
(NULL, '作品审核', 'review_student_works', 'page', '/review/student-works', NULL, 190, 'y', '治理层-学生作品审核', NOW()),
(NULL, '课题组审核', 'review_research_groups', 'page', '/review/research-groups', NULL, 200, 'y', '业务层-课题组审核', NOW()),
(NULL, '资源中心', 'resource_center', 'page', '/resource-center', NULL, 210, 'y', '业务层-资源中心', NOW()),
(NULL, '实验报告', 'parent_reports', 'page', '/parent/reports', NULL, 220, 'y', '家长端-实验报告', NOW()),
(NULL, '实验广场', 'experiment_square', 'page', '/experiment-square', NULL, 230, 'y', '通用-实验广场', NOW()),
(NULL, '我的课题组', 'my_research_groups', 'page', '/my-research-groups', NULL, 240, 'y', '教师端-我的课题组', NOW())
ON DUPLICATE KEY UPDATE
  `menu_name` = VALUES(`menu_name`),
  `menu_type` = VALUES(`menu_type`),
  `path` = VALUES(`path`),
  `component` = VALUES(`component`),
  `sort_order` = VALUES(`sort_order`),
  `status` = VALUES(`status`),
  `comments` = VALUES(`comments`);
