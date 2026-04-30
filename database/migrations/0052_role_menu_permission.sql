-- ==========================================================
-- 0052: 角色菜单权限台（第一版）
-- sys_menu / sys_role_menu_perm
-- ==========================================================

-- 1. 系统菜单目录表
CREATE TABLE IF NOT EXISTS `sys_menu` (
  `menu_id` int NOT NULL AUTO_INCREMENT COMMENT '菜单主键，自增ID',
  `parent_id` int NULL COMMENT '父级菜单ID',
  `menu_name` varchar(100) NOT NULL COMMENT '菜单/页面名称',
  `menu_code` varchar(100) NOT NULL COMMENT '稳定业务编码，用于权限锚点',
  `menu_type` varchar(20) NOT NULL COMMENT 'menu/page/button',
  `path` varchar(255) NULL COMMENT '路由路径',
  `component` varchar(255) NULL COMMENT '前端组件或页面标识',
  `sort_order` int NOT NULL DEFAULT 0 COMMENT '排序',
  `status` varchar(2) NOT NULL DEFAULT 'y' COMMENT '状态：y启用/n停用',
  `comments` varchar(255) NULL COMMENT '备注',
  `create_user_id` varchar(32) NULL COMMENT '创建人',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_user_id` varchar(32) NULL COMMENT '更新人',
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`menu_id`) USING BTREE,
  UNIQUE KEY `uq_sys_menu_code` (`menu_code`) USING BTREE,
  KEY `idx_sys_menu_parent` (`parent_id`) USING BTREE,
  KEY `idx_sys_menu_path` (`path`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='系统菜单目录表';

-- 2. 角色菜单权限表
CREATE TABLE IF NOT EXISTS `sys_role_menu_perm` (
  `seq_id` varchar(32) NOT NULL COMMENT '主键',
  `role_id` varchar(32) NOT NULL COMMENT '角色ID，关联 data_role.role_id',
  `menu_id` int NOT NULL COMMENT '菜单ID，关联 sys_menu.menu_id',
  `can_read` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否可读/可见/可进入',
  `can_write` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否可写/可编辑/可保存',
  `status` varchar(2) NOT NULL DEFAULT 'y' COMMENT '状态：y启用/n停用',
  `create_user_id` varchar(32) NULL COMMENT '创建人',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_user_id` varchar(32) NULL COMMENT '更新人',
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`seq_id`) USING BTREE,
  UNIQUE KEY `uq_sys_role_menu_perm` (`role_id`, `menu_id`) USING BTREE,
  KEY `idx_sys_role_menu_perm_role` (`role_id`) USING BTREE,
  KEY `idx_sys_role_menu_perm_menu` (`menu_id`) USING BTREE,
  CONSTRAINT `fk_sys_role_menu_perm_role` FOREIGN KEY (`role_id`) REFERENCES `data_role` (`role_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_sys_role_menu_perm_menu` FOREIGN KEY (`menu_id`) REFERENCES `sys_menu` (`menu_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='角色菜单权限表';

-- 3. 初始化系统菜单（第一批核心页面）
INSERT INTO `sys_menu` (`menu_id`, `parent_id`, `menu_name`, `menu_code`, `menu_type`, `path`, `component`, `sort_order`, `status`, `comments`, `create_time`)
VALUES
(1, NULL, '用户管理', 'console_system_users', 'page', '/console/settings/system/users', NULL, 10, 'y', '系统用户管理页', NOW()),
(2, NULL, '角色管理', 'console_system_roles', 'page', '/console/settings/system/roles', NULL, 20, 'y', '系统角色管理页', NOW()),
(3, NULL, '组织管理', 'console_system_orgs', 'page', '/console/settings/system/organizations', NULL, 30, 'y', '系统组织管理页', NOW()),
(4, NULL, '家长绑定审核', 'console_system_parent_bindings', 'page', '/console/settings/system/parent-bindings', NULL, 40, 'y', '家长绑定审核页', NOW()),
(5, NULL, '实验管理', 'console_settings_experiments', 'page', '/console/settings/experiments', NULL, 50, 'y', '实验管理页', NOW()),
(6, NULL, '教材管理', 'console_settings_textbooks', 'page', '/console/settings/textbooks', NULL, 60, 'y', '教材管理页', NOW()),
(7, NULL, '字典管理', 'console_settings_dictionaries', 'page', '/console/settings/dictionaries', NULL, 70, 'y', '字典管理页', NOW()),
(8, NULL, '题库管理', 'console_assessment_questions', 'page', '/console/assessment/questions', NULL, 80, 'y', '题库管理页', NOW()),
(9, NULL, '运维中心', 'console_operations_dashboard', 'menu', '/console/operations/dashboard', NULL, 90, 'y', '运维中心入口', NOW()),
(10, 9, '业务字典同步', 'console_operations_dict_sync', 'page', '/console/operations/dict-sync', NULL, 91, 'y', '业务字典同步页', NOW()),
(11, 9, '数据导出', 'console_operations_data_export', 'page', '/console/operations/data-export', NULL, 92, 'y', '数据导出页', NOW()),
(12, 9, '缓存管理', 'console_operations_cache_mgmt', 'page', '/console/operations/cache-mgmt', NULL, 93, 'y', '缓存管理页', NOW()),
(13, 9, '一致性检查', 'console_operations_consistency', 'page', '/console/operations/consistency', NULL, 94, 'y', '一致性检查页', NOW()),
(14, 9, '操作记录', 'console_operations_audit_log', 'page', '/console/operations/audit-log', NULL, 95, 'y', '操作记录页', NOW()),
(15, 9, '学校通知', 'console_operations_notifications', 'page', '/console/operations/notifications', NULL, 96, 'y', '学校通知页', NOW())
ON DUPLICATE KEY UPDATE
  `parent_id` = VALUES(`parent_id`),
  `menu_name` = VALUES(`menu_name`),
  `menu_type` = VALUES(`menu_type`),
  `path` = VALUES(`path`),
  `component` = VALUES(`component`),
  `sort_order` = VALUES(`sort_order`),
  `status` = VALUES(`status`),
  `comments` = VALUES(`comments`);

-- 4. 初始化超管默认权限（全量可见 + 可写）
INSERT INTO `sys_role_menu_perm` (`seq_id`, `role_id`, `menu_id`, `can_read`, `can_write`, `status`, `create_time`)
VALUES
(LEFT(CONCAT('RM_SysAdmin_', 1), 32), 'Role_Sys_Admin', 1, 1, 1, 'y', NOW()),
(LEFT(CONCAT('RM_SysAdmin_', 2), 32), 'Role_Sys_Admin', 2, 1, 1, 'y', NOW()),
(LEFT(CONCAT('RM_SysAdmin_', 3), 32), 'Role_Sys_Admin', 3, 1, 1, 'y', NOW()),
(LEFT(CONCAT('RM_SysAdmin_', 4), 32), 'Role_Sys_Admin', 4, 1, 1, 'y', NOW()),
(LEFT(CONCAT('RM_SysAdmin_', 5), 32), 'Role_Sys_Admin', 5, 1, 1, 'y', NOW()),
(LEFT(CONCAT('RM_SysAdmin_', 6), 32), 'Role_Sys_Admin', 6, 1, 1, 'y', NOW()),
(LEFT(CONCAT('RM_SysAdmin_', 7), 32), 'Role_Sys_Admin', 7, 1, 1, 'y', NOW()),
(LEFT(CONCAT('RM_SysAdmin_', 8), 32), 'Role_Sys_Admin', 8, 1, 1, 'y', NOW()),
(LEFT(CONCAT('RM_SysAdmin_', 9), 32), 'Role_Sys_Admin', 9, 1, 1, 'y', NOW()),
(LEFT(CONCAT('RM_SysAdmin_', 10), 32), 'Role_Sys_Admin', 10, 1, 1, 'y', NOW()),
(LEFT(CONCAT('RM_SysAdmin_', 11), 32), 'Role_Sys_Admin', 11, 1, 1, 'y', NOW()),
(LEFT(CONCAT('RM_SysAdmin_', 12), 32), 'Role_Sys_Admin', 12, 1, 1, 'y', NOW()),
(LEFT(CONCAT('RM_SysAdmin_', 13), 32), 'Role_Sys_Admin', 13, 1, 1, 'y', NOW()),
(LEFT(CONCAT('RM_SysAdmin_', 14), 32), 'Role_Sys_Admin', 14, 1, 1, 'y', NOW()),
(LEFT(CONCAT('RM_SysAdmin_', 15), 32), 'Role_Sys_Admin', 15, 1, 1, 'y', NOW())
ON DUPLICATE KEY UPDATE
  `can_read` = VALUES(`can_read`),
  `can_write` = VALUES(`can_write`),
  `status` = VALUES(`status`),
  `update_time` = NOW();
