-- ----------------------------
-- Table structure for sys_parent_student_rel
-- 家长-学生绑定关系表（家长自助申请 + 校级管理员审核）
-- 状态码按产品定义：T-待审，Y-通过，N-不通过
-- ----------------------------
DROP TABLE IF EXISTS `sys_parent_student_rel`;
CREATE TABLE `sys_parent_student_rel` (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `parent_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '家长id,关联sys_user表',
  `student_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '学生id,关联sys_user表',
  `school_org_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '学校id,关联sys_org表',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
  `audit_status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'T' COMMENT '审核状态(T-待审，Y-通过，N-不通过)',
  `audit_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '审核人id,关联sys_user表',
  `audit_comments` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '审核说明',
  `audit_time` datetime NULL DEFAULT NULL COMMENT '审核时间',
  PRIMARY KEY (`seq_id`) USING BTREE,
  UNIQUE KEY `uk_parent_student` (`parent_user_id`,`student_user_id`) USING BTREE,
  KEY `idx_parent_id` (`parent_user_id`) USING BTREE,
  KEY `idx_student_id` (`student_user_id`) USING BTREE,
  KEY `idx_audit_list` (`school_org_id`,`audit_status`) USING BTREE,
  CONSTRAINT `fk_parent_student_rel_parent` FOREIGN KEY (`parent_user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_parent_student_rel_student` FOREIGN KEY (`student_user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_parent_student_rel_school` FOREIGN KEY (`school_org_id`) REFERENCES `sys_org` (`org_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='家长-学生绑定审核表' ROW_FORMAT=Dynamic;

