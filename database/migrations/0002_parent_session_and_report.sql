-- ----------------------------
-- Table structure for parent_session
-- 家长辅导会话（亲子实验记录）
-- ----------------------------
DROP TABLE IF EXISTS `parent_session`;
CREATE TABLE `parent_session` (
  `session_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '会话ID',
  `parent_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '家长用户ID',
  `student_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '学生用户ID',
  `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '实验ID',
  `work_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '关联作业ID（来自教师分发）',
  `task_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '关联学生任务seq_id（exp_homework_student.seq_id）',
  `guide_style` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'gentle' COMMENT 'AI引导风格：gentle/rigorous/playful',
  `parent_attested_at` datetime NULL DEFAULT NULL COMMENT '家长陪同背书时间',
  `error_count` int NOT NULL DEFAULT 0 COMMENT '操作错误预警次数',
  `material_shortage_reported` tinyint NOT NULL DEFAULT 0 COMMENT '是否已反馈材料难凑齐',
  `evaluation_status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'none' COMMENT '教师评价状态：none/evaluated',
  `teacher_comment` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '教师评语',
  `teacher_star_rating` int NULL DEFAULT NULL COMMENT '教师星级评分（1-5）',
  `completion_status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'in_progress' COMMENT '完成状态：in_progress/completed',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  PRIMARY KEY (`session_id`) USING BTREE,
  INDEX `idx_parent_session_parent`(`parent_user_id` ASC) USING BTREE,
  INDEX `idx_parent_session_student`(`student_user_id` ASC) USING BTREE,
  INDEX `idx_parent_session_exp`(`exp_id` ASC) USING BTREE,
  CONSTRAINT `fk_parent_session_parent` FOREIGN KEY (`parent_user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_parent_session_student` FOREIGN KEY (`student_user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_parent_session_exp` FOREIGN KEY (`exp_id`) REFERENCES `exp_msg` (`exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='家长辅导会话' ROW_FORMAT=Dynamic;

-- ----------------------------
-- Table structure for parent_report
-- 亲子实验报告（与会话 1:1）
-- ----------------------------
DROP TABLE IF EXISTS `parent_report`;
CREATE TABLE `parent_report` (
  `report_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '报告ID',
  `session_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '关联会话ID',
  `summary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '摘要',
  `strengths` json NULL COMMENT '亮点列表（JSON数组）',
  `improvements` json NULL COMMENT '待改进列表（JSON数组）',
  `next_recommendations` json NULL COMMENT '后续建议列表（JSON数组）',
  `share_copy` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '分享文案',
  `teacher_comment` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '教师评语（成就卡用）',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`report_id`) USING BTREE,
  UNIQUE INDEX `uk_report_session`(`session_id` ASC) USING BTREE,
  CONSTRAINT `fk_parent_report_session` FOREIGN KEY (`session_id`) REFERENCES `parent_session` (`session_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='亲子实验报告' ROW_FORMAT=Dynamic;
