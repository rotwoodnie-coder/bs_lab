-- ==============================================================
-- 0001: 修复已知问题 — 时间类型统一、补充唯一约束与缺失外键
-- 目标数据库：bs_exp_data
-- 对应文档：docs/core/bs_exp_data-database-design.md §10.1
-- ==============================================================

-- ==============================================================
-- 001: 时间类型统一 — varchar(20) → datetime
-- ==============================================================

-- subject_group.create_time: varchar(20) → datetime
-- 注意：该列原有 NOT NULL 但无 DEFAULT，改为 datetime 后也保留 NOT NULL
ALTER TABLE `subject_group`
  MODIFY COLUMN `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';

-- subject_group_member.create_time: varchar(20) → datetime
ALTER TABLE `subject_group_member`
  MODIFY COLUMN `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间';

-- data_file.create_time: timestamp → datetime（与 exp_msg.create_time 对齐）
-- timestamp 有时区转换问题，统一为 datetime 便于与全库一致
ALTER TABLE `data_file`
  MODIFY COLUMN `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';

-- ==============================================================
-- 002: 补充唯一约束 — 防止重复数据
-- ==============================================================

-- exp_arbitration_like: 同一用户对同一仲裁只可支持一次
CREATE UNIQUE INDEX `uk_exp_arb_like_exp_user`
  ON `exp_arbitration_like` (`exp_id` ASC, `user_id` ASC) USING BTREE;

-- exp_arbitration_notlike: 同一用户对同一仲裁只可反对一次
CREATE UNIQUE INDEX `uk_exp_arb_notlike_exp_user`
  ON `exp_arbitration_notlike` (`exp_id` ASC, `user_id` ASC) USING BTREE;

-- exp_homework_student: 同一学生只能有一条作业记录
ALTER TABLE `exp_homework_student`
  ADD UNIQUE INDEX `uk_exp_hw_student_work_stu` (`work_id` ASC, `student_user_id` ASC) USING BTREE;

-- ==============================================================
-- 003: 补充外键约束 — 保障数据完整性
-- ==============================================================

-- subject_group_member.group_id → subject_group.group_id（当前 DDL 缺失该约束）
ALTER TABLE `subject_group_member`
  ADD CONSTRAINT `fk_subject_group_member_group`
  FOREIGN KEY (`group_id`) REFERENCES `subject_group` (`group_id`)
  ON DELETE RESTRICT ON UPDATE RESTRICT;
