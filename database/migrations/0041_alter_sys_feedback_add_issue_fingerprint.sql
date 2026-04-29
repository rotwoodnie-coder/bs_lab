-- 为 sys_feedback 表补充 issue_fingerprint 列
-- 用于反馈与系统日志的自动关联去重（同源反馈合并）与 AI 分诊标记
ALTER TABLE `sys_feedback`
  ADD COLUMN `issue_fingerprint` VARCHAR(32) NULL AFTER `env`,
  ADD KEY `idx_issue_fingerprint` (`issue_fingerprint`);
