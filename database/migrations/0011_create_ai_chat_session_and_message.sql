-- ─────────────────────────────────────────────────────────────
-- Migration 0011: 石头老师智能体会话与消息明细表
--
-- 设计文档：docs/ai-agent/ai-agent-overview-design.md
-- 业务需求：科学实验向导智能体（石头老师）会话管理
--
-- 新增表：
--   ai_chat_session  — 会话主表，记录年级属性、当前环节、实验关联
--   ai_chat_message  — 消息明细表，存储 user/assistant 历史对话
--
-- 执行方式：
--   mysql -h10.0.181.204 -P13306 -uroot -p bs_exp_data < 0011_create_ai_chat_session_and_message.sql
-- ─────────────────────────────────────────────────────────────

-- ----------------------------
-- Table structure for ai_chat_session
-- 用途：石头老师智能体会话主表
-- 核心控制字段：
--   grade_level    — 年级属性：低段/中段/高段，决定 Prompt 风格
--   current_stage — 当前环节状态机：INIT / GOAL / MATERIAL / STEP / RECORD / CONCLUSION / FINAL
-- ----------------------------
DROP TABLE IF EXISTS `ai_chat_session`;
CREATE TABLE `ai_chat_session` (
  `session_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '会话主键',
  `user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '发起用户 id',
  `user_role` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'Student' COMMENT '用户角色',
  `grade_level` enum('低段','中段','高段') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '年级属性：低段(1-2)/中段(3-4)/高段(5-6)',
  `current_stage` enum('INIT','GOAL','MATERIAL','STEP','RECORD','CONCLUSION','FINAL') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'INIT' COMMENT '当前环节状态',
  `experiment_title` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '实验标题（从对话中提取）',
  `experiment_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '关联实验主键（若已创建正式实验）',
  `summary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '会话摘要（最终产出的完整方案）',
  `is_active` enum('y','n') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'y' COMMENT '会话是否有效',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`session_id`) USING BTREE,
  KEY `idx_user_active` (`user_id`, `is_active`) USING BTREE,
  KEY `idx_user_time` (`user_id`, `create_time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='石头老师智能体会话表';

-- ----------------------------
-- Table structure for ai_chat_message
-- 用途：存储 user 和 assistant 的完整历史对话，用于滑动窗口构建上下文
-- ----------------------------
DROP TABLE IF EXISTS `ai_chat_message`;
CREATE TABLE `ai_chat_message` (
  `message_id` bigint NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `session_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '所属会话 id',
  `role` enum('user','assistant','system') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '消息角色',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '消息内容',
  `metadata` json DEFAULT NULL COMMENT '附加元数据（如 token 用量、stage 快照等）',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`message_id`) USING BTREE,
  KEY `idx_session_time` (`session_id`, `create_time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=1 COMMENT='石头老师智能体消息明细表';
