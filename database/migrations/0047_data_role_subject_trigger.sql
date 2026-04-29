-- ----------------------------
-- Migration 0047: 学科新增触发器 + data_role 宪法加固
-- 
-- 背景（三层身份架构）：
--   data_role 是"系统宪法"，只存放 7 个基础身份 + Subj_* 影子角色。
--   Subj_* 必须在 data_role 中预填，否则 FK (fk_sys_user_role_role) 约束会阻止
--   sys_user_role 中写入 Subj_* 标签。
--
-- 目标：
--   1. 确保当前 data_role 中已包含所有学科的映射（种子已做，这里是兜底）
--   2. 为 data_school_subject 建立触发器：管理后台新增学科时自动同步到 data_role
--   3. 彻底消除"忘记同步角色表导致 INSERT 报错"的可能性
-- ----------------------------

-- 1. 确保所有学科都在 data_role 中有对应行（幂等，迁移后新增学科由触发器管理）
INSERT IGNORE INTO `data_role` (`role_id`, `role_name`, `comments`, `status`, `sort_order`)
SELECT
  `subject_id`          AS `role_id`,
  `subject_name`        AS `role_name`,
  '学科标签（迁移 0047 兜底）' AS `comments`,
  COALESCE(NULLIF(`status`, ''), 'y') AS `status`,
  `sort_order`          AS `sort_order`
FROM `data_school_subject`;

-- 2. 建立触发器：新增学科时自动同步到 data_role
--    解决"管理后台新增学科 → sys_user_role 写入 FK 报错"的问题
DROP TRIGGER IF EXISTS `trg_data_school_subject_ai`;
DELIMITER //
CREATE TRIGGER `trg_data_school_subject_ai`
AFTER INSERT ON `data_school_subject`
FOR EACH ROW
BEGIN
  INSERT IGNORE INTO `data_role` (`role_id`, `role_name`, `comments`, `status`, `sort_order`)
  VALUES (
    NEW.`subject_id`,
    NEW.`subject_name`,
    '学科标签（触发器自动同步）',
    COALESCE(NULLIF(NEW.`status`, ''), 'y'),
    NEW.`sort_order`
  );
END;//
DELIMITER ;
