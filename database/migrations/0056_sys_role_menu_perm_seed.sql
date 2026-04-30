-- ==========================================================
-- 0056: 系统角色菜单权限默认初始化（可单独执行）
-- 适配文档：docs/auth/05-system-role-menu-governance-final.md
-- 说明：仅初始化 sys_role_menu_perm，需先执行 0055。
-- ==========================================================

-- 系统管理员
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

-- 区级管理员
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

-- 校级管理员
INSERT IGNORE INTO `sys_role_menu_perm`
(`seq_id`, `role_id`, `menu_id`, `can_read`, `can_write`, `status`, `create_time`)
SELECT CONCAT('RM_', UUID()), 'Role_School_Admin', m.menu_id,
       1,
       CASE
         WHEN m.menu_code IN ('user_management','class_management','parent_bindings','school_statistics','review_student_works') THEN 1
         ELSE 0
       END,
       'y', NOW()
FROM `sys_menu` m
WHERE m.menu_code IN (
  'user_management','class_management','parent_bindings','school_statistics','review_student_works',
  'teacher_classroom','teacher_tasks','teacher_experiment_manager','experiment_square','profile','dashboard'
);

-- 教研员
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

-- 教师
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

-- 学生
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

-- 家长
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
