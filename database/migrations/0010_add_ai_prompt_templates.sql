-- ─────────────────────────────────────────────────────────────
-- Migration 0010: ai_prompt_template 系统提示词管理表
--
-- 用途：将 system prompt 从硬编码迁移到数据库，支持后台编辑、版本管理。
-- 每行代表一个角色对应的 prompt 模板，支持变量占位符：
--   {{userName}}     — 用户真实姓名
--   {{schoolLevelId}} — 学段标识（如 "primary"）
--
-- 加载顺序：先按 role 精确匹配（如 "Student"），未命中则回退到 role='*'
-- is_active='y' 的模板才会被生效
--
-- 执行方式：
--   mysql -h10.0.181.204 -P13306 -uroot -p bs_exp_data < 0010_add_ai_prompt_templates.sql
-- ─────────────────────────────────────────────────────────────

-- ----------------------------
-- Table structure for ai_prompt_template
-- ----------------------------
DROP TABLE IF EXISTS `ai_prompt_template`;
CREATE TABLE `ai_prompt_template` (
  `template_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键',
  `code` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '模板标识符（如 role_teacher, role_student）',
  `name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '显示名称',
  `role` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '*' COMMENT '适用角色（Teacher / Student / Researcher / * 通配）',
  `content` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'Prompt 模板内容（支持 {{userName}} 变量插值）',
  `version` int NOT NULL DEFAULT '1' COMMENT '版本号，每次编辑自增',
  `is_active` enum('y','n') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'y' COMMENT '是否启用',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '备注说明',
  `create_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '创建人 user_id',
  `update_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '最后编辑人 user_id',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`template_id`) USING BTREE,
  UNIQUE KEY `uk_code` (`code`) USING BTREE,
  KEY `idx_role_active` (`role`, `is_active`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='AI 系统提示词模板（可编辑）';
