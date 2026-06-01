-- ----------------------------
-- Migration 0013: 创建 virtual_experiment 表
-- 对应设计文档：docs/virtual-experiment/virtual-experiment-design-v1.0.md
-- ----------------------------
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for virtual_experiment
-- ----------------------------
DROP TABLE IF EXISTS `virtual_experiment`;
CREATE TABLE `virtual_experiment` (
  `id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '实验名称',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '实验描述',
  `source_type` enum('url','html_file') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '来源类型：url（URL内嵌）、html_file（HTML文件上传）',
  `source_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '外部 URL（source_type=url 时）',
  `file_storage_key` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'MinIO 存储 Key（source_type=html_file 时）',
  `file_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '原始文件名（source_type=html_file 时）',
  `file_size` bigint NULL DEFAULT NULL COMMENT '文件字节数（source_type=html_file 时）',
  `cover_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '封面图 S3 Key',
  `view_count` bigint NOT NULL DEFAULT 0 COMMENT '访问次数',
  `call_count` bigint NOT NULL DEFAULT 0 COMMENT '被调用次数',
  `status` enum('draft','pending','published','rejected','archived') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'draft' COMMENT '状态：draft（草稿）、pending（审核中）、published（已发布）、rejected（已拒绝）、archived（已归档）',
  `reviewer_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '审核人 user_id',
  `review_comment` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '审核意见',
  `review_time` datetime NULL DEFAULT NULL COMMENT '审核时间',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序序号',
  `create_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '创建人 user_id',
  `create_user_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '创建人姓名（冗余，优化列表查询）',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '最后修改人 user_id',
  `update_time` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '最后修改时间',
  `is_deleted` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'n' COMMENT '软删除标记：y/n',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_ve_create_user`(`create_user_id` ASC) USING BTREE,
  INDEX `idx_ve_status`(`status` ASC) USING BTREE,
  INDEX `idx_ve_source_type`(`source_type` ASC) USING BTREE,
  INDEX `idx_ve_sort_order`(`sort_order` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '虚拟实验表' ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
