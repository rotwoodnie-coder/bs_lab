-- ==========================================================
-- 0053: 7大角色默认菜单归属与权限预设
-- 说明：这是初始化脚本模板，按系统级全量目录 + 角色职责边界落库
-- 规则：最终以 sys_role_menu_perm 为准，可后续在权限台中调整
-- ==========================================================

-- 建议执行前先确认 sys_menu 已经完成 0052 初始化
-- 并确认 data_role 中存在以下角色：
-- Role_Sys_Admin
-- Role_District_Admin
-- Role_School_Admin
-- Role_Researcher
-- Role_Teacher
-- Role_Student
-- Role_Parent

START TRANSACTION;

-- ------------------------------
-- 系统管理员：全量目录，默认全开
-- ------------------------------
INSERT INTO sys_role_menu_perm (seq_id, role_id, menu_id, can_read, can_write, status, create_time)
SELECT
  CONCAT('RM_', 'Role_Sys_Admin', '_', m.menu_id) AS seq_id,
  'Role_Sys_Admin' AS role_id,
  m.menu_id,
  1 AS can_read,
  1 AS can_write,
  'y' AS status,
  NOW() AS create_time
FROM sys_menu m
WHERE m.menu_code IN (
  'console_system_users','console_system_roles','console_system_orgs','console_system_parent_bindings',
  'console_settings_experiments','console_settings_textbooks','console_settings_dictionaries','console_assessment_questions',
  'console_operations_dashboard','console_operations_dict_sync','console_operations_data_export','console_operations_cache_mgmt','console_operations_consistency','console_operations_audit_log','console_operations_notifications',
  'teacher_my_teaching_class','teacher_classroom_teaching','teacher_experiment_manage','teacher_experiment_preview','teacher_question_bank','teacher_research_group','teacher_class_config','teacher_publish_task',
  'researcher_experiments','researcher_textbooks','researcher_dictionaries','researcher_question_bank','researcher_research_group',
  'student_experiments','student_challenge','student_footprints','parent_tasks','parent_lab',
  'home','messages','profile','settings','experimental_materials','resources'
)
ON DUPLICATE KEY UPDATE can_read = VALUES(can_read), can_write = VALUES(can_write), status = VALUES(status), update_time = NOW();

-- ------------------------------
-- 区管：区域治理 + 学校治理 + 部分资源治理
-- ------------------------------
INSERT INTO sys_role_menu_perm (seq_id, role_id, menu_id, can_read, can_write, status, create_time)
SELECT
  CONCAT('RM_', 'Role_District_Admin', '_', m.menu_id),
  'Role_District_Admin',
  m.menu_id,
  CASE WHEN m.menu_code IN (
    'console_system_users','console_system_roles','console_system_orgs','console_system_parent_bindings',
    'console_settings_experiments','console_settings_textbooks','console_settings_dictionaries','console_assessment_questions',
    'console_operations_dashboard','console_operations_dict_sync','console_operations_data_export','console_operations_cache_mgmt','console_operations_consistency','console_operations_audit_log','console_operations_notifications',
    'teacher_my_teaching_class','teacher_classroom_teaching','teacher_research_group','teacher_class_config'
  ) THEN 1 ELSE 0 END,
  CASE WHEN m.menu_code IN (
    'console_system_users','console_system_roles','console_system_orgs','console_system_parent_bindings',
    'console_settings_experiments','console_settings_textbooks','console_settings_dictionaries','console_assessment_questions',
    'console_operations_dict_sync','console_operations_data_export','console_operations_cache_mgmt','console_operations_consistency','console_operations_audit_log','console_operations_notifications',
    'teacher_class_config'
  ) THEN 1 ELSE 0 END,
  'y', NOW()
FROM sys_menu m
WHERE m.menu_code IN (
  'console_system_users','console_system_roles','console_system_orgs','console_system_parent_bindings',
  'console_settings_experiments','console_settings_textbooks','console_settings_dictionaries','console_assessment_questions',
  'console_operations_dashboard','console_operations_dict_sync','console_operations_data_export','console_operations_cache_mgmt','console_operations_consistency','console_operations_audit_log','console_operations_notifications',
  'teacher_my_teaching_class','teacher_classroom_teaching','teacher_research_group','teacher_class_config'
)
ON DUPLICATE KEY UPDATE can_read = VALUES(can_read), can_write = VALUES(can_write), status = VALUES(status), update_time = NOW();

-- ------------------------------
-- 校管：本校治理 + 校内教师/班级
-- ------------------------------
INSERT INTO sys_role_menu_perm (seq_id, role_id, menu_id, can_read, can_write, status, create_time)
SELECT
  CONCAT('RM_', 'Role_School_Admin', '_', m.menu_id),
  'Role_School_Admin',
  m.menu_id,
  CASE WHEN m.menu_code IN (
    'console_system_users','console_system_orgs','console_system_parent_bindings',
    'console_settings_experiments','console_settings_textbooks','console_settings_dictionaries','console_assessment_questions',
    'teacher_my_teaching_class','teacher_classroom_teaching','teacher_class_config','teacher_experiment_preview'
  ) THEN 1 ELSE 0 END,
  CASE WHEN m.menu_code IN (
    'console_system_users','console_system_orgs','console_system_parent_bindings',
    'teacher_class_config','teacher_experiment_preview'
  ) THEN 1 ELSE 0 END,
  'y', NOW()
