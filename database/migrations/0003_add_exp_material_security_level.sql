-- ==============================================================
-- 0003: exp_material_security 增加 security_level 列
-- 目标数据库：bs_exp_data
-- 对应文档：docs/core/bs_exp_data-database-design.md §4.5
-- 目的：允许实验场景下覆盖材料的默认危险等级（方案 B）
-- ==============================================================

-- exp_material_security.security_level：实验场景下单个材料的安全性标签的危险等级
-- 覆盖链：exp_material_security.security_level → material_security 无等级 → data_material_security.security_level（字典默认）
ALTER TABLE `exp_material_security`
  ADD COLUMN `security_level` int NULL COMMENT '实验场景下的危险等级，覆盖字典默认值（数值越低越危险）' AFTER `sort_order`;
