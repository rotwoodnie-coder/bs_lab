-- ─────────────────────────────────────────────────────────────
-- Migration 0008: AI 智能体 M1-Phase1 表结构
--
-- 设计文档：docs/ai-agent/ai-agent-overview-design.md
-- 评审 & 细化方案：用户确认的修订方案 / M1-Phase1
--
-- 新增表：
--   ai_task_log  — AI 任务审计日志（每次 LLM 调用记录）
--   ai_task_draft — AI 草稿缓存（AI 产出的临时结构化数据）
--
-- 执行方式：
--   mysql -h10.0.181.204 -P13306 -uroot -p bs_exp_data < 0008_create_ai_tables.sql
-- ─────────────────────────────────────────────────────────────

-- ----------------------------
-- Table structure for ai_task_log
-- 用途：记录每次 AI 调用的完整审计信息，包括 token 消耗、耗时、采纳率
-- ----------------------------
DROP TABLE IF EXISTS `ai_task_log`;
CREATE TABLE `ai_task_log` (
  `log_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键',
  `user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '发起用户 id',
  `user_role` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户角色标识（Teacher / Student / Researcher）',
  `task_type` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '任务类型：generate_scheme / safety_check / analysis',
  `model_used` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '模型标识（如 deepseek-chat）',
  `prompt_tokens` int DEFAULT '0' COMMENT 'Prompt token 消耗',
  `completion_tokens` int DEFAULT '0' COMMENT 'Completion token 消耗',
  `duration_ms` int DEFAULT '0' COMMENT '请求耗时（毫秒）',
  `status` enum('pending','success','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending' COMMENT '任务状态',
  `context_ref_type` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '上下文引用类型：exp_id / homework_id',
  `context_ref_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '上下文引用主键',
  `is_accepted` enum('y','n','partial') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '用户是否采纳 AI 结果',
  `user_feedback_score` tinyint DEFAULT NULL COMMENT '用户反馈评分 1-5',
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '错误信息',
  `trace_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '链路追踪 id',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`log_id`) USING BTREE,
  KEY `idx_user` (`user_id`) USING BTREE,
  KEY `idx_context` (`context_ref_type`, `context_ref_id`) USING BTREE,
  KEY `idx_time` (`create_time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='AI 任务审计日志';

-- ----------------------------
-- Table structure for ai_task_draft
-- 用途：存储 AI 产出的结构化 JSON 片段，支持前端 Diff 渲染与字段级确认
-- ----------------------------
DROP TABLE IF EXISTS `ai_task_draft`;
CREATE TABLE `ai_task_draft` (
  `draft_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键',
  `user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '所属用户 id',
  `task_type` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '任务类型',
  `context_ref_type` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '目标实体类型',
  `context_ref_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '目标实体主键',
  `draft_json` json NOT NULL COMMENT 'AI 产出的结构化 JSON',
  `diff_json` json DEFAULT NULL COMMENT '与当前数据的差异对比（M1-Phase2 使用）',
  `status` enum('pending','confirmed','rejected','expired') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending' COMMENT '草稿状态',
  `source` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'web' COMMENT '数据来源：web / mobile / api',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`draft_id`) USING BTREE,
  KEY `idx_user_status` (`user_id`, `status`) USING BTREE,
  KEY `idx_context` (`context_ref_type`, `context_ref_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='AI 草稿缓存';
