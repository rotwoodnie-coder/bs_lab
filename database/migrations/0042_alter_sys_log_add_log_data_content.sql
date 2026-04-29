-- 0042 为 sys_log 添加 log_data_content 列
-- SystemLogService.reportIssue() 会写入该列，但 DDL 基线中缺失导致 INSERT 失败

ALTER TABLE sys_log
  ADD COLUMN `log_data_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '操作数据内容（JSON 格式的详细上下文）' AFTER `log_data_id`;
