-- ============================================================
-- 组织类型初始化：校区 + 学段
-- 目标库：bs_exp_data
-- 说明：data_org_type 为一次性初始化字典表，运行后不可变更。
--       插入前检查是否已存在（幂等）。
-- 层级关系：
--   Org_Manage
--   └── Org_School
--        └── Org_School_Campus  ← 新增：校区/分校
--             └── Org_School_Level  ← 新增：学段（小学、初中等）
--                  ├── Org_School_Grade
--                  │    └── Org_School_Class
--                  └── ...
-- ============================================================

INSERT INTO `data_org_type` (`type_id`, `type_name`, `sort`, `remark`, `status`)
VALUES
  ('Org_School_Campus', '校区', 7, '学校下属校区/分校', 'y'),
  ('Org_School_Level',   '学段', 8, '校区下的学段，如小学、初中', 'y')
ON DUPLICATE KEY UPDATE
  `type_name` = VALUES(`type_name`),
  `sort`      = VALUES(`sort`),
  `remark`    = VALUES(`remark`),
  `status`    = VALUES(`status`);
