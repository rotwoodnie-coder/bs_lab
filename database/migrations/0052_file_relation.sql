-- ==========================================================
-- 0052: 独立素材模型（封面纳入引用计数体系）
-- data_file 新增 parent_file_id / relation_type / cover_file_id
-- ==========================================================

-- 1. data_file 新增自引用列
ALTER TABLE data_file
  ADD COLUMN `parent_file_id` varchar(32) NULL COMMENT '父文件ID（自引用），表达从属关系',
  ADD COLUMN `relation_type` varchar(32) NULL COMMENT '关系类型：logo（封面）、transcoded（转码）等',
  ADD COLUMN `cover_file_id` varchar(32) NULL COMMENT '封面文件ID（冗余加速）';

-- 2. 外键约束
ALTER TABLE data_file
  ADD CONSTRAINT fk_data_file_parent FOREIGN KEY (parent_file_id) REFERENCES data_file(file_id) ON DELETE SET NULL ON UPDATE RESTRICT;

-- 3. 唯一约束（自动创建索引，加速 WHERE parent_file_id = ? AND relation_type = ? 查询）
--   同一主文件下不允许重复的 relation_type（防止并发生成两个封面行）
--   MySQL 对 NULL 不参与唯一性检查，因此主文件行（parent_file_id IS NULL）不受影响
CREATE UNIQUE INDEX uq_data_file_parent_relation ON data_file(parent_file_id, relation_type);

-- 4. 单独索引，用于按 relation_type 筛选（如查所有封面/转码文件）
CREATE INDEX idx_data_file_relation ON data_file(relation_type);
