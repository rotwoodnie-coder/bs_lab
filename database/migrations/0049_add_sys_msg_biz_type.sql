-- ----------------------------
-- Migration 0049: 消息表 sys_msg 增加 biz_type 字段
--
-- biz_type 用于更细粒度的业务子类过滤（不改变现有消息分类结构）。
-- 配合 v2-msg-constants.ts 中 BIZ_TYPE 枚举使用。
-- ----------------------------

ALTER TABLE `sys_msg`
  ADD COLUMN `biz_type` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '业务子类（如 ROLE_CHANGE/RESEARCH_APPROVE/HOMEWORK_PUBLISH 等）' AFTER `msg_type_id`,
  ADD INDEX `idx_sys_msg_biz_type`(`biz_type` ASC) USING BTREE;
