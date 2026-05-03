-- ==========================================================
-- 0061: data_file 增加头像隐藏标记与业务类型字段
-- 
-- 功能：区分"系统私有文件（头像）"和"业务媒体资产"。
-- 个人头像记录标记 is_hidden_from_gallery = 1 后，
-- 媒体库列表查询默认过滤这些记录。
-- ==========================================================

-- 1. 添加隐藏标记列（默认 0：可在媒体库展示）
ALTER TABLE `data_file`
  ADD COLUMN `is_hidden_from_gallery` TINYINT(1) NOT NULL DEFAULT 0
  COMMENT '是否在媒体库列表中隐藏（1=隐藏，0=展示）'
  AFTER `content_sha256`;

-- 2. 添加业务类型枚举列（可选，推荐用于审计与扩展）
ALTER TABLE `data_file`
  ADD COLUMN `biz_type` VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL
  COMMENT '业务类型：avatar（头像）、media（媒体素材）、document（文档），空表示未归类'
  AFTER `is_hidden_from_gallery`;

-- 3. 标记现有已知头像记录
--    匹配条件：data_file.file_url 与 sys_user.user_logo 相同的内容
--    注意：不硬删除，仅标记隐藏，表级操作不影响文件引用。
UPDATE `data_file` df
  INNER JOIN `sys_user` u ON df.file_url = u.user_logo
SET df.is_hidden_from_gallery = 1,
    df.biz_type              = 'avatar'
WHERE u.user_logo IS NOT NULL
  AND u.user_logo != ''
  AND (df.is_hidden_from_gallery IS NULL OR df.is_hidden_from_gallery = 0);

-- 4. 创建索引（提升列表查询性能）
ALTER TABLE `data_file`
  ADD INDEX `idx_df_hidden_gallery` (`is_hidden_from_gallery`) USING BTREE;
