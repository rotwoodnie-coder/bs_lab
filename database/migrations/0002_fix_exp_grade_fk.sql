-- ==============================================================
-- 0002: 修复 exp_grade — 重命名列 & 外键改指
-- 目标数据库：bs_exp_data
-- 1) lib_exp_id → exp_id
-- 2) 外键从 exp_library.lib_exp_id 改为 exp_msg.exp_id
-- ==============================================================

-- 注：此迁移假设 exp_grade 表中无生产数据冲突。
-- 若已有数据，需先确认 lib_exp_id 的值是否能映射到 exp_msg.exp_id。

-- 先删除旧外键和索引
ALTER TABLE `exp_grade`
  DROP FOREIGN KEY `fk_exp_grade_exp`,
  DROP INDEX `idx_exp_grade_exp`;

-- 重命名列 lib_exp_id → exp_id
-- MySQL 8.0 支持 RENAME COLUMN
ALTER TABLE `exp_grade`
  CHANGE COLUMN `lib_exp_id` `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '实验 ID（关联 exp_msg）';

-- 重建索引和外键（指向 exp_msg）
ALTER TABLE `exp_grade`
  ADD INDEX `idx_exp_grade_exp`(`exp_id` ASC) USING BTREE,
  ADD CONSTRAINT `fk_exp_grade_exp` FOREIGN KEY (`exp_id`) REFERENCES `exp_msg` (`exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
