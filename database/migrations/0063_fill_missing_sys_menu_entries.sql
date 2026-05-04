-- ==========================================================
-- 0063: 补充缺失页面菜单条目（实验列表、教研组管理等）
--
-- 背景：
--   0062 禁用了 0052 中已被 0055 替换的菜单项（1:1 同路径替换），
--   但部分旧菜单（menu_code）指向的独立页面并非 0055 中任一页面的替代品，
--   还有部分页面从未进入 sys_menu，导致权限矩阵中缺少这些条目。
--
-- 修复：
--   1. 为 "实验列表（目录管理）" 创建新条目 experiment_catalog
--      （原本的 console_settings_experiments 已废弃，不予恢复）
--   2. 为其余 8 个缺失页面 INSERT 新菜单条目
--   3. 超管默认赋予全量读写权限
-- ==========================================================

-- 1. 补充缺失的菜单条目
INSERT INTO `sys_menu`
(`parent_id`, `menu_name`, `menu_code`, `menu_type`, `path`, `component`, `sort_order`, `status`, `comments`, `create_time`)
VALUES
(NULL, '实验列表', 'experiment_catalog', 'page', '/console/settings/experiments', NULL, 55, 'y', '实验列表（目录管理），独立于实验课程', NOW()),
(NULL, '教研组管理', 'teaching_research_groups', 'page', '/researcher/teaching-research-groups', NULL, 56, 'y', '教研组管理（教研员/超管）', NOW()),
(NULL, '实验材料库', 'experimental_materials', 'page', '/experimental-materials', NULL, 57, 'y', '实验材料库', NOW()),
(NULL, '实验闯关', 'student_challenge', 'page', '/student/experiment-challenge', NULL, 58, 'y', '学生实验闯关', NOW()),
(NULL, '任务中心', 'parent_task_center', 'page', '/parent/tasks', NULL, 59, 'y', '家长任务中心', NOW()),
(NULL, '消息中心', 'messages_center', 'page', '/messages', NULL, 60, 'y', '消息通知', NOW()),
(NULL, '系统设置', 'user_settings', 'page', '/settings', NULL, 61, 'y', '个人系统设置', NOW()),
(NULL, '实验预览', 'teacher_experiment_preview', 'page', '/teacher/experiment-preview', NULL, 62, 'y', '教师端实验预览', NOW()),
(NULL, '题库管理', 'teacher_question_bank', 'page', '/teacher/question-bank', NULL, 63, 'y', '教师端题库', NOW())
ON DUPLICATE KEY UPDATE
  `parent_id` = VALUES(`parent_id`),
  `menu_name` = VALUES(`menu_name`),
  `menu_type` = VALUES(`menu_type`),
  `path` = VALUES(`path`),
  `component` = VALUES(`component`),
  `sort_order` = VALUES(`sort_order`),
  `status` = VALUES(`status`),
  `comments` = VALUES(`comments`);

-- 2. 为超管授予新菜单全量读写权限
INSERT INTO `sys_role_menu_perm` (`seq_id`, `role_id`, `menu_id`, `can_read`, `can_write`, `status`, `create_time`)
SELECT
  LEFT(CONCAT('RM_SysAdmin_', m.`menu_id`), 32),
  'Role_Sys_Admin',
  m.`menu_id`,
  1, 1, 'y', NOW()
FROM `sys_menu` m
WHERE m.`status` = 'y'
  AND NOT EXISTS (
    SELECT 1 FROM `sys_role_menu_perm` p
    WHERE p.`role_id` = 'Role_Sys_Admin' AND p.`menu_id` = m.`menu_id`
  )
  AND m.`menu_code` IN (
    'experiment_catalog',
    'teaching_research_groups',
    'experimental_materials',
    'student_challenge',
    'parent_task_center',
    'messages_center',
    'user_settings',
    'teacher_experiment_preview',
    'teacher_question_bank'
  )
ON DUPLICATE KEY UPDATE
  `can_read` = VALUES(`can_read`),
  `can_write` = VALUES(`can_write`),
  `status` = VALUES(`status`),
  `update_time` = NOW();
