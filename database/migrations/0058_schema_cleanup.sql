-- ==========================================================
-- 0058: 数据库整理迁移
-- 修正 sys_menu 路径、清理重复菜单、补齐索引
-- ==========================================================

-- 1. 清理 0052 旧版菜单（与 05 方案 menu_code 重复的项）
--    保留 05 方案的 menu_code，删除旧版同名菜单。
--    前置检查：确保 05 方案菜单存在，避免误删后无替代。
DELETE FROM `sys_role_menu_perm`
WHERE `menu_id` IN (
  SELECT `menu_id` FROM `sys_menu`
  WHERE `menu_code` IN (
    'console_system_users',     -- 重复 user_management
    'console_system_roles',     -- 重复 role_management
    'console_system_orgs',      -- 重复 org_management
    'console_system_parent_bindings', -- 重复 parent_bindings
    'console_settings_textbooks', -- 重复 textbook_management
    'console_settings_experiments', -- 重复 teacher_experiment_manager
    'console_settings_dictionaries', -- 无 05 方案替代？保留
    'console_assessment_questions'   -- 无 05 方案替代？保留
  )
  AND `menu_id` NOT IN (
    SELECT `menu_id` FROM `sys_menu`
    WHERE `menu_code` IN (
      'user_management', 'role_management', 'org_management',
      'parent_bindings', 'textbook_management', 'teacher_experiment_manager'
    )
  )
);

-- delete orphan rows where the menu has already been removed by the previous step plus 0055
DELETE FROM `sys_role_menu_perm`
WHERE `menu_id` NOT IN (SELECT `menu_id` FROM `sys_menu`);

-- 2. 修正 05 方案 sys_menu 的 path 为实际 Next.js 路由
UPDATE `sys_menu` SET `path` = '/console/settings/system/users'    WHERE `menu_code` = 'user_management';
UPDATE `sys_menu` SET `path` = '/console/settings/system/roles'    WHERE `menu_code` = 'role_management';
UPDATE `sys_menu` SET `path` = '/console/settings/system/organizations' WHERE `menu_code` = 'org_management';
UPDATE `sys_menu` SET `path` = '/console/settings/system/parent-bindings' WHERE `menu_code` = 'parent_bindings';
UPDATE `sys_menu` SET `path` = '/system-manage/teacher-class'      WHERE `menu_code` = 'class_management';
UPDATE `sys_menu` SET `path` = '/console/operations/dashboard'     WHERE `menu_code` = 'ops_dashboard';
UPDATE `sys_menu` SET `path` = '/school-statistics'               WHERE `menu_code` = 'school_statistics';
UPDATE `sys_menu` SET `path` = '/district-statistics'             WHERE `menu_code` = 'district_statistics';
UPDATE `sys_menu` SET `path` = '/experiment-manage'               WHERE `menu_code` = 'teacher_experiment_manager';
UPDATE `sys_menu` SET `path` = '/console/settings/textbooks'      WHERE `menu_code` = 'textbook_management';
UPDATE `sys_menu` SET `path` = '/teacher-classroom'              WHERE `menu_code` = 'teacher_classroom';
UPDATE `sys_menu` SET `path` = '/teacher-tasks'                  WHERE `menu_code` = 'teacher_tasks';
UPDATE `sys_menu` SET `path` = '/experiments'                    WHERE `menu_code` = 'student_tasks';
UPDATE `sys_menu` SET `path` = '/student/footprints'            WHERE `menu_code` = 'student_growth';
UPDATE `sys_menu` SET `path` = '/parent/lab'                    WHERE `menu_code` = 'family_lab';
UPDATE `sys_menu` SET `path` = '/console/review/experiments'    WHERE `menu_code` = 'review_experiments';
UPDATE `sys_menu` SET `path` = '/console/review/student-works'  WHERE `menu_code` = 'review_student_works';
UPDATE `sys_menu` SET `path` = '/console/review/research-groups' WHERE `menu_code` = 'review_research_groups';
UPDATE `sys_menu` SET `path` = '/resources'                     WHERE `menu_code` = 'resource_center';
UPDATE `sys_menu` SET `path` = '/parent/reports'               WHERE `menu_code` = 'parent_reports';
UPDATE `sys_menu` SET `path` = '/experiment-square'            WHERE `menu_code` = 'experiment_square';
UPDATE `sys_menu` SET `path` = '/teacher/research-project-groups' WHERE `menu_code` = 'my_research_groups';

-- 3. 补齐常用索引
ALTER TABLE `exp_msg`
  ADD INDEX IF NOT EXISTS `idx_exp_msg_create_user_type`(`create_user_type` ASC) USING BTREE,
  ADD INDEX IF NOT EXISTS `idx_exp_msg_status`(`status` ASC) USING BTREE;

ALTER TABLE `subject_group`
  ADD INDEX IF NOT EXISTS `idx_subject_group_review_status`(`review_status` ASC) USING BTREE;

-- 4. 为 sys_log 添加复合索引（按类型+时间查询优化）
ALTER TABLE `sys_log`
  ADD INDEX IF NOT EXISTS `idx_sys_log_type_time`(`log_type` ASC, `log_time` ASC) USING BTREE;
