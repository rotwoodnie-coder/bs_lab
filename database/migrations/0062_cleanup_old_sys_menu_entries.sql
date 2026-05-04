-- ==========================================================
-- 0062: 清理旧版 sys_menu 重复条目（废弃 0052 旧命名体系）
--
-- 背景：0052 迁移定义了 15 条旧版菜单（console_system_*、teacher_* 等），
--       0055/0056 引入了 24 条新版菜单（user_management 等新命名体系）。
--       0058 仅清理了 sys_role_menu_perm 中的旧关联，未禁用旧菜单行，
--       导致 listSysMenus() 返回 39 条而非 24 条，前端权限矩阵重复。
--
-- 修复：将 0052 旧版菜单标记为 status='n'（禁用），
--       保留数据以便审计追溯。
-- ==========================================================

-- 1. 禁用 0052 旧版菜单（已被 0055 方案替换的旧命名体系）
UPDATE `sys_menu`
SET `status` = 'n',
    `comments` = CONCAT(COALESCE(`comments`, ''), ' | 已废弃，由 0055 版本替换，参见 0062')
WHERE `status` = 'y'
  AND `menu_code` IN (
    'console_system_users',          -- 被 user_management 替换
    'console_system_roles',          -- 被 role_management 替换
    'console_system_orgs',           -- 被 org_management 替换
    'console_system_parent_bindings',-- 被 parent_bindings 替换
    'console_settings_experiments',  -- 被 teacher_experiment_manager 替换
    'console_settings_textbooks',    -- 被 textbook_management 替换
    'console_operations_dashboard',  -- 被 ops_dashboard 替换
    'console_operations_dict_sync',  -- 合并到 ops_dashboard
    'console_operations_data_export',-- 合并到 ops_dashboard
    'console_operations_cache_mgmt', -- 合并到 ops_dashboard
    'console_operations_consistency',-- 合并到 ops_dashboard
    'console_operations_audit_log',  -- 合并到 ops_dashboard
    'console_operations_notifications',-- 合并到 ops_dashboard
    'teacher_my_teaching_class',     -- 被 teacher_classroom 替换
    'teacher_classroom_teaching',    -- 被 teacher_tasks 替换
    'teacher_experiment_manage',     -- 被 teacher_experiment_manager 替换
    'teacher_experiment_preview',    -- 无 0055 替代，但无对应页面
    'teacher_question_bank',         -- 无 0055 替代，但无对应页面
    'teacher_research_group',        -- 被 my_research_groups 替换
    'teacher_class_config',          -- 被 class_management 替换
    'teacher_publish_task',          -- 合并到 teacher_tasks
    'researcher_experiments',        -- 被 teacher_experiment_manager 替换
    'researcher_textbooks',          -- 被 textbook_management 替换
    'researcher_dictionaries',       -- 无 0055 替代
    'researcher_question_bank',      -- 无 0055 替代
    'researcher_research_group',     -- 被 review_research_groups 替换
    'student_experiments',           -- 被 student_tasks 替换
    'student_challenge',             -- 无 0055 替代，但无对应页面
    'student_footprints',            -- 被 student_growth 替换
    'parent_tasks',                  -- 无 0055 替代，功能拆分
    'parent_lab',                    -- 被 family_lab 替换
    'home',                          -- 被 dashboard 替换
    'messages',                      -- 无 0055 替代
    'settings',                      -- 无 0055 替代
    'experimental_materials',        -- 无 0055 替代
    'resources'                      -- 被 resource_center 替换
  );

-- 2. 清理已禁用菜单的权限关联（避免孤儿数据）
DELETE FROM `sys_role_menu_perm`
WHERE `menu_id` IN (
  SELECT `menu_id` FROM `sys_menu` WHERE `status` = 'n'
);

-- 3. 修正 0058 遗留的 path 不准确问题
--    teacher_classroom 的实际 Next.js 路由为 /teacher/assignments，
--    0058 设为了 /teacher-classroom，与页面文件不匹配。
UPDATE `sys_menu` SET `path` = '/teacher/assignments' WHERE `menu_code` = 'teacher_classroom';

-- 4. 保留 console_settings_dictionaries 和 console_assessment_questions
--    这两项在 0055 方案中无替代，且页面仍在运行，保留为 status='y'。
--    前置检查：确保它们被误标为 'n' 时恢复。
UPDATE `sys_menu`
SET `status` = 'y'
WHERE `status` = 'n'
  AND `menu_code` IN (
    'console_settings_dictionaries',
    'console_assessment_questions'
  );
