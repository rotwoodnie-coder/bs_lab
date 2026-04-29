-- ----------------------------
-- Migration 0026: 确保 data_school_subject 中的学科 ID 同时存在于 data_role
-- 教师授课关系（sys_user_role）的 role_id 列存储的是学科 ID（subject_id），
-- 受 fk_sys_user_role_role 外键约束，必须先写入 data_role 才能插入。
-- ----------------------------

INSERT IGNORE INTO `data_role` (`role_id`, `role_name`, `comments`, `status`, `sort_order`)
SELECT
  `subject_id`          AS `role_id`,
  `subject_name`        AS `role_name`,
  '自动同步：学科映射为任课教师角色' AS `comments`,
  COALESCE(NULLIF(`status`, ''), 'y') AS `status`,
  `sort_order`          AS `sort_order`
FROM `data_school_subject`;
