-- ─────────────────────────────────────────────────────────────
-- Migration 0009: ai_task_log 增加 request_text / response_text
--
-- 用于存储对话历史，支持滑动窗口上下文与审计追溯。
-- request_text：用户的原始输入消息（UTF8 可存长文本）
-- response_text：AI 的完整回复（UTF8，可存长文本）
--
-- 执行方式：
--   mysql -h10.0.181.204 -P13306 -uroot -p bs_exp_data < 0009_add_ai_log_request_response.sql
-- ─────────────────────────────────────────────────────────────

ALTER TABLE `ai_task_log`
  ADD COLUMN `request_text` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '用户发起的请求文本（对话历史用）' AFTER `trace_id`,
  ADD COLUMN `response_text` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'AI 的完整回复文本（对话历史用）' AFTER `request_text`;
