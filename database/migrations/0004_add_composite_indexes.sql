-- ==============================================================
-- 0004: 补充组合索引 — 提升实验列表与班级任务查询性能
-- 目标数据库：bs_exp_data
-- 对应文档：docs/core/bs_exp_data-database-design.md §7.2
-- 包含：
--   1) exp_msg(status, create_time)        — 审核列表、发布时间线
--   2) exp_msg(subject_id, grade_id, status) — 学科年级筛选
--   3) exp_homework(class_id, create_time)  — 班级任务列表
-- ==============================================================

-- 1. exp_msg：审核列表与发布时间线的组合索引
CREATE INDEX `idx_exp_msg_status_time`
  ON `exp_msg` (`status` ASC, `create_time` ASC) USING BTREE;

-- 2. exp_msg：学科-年级-状态组合筛选
CREATE INDEX `idx_exp_msg_subject_grade_status`
  ON `exp_msg` (`subject_id` ASC, `grade_id` ASC, `status` ASC) USING BTREE;

-- 3. exp_homework：班级任务列表
CREATE INDEX `idx_exp_homework_class_time`
  ON `exp_homework` (`class_id` ASC, `create_time` ASC) USING BTREE;