FROM sys_menu m
WHERE m.menu_code IN (
  'console_system_users','console_system_orgs','console_system_parent_bindings',
  'console_settings_experiments','console_settings_textbooks','console_settings_dictionaries','console_assessment_questions',
  'teacher_my_teaching_class','teacher_classroom_teaching','teacher_class_config','teacher_experiment_preview'
)
ON DUPLICATE KEY UPDATE can_read = VALUES(can_read), can_write = VALUES(can_write), status = VALUES(status), update_time = NOW();

-- ------------------------------
-- 教研员：资源、实验、题库、教研组
-- ------------------------------
INSERT INTO sys_role_menu_perm (seq_id, role_id, menu_id, can_read, can_write, status, create_time)
SELECT
  CONCAT('RM_', 'Role_Researcher', '_', m.menu_id),
  'Role_Researcher',
  m.menu_id,
  CASE WHEN m.menu_code IN (
    'console_settings_experiments','console_settings_textbooks','console_settings_dictionaries','console_assessment_questions',
    'teacher_research_group','teacher_experiment_manage','teacher_experiment_preview','teacher_question_bank','teacher_publish_task',
    'researcher_experiments','researcher_textbooks','researcher_dictionaries','researcher_question_bank','researcher_research_group'
  ) THEN 1 ELSE 0 END,
  CASE WHEN m.menu_code IN (
    'console_settings_experiments','console_settings_textbooks','console_settings_dictionaries','console_assessment_questions',
    'teacher_research_group','teacher_experiment_manage','teacher_experiment_preview','teacher_question_bank','teacher_publish_task',
    'researcher_experiments','researcher_textbooks','researcher_dictionaries','researcher_question_bank','researcher_research_group'
  ) THEN 1 ELSE 0 END,
  'y', NOW()
FROM sys_menu m
WHERE m.menu_code IN (
  'console_settings_experiments','console_settings_textbooks','console_settings_dictionaries','console_assessment_questions',
  'teacher_research_group','teacher_experiment_manage','teacher_experiment_preview','teacher_question_bank','teacher_publish_task',
  'researcher_experiments','researcher_textbooks','researcher_dictionaries','researcher_question_bank','researcher_research_group'
)
ON DUPLICATE KEY UPDATE can_read = VALUES(can_read), can_write = VALUES(can_write), status = VALUES(status), update_time = NOW();

-- ------------------------------
-- 教师：我的教学班级 / 课堂 / 作业 / 实验 / 题库
-- ------------------------------
INSERT INTO sys_role_menu_perm (seq_id, role_id, menu_id, can_read, can_write, status, create_time)
SELECT
  CONCAT('RM_', 'Role_Teacher', '_', m.menu_id),
  'Role_Teacher',
  m.menu_id,
  CASE WHEN m.menu_code IN (
    'teacher_my_teaching_class','teacher_classroom_teaching','teacher_experiment_manage','teacher_experiment_preview','teacher_question_bank','teacher_publish_task',
    'student_experiments','student_challenge','student_footprints'
  ) THEN 1 ELSE 0 END,
  CASE WHEN m.menu_code IN (
    'teacher_my_teaching_class','teacher_classroom_teaching','teacher_experiment_manage','teacher_experiment_preview','teacher_question_bank','teacher_publish_task'
  ) THEN 1 ELSE 0 END,
  'y', NOW()
FROM sys_menu m
WHERE m.menu_code IN (
  'teacher_my_teaching_class','teacher_classroom_teaching','teacher_experiment_manage','teacher_experiment_preview','teacher_question_bank','teacher_publish_task',
  'student_experiments','student_challenge','student_footprints'
)
ON DUPLICATE KEY UPDATE can_read = VALUES(can_read), can_write = VALUES(can_write), status = VALUES(status), update_time = NOW();

-- ------------------------------
-- 学生：学习与成长
-- ------------------------------
INSERT INTO sys_role_menu_perm (seq_id, role_id, menu_id, can_read, can_write, status, create_time)
SELECT
  CONCAT('RM_', 'Role_Student', '_', m.menu_id),
  'Role_Student',
  m.menu_id,
  CASE WHEN m.menu_code IN ('student_experiments','student_challenge','student_footprints') THEN 1 ELSE 0 END,
  0,
  'y', NOW()
FROM sys_menu m
WHERE m.menu_code IN ('student_experiments','student_challenge','student_footprints')
ON DUPLICATE KEY UPDATE can_read = VALUES(can_read), can_write = VALUES(can_write), status = VALUES(status), update_time = NOW();

-- ------------------------------
-- 家长：任务协作与家庭实验室
-- ------------------------------
INSERT INTO sys_role_menu_perm (seq_id, role_id, menu_id, can_read, can_write, status, create_time)
SELECT
  CONCAT('RM_', 'Role_Parent', '_', m.menu_id),
  'Role_Parent',
  m.menu_id,
  CASE WHEN m.menu_code IN ('parent_tasks','parent_lab','student_footprints') THEN 1 ELSE 0 END,
  CASE WHEN m.menu_code IN ('parent_tasks','parent_lab') THEN 1 ELSE 0 END,
  'y', NOW()
FROM sys_menu m
WHERE m.menu_code IN ('parent_tasks','parent_lab','student_footprints')
ON DUPLICATE KEY UPDATE can_read = VALUES(can_read), can_write = VALUES(can_write), status = VALUES(status), update_time = NOW();

COMMIT;
