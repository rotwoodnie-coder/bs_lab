-- ----------------------------
-- Migration 0044: 教师授课班级关系专用表
-- 替代之前在 sys_user_role 中通过 role_id 间接映射学科的做法。
-- 教师 + 班级 + 学科 三元组唯一（UNIQUE），支持启用/停用状态。
-- ----------------------------

DROP TABLE IF EXISTS `Teacher_Class`;

CREATE TABLE `Teacher_Class` (
  `seq_id`         varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `teacher_id`     varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '教师人员id（sys_user.user_id）',
  `class_org_id`   varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '班级组织id（sys_org.org_id，org_type_id=Org_School_Class）',
  `subject_id`     varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '学科id（data_school_subject.subject_id）',
  `status`         varchar(4)  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'y' COMMENT '状态：y启用 n停用',
  `create_time`    datetime NULL DEFAULT NULL COMMENT '创建时间',
  `update_time`    datetime NULL DEFAULT NULL COMMENT '更新时间',
  `create_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '创建人',
  `update_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '更新人',
  PRIMARY KEY (`seq_id`) USING BTREE,
  UNIQUE KEY `uk_teacher_class_subject` (`teacher_id`, `class_org_id`, `subject_id`) USING BTREE,
  INDEX `idx_tc_teacher`(`teacher_id` ASC) USING BTREE,
  INDEX `idx_tc_class`(`class_org_id` ASC) USING BTREE,
  INDEX `idx_tc_subject`(`subject_id` ASC) USING BTREE,
  CONSTRAINT `fk_tc_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_tc_class` FOREIGN KEY (`class_org_id`) REFERENCES `sys_org` (`org_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_tc_subject` FOREIGN KEY (`subject_id`) REFERENCES `data_school_subject` (`subject_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '教师授课班级关系' ROW_FORMAT = Dynamic;
