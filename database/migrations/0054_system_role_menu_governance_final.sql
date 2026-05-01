-- ==========================================================
-- 0054: 系统角色功能菜单治理最终版初始化
-- 适配文档：docs/auth/05-system-role-menu-governance-final.md
-- 说明：
-- 1) 先写 sys_menu，再写 sys_role_menu_perm。
-- 2) menu_code 统一采用 snake_case。
-- 3) 默认授权采用白名单逐条落库。
-- ==========================================================

-- ----------------------------------------------------------
-- 1. 初始化系统菜单目录
-- ----------------------------------------------------------
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

-- ----------------------------------------------------------
-- 2. 系统管理员默认：治理类全量 + 审核类只读
-- ----------------------------------------------------------
INSERT IGNORE INTO `sys_role_menu_perm`
(`seq_id`, `role_id`, `menu_id`, `can_read`, `can_write`, `status`, `create_time`)
SELECT CONCAT('RM_', UUID()), 'Role_Sys_Admin', m.menu_id,
       1,
       CASE
         WHEN m.menu_code IN ('user_management','role_management','org_management','parent_bindings','class_management','ops_dashboard','school_statistics','district_statistics') THEN 1
         ELSE 0
       END,
       'y', NOW()
FROM `sys_menu` m
WHERE m.menu_code IN (
  'dashboard','profile','user_management','role_management','org_management','parent_bindings','class_management',
  'ops_dashboard','school_statistics','district_statistics','teacher_experiment_manager','textbook_management',
  'teacher_classroom','teacher_tasks','student_tasks','student_growth','family_lab','review_experiments',
  'review_student_works','review_research_groups','resource_center','parent_reports','experiment_square','my_research_groups'
);

-- ----------------------------------------------------------
-- 3. 区级管理员默认权限
-- ----------------------------------------------------------
INSERT IGNORE INTO `sys_role_menu_perm`
(`seq_id`, `role_id`, `menu_id`, `can_read`, `can_write`, `status`, `create_time`)
SELECT CONCAT('RM_', UUID()), 'Role_District_Admin', m.menu_id,
       1,
       CASE
         WHEN m.menu_code IN ('user_management','org_management','parent_bindings','class_management','school_statistics','district_statistics') THEN 1
         ELSE 0
       END,
       'y', NOW()
FROM `sys_menu` m
WHERE m.menu_code IN (
  'user_management','org_management','parent_bindings','class_management','school_statistics','district_statistics'
);

-- ----------------------------------------------------------
-- 4. 校级管理员默认权限
-- ----------------------------------------------------------
INSERT IGNORE INTO `sys_role_menu_perm`
(`seq_id`, `role_id`, `menu_id`, `can_read`, `can_write`, `status`, `create_time`)
SELECT CONCAT('RM_', UUID()), 'Role_School_Admin', m.menu_id,
       1,
       CASE
         WHEN m.menu_code IN ('org_management','user_management','class_management','parent_bindings','school_statistics','review_student_works') THEN 1
         ELSE 0
       END,
       'y', NOW()
FROM `sys_menu` m
WHERE m.menu_code IN (
  'org_management','user_management','class_management','parent_bindings','school_statistics','review_student_works',
  'teacher_classroom','teacher_tasks','teacher_experiment_manager','experiment_square','profile','dashboard'
);

-- ----------------------------------------------------------
-- 5. 教研员默认权限
-- ----------------------------------------------------------
INSERT IGNORE INTO `sys_role_menu_perm`
(`seq_id`, `role_id`, `menu_id`, `can_read`, `can_write`, `status`, `create_time`)
SELECT CONCAT('RM_', UUID()), 'Role_Researcher', m.menu_id,
       1,
       CASE
         WHEN m.menu_code IN ('teacher_experiment_manager','textbook_management','review_experiments','review_research_groups','resource_center','teacher_tasks') THEN 1
         ELSE 0
       END,
       'y', NOW()
FROM `sys_menu` m
WHERE m.menu_code IN (
  'teacher_experiment_manager','textbook_management','review_experiments','review_research_groups','resource_center',
  'experiment_square','profile','dashboard','teacher_tasks'
);

-- ----------------------------------------------------------
-- 6. 教师默认权限
-- ----------------------------------------------------------
INSERT IGNORE INTO `sys_role_menu_perm`
(`seq_id`, `role_id`, `menu_id`, `can_read`, `can_write`, `status`, `create_time`)
SELECT CONCAT('RM_', UUID()), 'Role_Teacher', m.menu_id,
       1,
       CASE
         WHEN m.menu_code IN ('teacher_classroom','teacher_tasks','teacher_experiment_manager','my_research_groups','student_tasks') THEN 1
         ELSE 0
       END,
       'y', NOW()
FROM `sys_menu` m
WHERE m.menu_code IN (
  'teacher_classroom','teacher_tasks','teacher_experiment_manager','my_research_groups','resource_center',
  'experiment_square','student_tasks','profile','dashboard','textbook_management'
);

-- ----------------------------------------------------------
-- 7. 学生默认权限
-- ----------------------------------------------------------
INSERT IGNORE INTO `sys_role_menu_perm`
(`seq_id`, `role_id`, `menu_id`, `can_read`, `can_write`, `status`, `create_time`)
SELECT CONCAT('RM_', UUID()), 'Role_Student', m.menu_id,
       1,
       CASE
         WHEN m.menu_code IN ('student_tasks','experiment_square') THEN 1
         ELSE 0
       END,
       'y', NOW()
FROM `sys_menu` m
WHERE m.menu_code IN (
  'student_tasks','student_growth','experiment_square','profile','dashboard'
);

-- ----------------------------------------------------------
-- 8. 家长默认权限
-- ----------------------------------------------------------
INSERT IGNORE INTO `sys_role_menu_perm`
(`seq_id`, `role_id`, `menu_id`, `can_read`, `can_write`, `status`, `create_time`)
SELECT CONCAT('RM_', UUID()), 'Role_Parent', m.menu_id,
       1,
       CASE
         WHEN m.menu_code IN ('family_lab') THEN 1
         ELSE 0
       END,
       'y', NOW()
FROM `sys_menu` m
WHERE m.menu_code IN (
  'family_lab','parent_reports','student_growth','experiment_square','profile','dashboard','student_tasks'
);

-- ----------------------------------------------------------
-- 9. 说明：
--    - 以上仅为默认预设，可由权限配置台后续调整。
--    - 若需要分组折叠，可后续通过 parent_id 扩展。
-- ----------------------------------------------------------
