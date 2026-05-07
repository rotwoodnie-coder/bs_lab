# 数据库迁移记录

## 2026-05-07
- 推送 `0003_add_exp_material_security_level.sql`：`exp_material_security` 增加 `security_level` 列，支持实验场景覆盖危险等级。
- 推送 `0004_add_composite_indexes.sql`：创建三个组合索引（`idx_exp_msg_status_time`、`idx_exp_msg_subject_grade_status`、`idx_exp_homework_class_time`）。
- 对应数据库设计文档版本 1.2。

## 2026-05-06
- 以 `database/migrations/bs_exp_data.sql` 为正式数据库迁移基线。
- 对应数据库设计文档版本 1.1。
