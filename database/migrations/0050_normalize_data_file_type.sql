-- ============================================================
-- 0050: 文件类型表标准化 —— MD5 散列值的物理灭绝
-- 
-- 清理：删除所有非 FT_ 前缀的非法 type_id（MD5 哈希行）
-- 重建：INSERT 9 条宪法级 FT_ 条目
-- 锁定：data_file_type 已加入后台只读列表
-- 说明：data_file 当前为 0 条，无 FK 冲突风险
-- ============================================================

START TRANSACTION;

-- 1. 清空（data_file 已为空，无 FK 阻塞）
TRUNCATE TABLE `data_file_type`;

-- 2. 插入 9 条宪法级文件类型
INSERT INTO `data_file_type` (`type_id`, `type_name`, `comments`, `status`, `sort_order`, `logo_class`) VALUES
('FT_Video',       '视频',   '视频文件',                     'y', 1,  'video'),
('FT_Image',       '图片',   '图片文件',                     'y', 2,  'image'),
('FT_Audio',       '音频',   '音频文件',                     'y', 3,  'audio'),
('FT_Document',    '文档',   '文档文件',                     'y', 4,  'word'),
('FT_Ppt',         'PPT',    'PPT 文件',                     'y', 5,  'ppt'),
('FT_Pdf',         '课件',   'PDF 课件',                     'y', 6,  'pdf'),
('FT_Spreadsheet', '表格',   '表格文件',                     'y', 7,  'spreadsheet'),
('FT_Package',     '压缩包', '压缩/归档文件',                'y', 8,  'package'),
('FT_Other',       '其他',   '未分类/兜底文件类型',           'y', 9,  'other');

COMMIT;
