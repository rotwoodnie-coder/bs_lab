-- ==========================================================
-- 0051: 文件引用去重 & 引用计数删除
-- data_file 新增 ref_count / s3_storage_key
-- 新建 data_file_ref 引用表
-- ==========================================================

-- 1. data_file 新增列
ALTER TABLE data_file
  ADD COLUMN `ref_count` int NOT NULL DEFAULT 0 COMMENT '引用数（引用计数删除）',
  ADD COLUMN `s3_storage_key` varchar(256) NULL COMMENT 'S3 对象键（用于最后删除时清理对象）';

-- 2. 新建 data_file_ref 引用表
CREATE TABLE IF NOT EXISTS `data_file_ref` (
  `ref_id` varchar(32) NOT NULL COMMENT '主键id',
  `file_id` varchar(32) NOT NULL COMMENT '引用的 data_file.file_id',
  `owner_user_id` varchar(32) NOT NULL COMMENT '归属人id',
  `status` varchar(32) NOT NULL DEFAULT 'y' COMMENT '状态：y 启用（有引用），n 取消引用（已软删）',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  PRIMARY KEY (`ref_id`) USING BTREE,
  UNIQUE INDEX `uq_data_file_ref_user`(`file_id`, `owner_user_id`) USING BTREE,
  INDEX `idx_data_file_ref_file`(`file_id`) USING BTREE,
  INDEX `idx_data_file_ref_owner`(`owner_user_id`) USING BTREE,
  CONSTRAINT `fk_data_file_ref_file` FOREIGN KEY (`file_id`) REFERENCES `data_file` (`file_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_data_file_ref_user` FOREIGN KEY (`owner_user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '文件引用记录表（用户维度的引用计数）' ROW_FORMAT = Dynamic;

-- 3. 迁移已有数据到 data_file_ref（存量上线用）
INSERT IGNORE INTO `data_file_ref` (`ref_id`, `file_id`, `owner_user_id`, `status`)
SELECT CONCAT('ST_', UUID()), df.`file_id`, df.`owner_user_id`, 'y'
FROM `data_file` df
WHERE df.`status` IN ('y', 't') AND df.`owner_user_id` IS NOT NULL;

-- 4. 初始化 ref_count
UPDATE `data_file` df
SET df.`ref_count` = (
  SELECT COUNT(*) FROM `data_file_ref` dr
  WHERE dr.`file_id` = df.`file_id` AND dr.`status` = 'y'
);

-- 5. 回填 s3_storage_key（file_url 与 storage key 相同时直接复用）
UPDATE `data_file` df
SET df.`s3_storage_key` = df.`file_url`
WHERE df.`file_url` IS NOT NULL
  AND df.`file_url` != ''
  AND NOT (df.`file_url` LIKE 'http://%' OR df.`file_url` LIKE 'https://%')
  AND df.`s3_storage_key` IS NULL;
