-- ==========================================================
-- 0057: subject_group 添加审核状态字段
-- 适配审核流程：教师创建课题组 → 教研员在 review/research-groups 审核
-- ==========================================================

-- 新增审核状态字段（t 待审核, y 通过, n 驳回）
ALTER TABLE `subject_group`
  ADD COLUMN `review_status` VARCHAR(4) NULL DEFAULT 't' COMMENT '审核状态：t 待审核，y 通过，n 驳回' AFTER `status`,
  ADD COLUMN `review_user_id` VARCHAR(32) NULL DEFAULT NULL COMMENT '审核人ID' AFTER `review_status`,
  ADD COLUMN `review_time` DATETIME NULL DEFAULT NULL COMMENT '审核时间' AFTER `review_user_id`,
  ADD COLUMN `review_comments` VARCHAR(200) NULL DEFAULT NULL COMMENT '审批意见/驳回理由' AFTER `review_time`,
  ADD COLUMN `reject_reason` VARCHAR(500) NULL DEFAULT NULL COMMENT '驳回全文（与 review_comments 共存）' AFTER `review_comments`;

-- 迁移：将已有 NORMAL 状态的组默认置为已通过（y），保持历史兼容
UPDATE `subject_group` SET `review_status` = 'y' WHERE `status` = 'NORMAL';

-- 索引优化
ALTER TABLE `subject_group`
  ADD INDEX `idx_review_status`(`review_status` ASC) USING BTREE;
