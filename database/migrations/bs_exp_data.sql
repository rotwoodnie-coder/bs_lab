/*
 Navicat Premium Data Transfer

 Source Server         : 10.0.181.204
 Source Server Type    : MySQL
 Source Server Version : 90001
 Source Host           : 10.0.181.204:13306
 Source Schema         : bs_exp_data

 Target Server Type    : MySQL
 Target Server Version : 90001
 File Encoding         : 65001

 Date: 06/05/2026 21:31:08
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for data_coursebook
-- ----------------------------
DROP TABLE IF EXISTS `data_coursebook`;
CREATE TABLE `data_coursebook`  (
  `coursebook_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `coursebook_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '教材名称',
  `coursebook_version` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '教材版本',
  `subject_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '学科id',
  `comments` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说明',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  PRIMARY KEY (`coursebook_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '教材' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for data_coursebook_chapter
-- ----------------------------
DROP TABLE IF EXISTS `data_coursebook_chapter`;
CREATE TABLE `data_coursebook_chapter`  (
  `chapter_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `chapter_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '章名称',
  `coursebook_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '教材id',
  `comments` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说明',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`chapter_id`) USING BTREE,
  INDEX `idx_data_chapter_coursebook`(`coursebook_id` ASC) USING BTREE,
  CONSTRAINT `fk_data_chapter_coursebook` FOREIGN KEY (`coursebook_id`) REFERENCES `data_coursebook` (`coursebook_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '教材章' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for data_coursebook_unit
-- ----------------------------
DROP TABLE IF EXISTS `data_coursebook_unit`;
CREATE TABLE `data_coursebook_unit`  (
  `unit_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `unit_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '节名称',
  `chapter_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '章id',
  `comments` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说明',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`unit_id`) USING BTREE,
  INDEX `idx_data_unit_chapter`(`chapter_id` ASC) USING BTREE,
  CONSTRAINT `fk_data_unit_chapter` FOREIGN KEY (`chapter_id`) REFERENCES `data_coursebook_chapter` (`chapter_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '教材节' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for data_difficulty_type
-- ----------------------------
DROP TABLE IF EXISTS `data_difficulty_type`;
CREATE TABLE `data_difficulty_type`  (
  `type_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `type_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '题库难度类型名称',
  `comments` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说明',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`type_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '题库难度类型' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for data_exp_difficulty
-- ----------------------------
DROP TABLE IF EXISTS `data_exp_difficulty`;
CREATE TABLE `data_exp_difficulty`  (
  `difficulty_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `difficulty_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验难度名称',
  `comments` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说明',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`difficulty_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试验难度' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for data_file
-- ----------------------------
DROP TABLE IF EXISTS `data_file`;
CREATE TABLE `data_file`  (
  `file_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `file_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文件名称',
  `file_url` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文件URL',
  `file_type_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '文件类型id',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `owner_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '归属人id',
  `logo_url` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '封面图URL',
  `file_size` bigint NULL DEFAULT NULL COMMENT '文件大小（字节）',
  `file_ext` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '文件后缀',
  `content_sha256` char(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '内容 SHA-256(hex)',
  `is_hidden_from_gallery` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否在媒体库列表中隐藏（1=隐藏，0=展示）',
  `biz_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '业务类型：avatar（头像）、media（媒体素材）、document（文档），空表示未归类',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `parent_file_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '父文件ID（自引用），表达从属关系',
  `relation_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '关系类型：logo（封面）、transcoded（转码）等',
  `cover_file_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '封面文件ID（冗余加速）',
  PRIMARY KEY (`file_id`) USING BTREE,
  UNIQUE INDEX `uq_data_file_parent_relation`(`parent_file_id` ASC, `relation_type` ASC) USING BTREE,
  INDEX `idx_data_file_type`(`file_type_id` ASC) USING BTREE,
  INDEX `idx_data_file_owner`(`owner_user_id` ASC) USING BTREE,
  INDEX `idx_data_file_relation`(`relation_type` ASC) USING BTREE,
  INDEX `idx_df_hidden_gallery`(`is_hidden_from_gallery` ASC) USING BTREE,
  CONSTRAINT `fk_data_file_parent` FOREIGN KEY (`parent_file_id`) REFERENCES `data_file` (`file_id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '文件资源主表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for data_file_type
-- ----------------------------
DROP TABLE IF EXISTS `data_file_type`;
CREATE TABLE `data_file_type`  (
  `type_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `type_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '类型名称',
  `comments` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说明',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  `logo_class` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '图标样式标识',
  PRIMARY KEY (`type_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '素材类别（初始化，不能修改）' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for data_material_prop
-- ----------------------------
DROP TABLE IF EXISTS `data_material_prop`;
CREATE TABLE `data_material_prop`  (
  `prop_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `prop_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '属性名称',
  `comments` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说明',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`prop_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '材料属性' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for data_material_security
-- ----------------------------
DROP TABLE IF EXISTS `data_material_security`;
CREATE TABLE `data_material_security`  (
  `security_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `security_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '安全性名称',
  `comments` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说明',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  `security_level` int NULL DEFAULT NULL COMMENT '危险等级（数值越低越危险，0最危险）',
  PRIMARY KEY (`security_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '材料安全性' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for data_material_type
-- ----------------------------
DROP TABLE IF EXISTS `data_material_type`;
CREATE TABLE `data_material_type`  (
  `type_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `type_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '分类名称',
  `comments` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说明',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`type_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '材料分类' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for data_material_unit
-- ----------------------------
DROP TABLE IF EXISTS `data_material_unit`;
CREATE TABLE `data_material_unit`  (
  `unit_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `unit_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '计量单位名称',
  `comments` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说明',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`unit_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '材料计量单位' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for data_msg_type
-- ----------------------------
DROP TABLE IF EXISTS `data_msg_type`;
CREATE TABLE `data_msg_type`  (
  `type_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `type_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '名称',
  `comments` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说明',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`type_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '消息分类' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for data_org_type
-- ----------------------------
DROP TABLE IF EXISTS `data_org_type`;
CREATE TABLE `data_org_type`  (
  `type_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `type_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '组织类型名称',
  `comments` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说明',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`type_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '组织类型（初始化，不能修改）' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for data_pref_title
-- ----------------------------
DROP TABLE IF EXISTS `data_pref_title`;
CREATE TABLE `data_pref_title`  (
  `title_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `title_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '职称名称',
  `comments` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说明',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`title_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '职称' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for data_question_capacity
-- ----------------------------
DROP TABLE IF EXISTS `data_question_capacity`;
CREATE TABLE `data_question_capacity`  (
  `capacity_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `capacity_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '能力侧重点名称',
  `comments` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说明',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`capacity_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '题目能力侧重点' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for data_question_type
-- ----------------------------
DROP TABLE IF EXISTS `data_question_type`;
CREATE TABLE `data_question_type`  (
  `type_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `type_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '题型名称',
  `comments` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说明',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`type_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '题型' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for data_rating_scale
-- ----------------------------
DROP TABLE IF EXISTS `data_rating_scale`;
CREATE TABLE `data_rating_scale`  (
  `scale_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `scale_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '评分名称',
  `comments` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说明',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`scale_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '评分等级（初始化，不能修改）' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for data_role
-- ----------------------------
DROP TABLE IF EXISTS `data_role`;
CREATE TABLE `data_role`  (
  `role_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `role_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '角色名称',
  `comments` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说明',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`role_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户角色（初始化，不能修改）' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for data_school_grade
-- ----------------------------
DROP TABLE IF EXISTS `data_school_grade`;
CREATE TABLE `data_school_grade`  (
  `grade_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `grade_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '年级名称',
  `comments` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说明',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  `school_level_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '所属学段id',
  PRIMARY KEY (`grade_id`) USING BTREE,
  INDEX `idx_data_school_grade_level`(`school_level_id` ASC) USING BTREE,
  CONSTRAINT `fk_data_school_grade_level` FOREIGN KEY (`school_level_id`) REFERENCES `data_school_level` (`level_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '年级信息' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for data_school_grade_subject
-- ----------------------------
DROP TABLE IF EXISTS `data_school_grade_subject`;
CREATE TABLE `data_school_grade_subject`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `subject_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '学科id',
  `grade_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '年级id',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_data_grade_subject_subject`(`subject_id` ASC) USING BTREE,
  INDEX `idx_data_grade_subject_grade`(`grade_id` ASC) USING BTREE,
  CONSTRAINT `fk_data_grade_subject_grade` FOREIGN KEY (`grade_id`) REFERENCES `data_school_grade` (`grade_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_data_grade_subject_subject` FOREIGN KEY (`subject_id`) REFERENCES `data_school_subject` (`subject_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '年级与学科关联' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for data_school_level
-- ----------------------------
DROP TABLE IF EXISTS `data_school_level`;
CREATE TABLE `data_school_level`  (
  `level_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `level_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '学段名称',
  `comments` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说明',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`level_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '学段信息' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for data_school_subject
-- ----------------------------
DROP TABLE IF EXISTS `data_school_subject`;
CREATE TABLE `data_school_subject`  (
  `subject_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `subject_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '学科名称',
  `comments` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说明',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`subject_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '学科' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_arbitration
-- ----------------------------
DROP TABLE IF EXISTS `exp_arbitration`;
CREATE TABLE `exp_arbitration`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验id',
  `initiator_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '发起人id',
  `initiator_time` datetime NULL DEFAULT NULL COMMENT '发起时间',
  `like_num` int NOT NULL DEFAULT 0 COMMENT '点赞数',
  `notlike_num` int NOT NULL DEFAULT 0 COMMENT '倒赞数',
  `judge_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '评判教师id',
  `judge_time` datetime NULL DEFAULT NULL COMMENT '评判时间',
  `initiator_status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '仲裁状态：t 仲裁中，y 通过，n 不通过',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_exp_arbitration_exp`(`exp_id` ASC) USING BTREE,
  INDEX `idx_exp_arbitration_initiator`(`initiator_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_arbitration_exp` FOREIGN KEY (`exp_id`) REFERENCES `exp_msg` (`exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_arbitration_initiator` FOREIGN KEY (`initiator_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '实验仲裁（实验小法庭）' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_arbitration_like
-- ----------------------------
DROP TABLE IF EXISTS `exp_arbitration_like`;
CREATE TABLE `exp_arbitration_like`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验id',
  `user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户id',
  `comments` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '支持理由',
  `create_time` datetime NULL DEFAULT NULL COMMENT '记录时间',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_exp_arb_like_exp`(`exp_id` ASC) USING BTREE,
  INDEX `idx_exp_arb_like_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_arb_like_exp` FOREIGN KEY (`exp_id`) REFERENCES `exp_msg` (`exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_arb_like_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '仲裁支持记录' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_arbitration_notlike
-- ----------------------------
DROP TABLE IF EXISTS `exp_arbitration_notlike`;
CREATE TABLE `exp_arbitration_notlike`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验id',
  `user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户id',
  `comments` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '反对理由',
  `create_time` datetime NULL DEFAULT NULL COMMENT '记录时间',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_exp_arb_notlike_exp`(`exp_id` ASC) USING BTREE,
  INDEX `idx_exp_arb_notlike_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_arb_notlike_exp` FOREIGN KEY (`exp_id`) REFERENCES `exp_msg` (`exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_arb_notlike_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '仲裁反对记录（仅实验小法庭中展示，不可删除）' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_grade
-- ----------------------------
DROP TABLE IF EXISTS `exp_grade`;
CREATE TABLE `exp_grade`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `lib_exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验id',
  `grade_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '年级id',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_exp_grade_exp`(`lib_exp_id` ASC) USING BTREE,
  INDEX `idx_exp_grade_grade`(`grade_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_grade_exp` FOREIGN KEY (`lib_exp_id`) REFERENCES `exp_library` (`lib_exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_grade_grade` FOREIGN KEY (`grade_id`) REFERENCES `data_school_grade` (`grade_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试验适用年级' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_homework
-- ----------------------------
DROP TABLE IF EXISTS `exp_homework`;
CREATE TABLE `exp_homework`  (
  `work_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验id',
  `teacher_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '教师id',
  `class_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '班级id',
  `require_date` datetime NULL DEFAULT NULL COMMENT '要求完成日期',
  `create_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '创建人id',
  `create_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `update_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '最后更新人id',
  `update_time` datetime NULL DEFAULT NULL COMMENT '最后更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除：0 正常，1 已删除',
  PRIMARY KEY (`work_id`) USING BTREE,
  INDEX `idx_exp_homework_exp`(`exp_id` ASC) USING BTREE,
  INDEX `idx_exp_homework_teacher`(`teacher_user_id` ASC) USING BTREE,
  INDEX `idx_exp_homework_class`(`class_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_homework_class` FOREIGN KEY (`class_id`) REFERENCES `sys_org` (`org_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_homework_exp` FOREIGN KEY (`exp_id`) REFERENCES `exp_msg` (`exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_homework_teacher` FOREIGN KEY (`teacher_user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试验作业（教师发布）' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_homework_student
-- ----------------------------
DROP TABLE IF EXISTS `exp_homework_student`;
CREATE TABLE `exp_homework_student`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `work_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '作业任务id',
  `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '学生试验副本id（作业快照）',
  `teacher_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '教师id',
  `teacher_exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '教师标准版试验id（快照冻结）',
  `student_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '学生id',
  `require_date` datetime NULL DEFAULT NULL COMMENT '要求完成日期',
  `submit_date` datetime NULL DEFAULT NULL COMMENT '提交日期',
  `mark_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '批改人id',
  `mark_time` datetime NULL DEFAULT NULL COMMENT '批改时间',
  `mark_result` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '批改结果评分',
  `mark_comments` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '批改意见',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_exp_hw_student_work`(`work_id` ASC) USING BTREE,
  INDEX `idx_exp_hw_student_exp`(`exp_id` ASC) USING BTREE,
  INDEX `idx_exp_hw_student_student`(`student_user_id` ASC) USING BTREE,
  INDEX `fk_exp_hw_student_teacher`(`teacher_user_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_hw_student_student` FOREIGN KEY (`student_user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_hw_student_teacher` FOREIGN KEY (`teacher_user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_hw_student_work` FOREIGN KEY (`work_id`) REFERENCES `exp_homework` (`work_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '学生试验作业（含快照机制）' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_library
-- ----------------------------
DROP TABLE IF EXISTS `exp_library`;
CREATE TABLE `exp_library`  (
  `lib_exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `lib_exp_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '标准试验名称',
  `choose_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '必做/选做：y 必做，n 选做',
  `subject_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '学科id',
  `school_level_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '学段id',
  `comments` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '备注',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：t 草稿，y 发布，n 停用',
  `create_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '创建人id',
  `create_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `update_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '最后更新人id',
  `update_time` datetime NULL DEFAULT NULL COMMENT '最后更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除：0 正常，1 已删除',
  PRIMARY KEY (`lib_exp_id`) USING BTREE,
  INDEX `idx_exp_library_subject`(`subject_id` ASC) USING BTREE,
  INDEX `idx_exp_library_level`(`school_level_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_library_level` FOREIGN KEY (`school_level_id`) REFERENCES `data_school_level` (`level_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_library_subject` FOREIGN KEY (`subject_id`) REFERENCES `data_school_subject` (`subject_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '标准试验库' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_library_grade
-- ----------------------------
DROP TABLE IF EXISTS `exp_library_grade`;
CREATE TABLE `exp_library_grade`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `lib_exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '标准试验id',
  `grade_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '年级id',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_exp_library_grade_exp`(`lib_exp_id` ASC) USING BTREE,
  INDEX `idx_exp_library_grade_grade`(`grade_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_library_grade_exp` FOREIGN KEY (`lib_exp_id`) REFERENCES `exp_library` (`lib_exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_library_grade_grade` FOREIGN KEY (`grade_id`) REFERENCES `data_school_grade` (`grade_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '标准试验适用年级' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_library_video
-- ----------------------------
DROP TABLE IF EXISTS `exp_library_video`;
CREATE TABLE `exp_library_video`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '标准试验id',
  `video_url` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '视频URL',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  `create_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_exp_library_video_exp`(`exp_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_library_video_exp` FOREIGN KEY (`exp_id`) REFERENCES `exp_library` (`lib_exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '标准试验视频' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_material
-- ----------------------------
DROP TABLE IF EXISTS `exp_material`;
CREATE TABLE `exp_material`  (
  `exp_material_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验id',
  `material_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '材料主库id',
  `material_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '材料名称（允许自定义覆盖）',
  `is_self` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'n' COMMENT '是否自定义：y 自定义，n 来自材料库',
  `material_num` int NULL DEFAULT NULL COMMENT '试验用量',
  `material_unit` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '计量单位',
  `material_prop_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '材料属性id',
  `material_type_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '材料分类id',
  `main_pic_url` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '主图片URL',
  `exp_purpose` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '试验用途',
  `additional_comments` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '补充说明',
  `comments` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '备注',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  `create_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`exp_material_id`) USING BTREE,
  INDEX `idx_exp_material_exp`(`exp_id` ASC) USING BTREE,
  INDEX `idx_exp_material_prop`(`material_prop_id` ASC) USING BTREE,
  INDEX `idx_exp_material_type`(`material_type_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_material_exp` FOREIGN KEY (`exp_id`) REFERENCES `exp_msg` (`exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_material_prop` FOREIGN KEY (`material_prop_id`) REFERENCES `data_material_prop` (`prop_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_material_type` FOREIGN KEY (`material_type_id`) REFERENCES `data_material_type` (`type_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试验材料明细' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_material_pic
-- ----------------------------
DROP TABLE IF EXISTS `exp_material_pic`;
CREATE TABLE `exp_material_pic`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `exp_material_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验材料id',
  `material_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '材料主库id',
  `material_url` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '图片URL',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  `create_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_exp_material_pic_material`(`exp_material_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_material_pic_material` FOREIGN KEY (`exp_material_id`) REFERENCES `exp_material` (`exp_material_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试验材料图片' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_material_security
-- ----------------------------
DROP TABLE IF EXISTS `exp_material_security`;
CREATE TABLE `exp_material_security`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `exp_material_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验材料id',
  `material_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '材料主库id',
  `security_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '安全性id',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  `create_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_exp_material_sec_material`(`exp_material_id` ASC) USING BTREE,
  INDEX `idx_exp_material_sec_security`(`security_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_material_sec_material` FOREIGN KEY (`exp_material_id`) REFERENCES `exp_material` (`exp_material_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_material_sec_security` FOREIGN KEY (`security_id`) REFERENCES `data_material_security` (`security_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试验材料安全性关联' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_msg
-- ----------------------------
DROP TABLE IF EXISTS `exp_msg`;
CREATE TABLE `exp_msg`  (
  `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `exp_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验名称',
  `choose_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '必做/选做：y 必做，n 选做',
  `subject_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '学科id',
  `school_level_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '学段id',
  `grade_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '年级id',
  `difficulty_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '难度id',
  `exp_principle` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '试验原理（富文本）',
  `exp_caution` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '注意事项',
  `exp_danger` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '危险提示',
  `class_hour` decimal(6, 2) NULL DEFAULT NULL COMMENT '课时',
  `coursebook_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '对应教材id',
  `unit_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '对应教材节id',
  `create_user_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '发布人类型：Teacher 教师，Student 学生',
  `create_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '发布人id',
  `create_time` datetime NULL DEFAULT NULL COMMENT '发布时间',
  `confirm_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '审核人id',
  `confirm_time` datetime NULL DEFAULT NULL COMMENT '审核时间',
  `confirm_comments` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '审批意见',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '审核状态：t 草稿，y 通过，n 不通过',
  `standard_exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '关联标准试验库id',
  `link_exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '关联试验id',
  `exp_task_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '作业类型：hw 作业，tk 拍同款，self 自主试验',
  `like_num` int NOT NULL DEFAULT 0 COMMENT '点赞数（聚合统计）',
  `notlike_num` int NOT NULL DEFAULT 0 COMMENT '倒赞数（聚合统计）',
  `collection_num` int NOT NULL DEFAULT 0 COMMENT '收藏数（聚合统计）',
  `evaluate_num` int NOT NULL DEFAULT 0 COMMENT '评价数（聚合统计）',
  `simulator_url` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '模拟器地址',
  `update_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '最后更新人id',
  `update_time` datetime NULL DEFAULT NULL COMMENT '最后更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除：0 正常，1 已删除',
  PRIMARY KEY (`exp_id`) USING BTREE,
  INDEX `idx_exp_msg_subject`(`subject_id` ASC) USING BTREE,
  INDEX `idx_exp_msg_level`(`school_level_id` ASC) USING BTREE,
  INDEX `idx_exp_msg_grade`(`grade_id` ASC) USING BTREE,
  INDEX `idx_exp_msg_difficulty`(`difficulty_id` ASC) USING BTREE,
  INDEX `idx_exp_msg_coursebook`(`coursebook_id` ASC) USING BTREE,
  INDEX `idx_exp_msg_unit`(`unit_id` ASC) USING BTREE,
  INDEX `idx_exp_msg_standard_exp`(`standard_exp_id` ASC) USING BTREE,
  INDEX `idx_exp_msg_create_user`(`create_user_id` ASC) USING BTREE,
  INDEX `idx_exp_msg_create_user_type`(`create_user_type` ASC) USING BTREE,
  INDEX `idx_exp_msg_status`(`status` ASC) USING BTREE,
  CONSTRAINT `fk_exp_msg_coursebook` FOREIGN KEY (`coursebook_id`) REFERENCES `data_coursebook` (`coursebook_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_msg_create_user` FOREIGN KEY (`create_user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_msg_difficulty` FOREIGN KEY (`difficulty_id`) REFERENCES `data_exp_difficulty` (`difficulty_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_msg_grade` FOREIGN KEY (`grade_id`) REFERENCES `data_school_grade` (`grade_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_msg_level` FOREIGN KEY (`school_level_id`) REFERENCES `data_school_level` (`level_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_msg_standard_exp` FOREIGN KEY (`standard_exp_id`) REFERENCES `exp_library` (`lib_exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_msg_subject` FOREIGN KEY (`subject_id`) REFERENCES `data_school_subject` (`subject_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_msg_unit` FOREIGN KEY (`unit_id`) REFERENCES `data_coursebook_unit` (`unit_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试验（教师/学生）' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_pic
-- ----------------------------
DROP TABLE IF EXISTS `exp_pic`;
CREATE TABLE `exp_pic`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `pic_url` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '图片URL',
  `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验id',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  `file_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '素材id',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_exp_pic_exp`(`exp_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_pic_exp` FOREIGN KEY (`exp_id`) REFERENCES `exp_msg` (`exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试验图片' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_question
-- ----------------------------
DROP TABLE IF EXISTS `exp_question`;
CREATE TABLE `exp_question`  (
  `question_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `question_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '题干内容（富文本）',
  `teacher_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '出题人/所属教师id',
  `class_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '班级/年级关联id',
  `difficulty_type_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '难度类型id',
  `question_type_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '题型id',
  `question_capacity_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '能力侧重点id',
  `unit_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '教材节id',
  `knowledge_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '知识点id',
  `knowledge_content` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '知识点内容',
  `choose_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '选择类型：单选/多选',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用，t 草稿',
  `create_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '创建人id',
  `create_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `update_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '最后更新人id',
  `update_time` datetime NULL DEFAULT NULL COMMENT '最后更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除：0 正常，1 已删除',
  PRIMARY KEY (`question_id`) USING BTREE,
  INDEX `idx_exp_question_teacher`(`teacher_user_id` ASC) USING BTREE,
  INDEX `idx_exp_question_class`(`class_id` ASC) USING BTREE,
  INDEX `idx_exp_question_difficulty`(`difficulty_type_id` ASC) USING BTREE,
  INDEX `idx_exp_question_type`(`question_type_id` ASC) USING BTREE,
  INDEX `idx_exp_question_unit`(`unit_id` ASC) USING BTREE,
  INDEX `fk_exp_question_capacity`(`question_capacity_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_question_capacity` FOREIGN KEY (`question_capacity_id`) REFERENCES `data_question_capacity` (`capacity_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_question_class` FOREIGN KEY (`class_id`) REFERENCES `sys_org` (`org_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_question_difficulty` FOREIGN KEY (`difficulty_type_id`) REFERENCES `data_difficulty_type` (`type_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_question_teacher` FOREIGN KEY (`teacher_user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_question_type` FOREIGN KEY (`question_type_id`) REFERENCES `data_question_type` (`type_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_question_unit` FOREIGN KEY (`unit_id`) REFERENCES `data_coursebook_unit` (`unit_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '题目' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_question_answer
-- ----------------------------
DROP TABLE IF EXISTS `exp_question_answer`;
CREATE TABLE `exp_question_answer`  (
  `answer_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `question_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '题目id',
  `user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '答题人id',
  `create_time` datetime NULL DEFAULT NULL COMMENT '答题时间',
  `question_result` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '答题结果：y 正确，n 错误',
  PRIMARY KEY (`answer_id`) USING BTREE,
  INDEX `idx_exp_q_answer_question`(`question_id` ASC) USING BTREE,
  INDEX `idx_exp_q_answer_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_q_answer_question` FOREIGN KEY (`question_id`) REFERENCES `exp_question` (`question_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_q_answer_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '答题记录' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_question_answer_select
-- ----------------------------
DROP TABLE IF EXISTS `exp_question_answer_select`;
CREATE TABLE `exp_question_answer_select`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `answer_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '答题记录id',
  `question_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '题目id',
  `select_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '选项id',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_exp_q_ans_sel_answer`(`answer_id` ASC) USING BTREE,
  INDEX `idx_exp_q_ans_sel_question`(`question_id` ASC) USING BTREE,
  INDEX `fk_exp_q_ans_sel_select`(`select_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_q_ans_sel_answer` FOREIGN KEY (`answer_id`) REFERENCES `exp_question_answer` (`answer_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_q_ans_sel_question` FOREIGN KEY (`question_id`) REFERENCES `exp_question` (`question_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_q_ans_sel_select` FOREIGN KEY (`select_id`) REFERENCES `exp_question_select` (`select_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '答题选项明细' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_question_select
-- ----------------------------
DROP TABLE IF EXISTS `exp_question_select`;
CREATE TABLE `exp_question_select`  (
  `select_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `question_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '题目id',
  `select_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '选项内容',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  `is_right` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'n' COMMENT '是否正确答案：y 正确，n 错误',
  PRIMARY KEY (`select_id`) USING BTREE,
  INDEX `idx_exp_q_select_question`(`question_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_q_select_question` FOREIGN KEY (`question_id`) REFERENCES `exp_question` (`question_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '题目选项' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_reference
-- ----------------------------
DROP TABLE IF EXISTS `exp_reference`;
CREATE TABLE `exp_reference`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验id',
  `reference_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '引用名称',
  `reference_source` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '引用出处/URL',
  `reference_comments` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '引用说明',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_exp_reference_exp`(`exp_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_reference_exp` FOREIGN KEY (`exp_id`) REFERENCES `exp_msg` (`exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试验参考引用' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_reference_video
-- ----------------------------
DROP TABLE IF EXISTS `exp_reference_video`;
CREATE TABLE `exp_reference_video`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `video_url` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '视频URL',
  `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验id',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  `file_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '素材id',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_exp_reference_video_exp`(`exp_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_reference_video_exp` FOREIGN KEY (`exp_id`) REFERENCES `exp_msg` (`exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试验参考引用视频' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_result
-- ----------------------------
DROP TABLE IF EXISTS `exp_result`;
CREATE TABLE `exp_result`  (
  `result_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验id',
  `result_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '结果名称',
  `result_comments` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '结果内容（富文本）',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`result_id`) USING BTREE,
  INDEX `idx_exp_result_exp`(`exp_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_result_exp` FOREIGN KEY (`exp_id`) REFERENCES `exp_msg` (`exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试验结果' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_scientist
-- ----------------------------
DROP TABLE IF EXISTS `exp_scientist`;
CREATE TABLE `exp_scientist`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验id',
  `scientist_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '科学家名称',
  `story_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '故事名称',
  `story_comments` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '故事内容',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_exp_scientist_exp`(`exp_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_scientist_exp` FOREIGN KEY (`exp_id`) REFERENCES `exp_msg` (`exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试验科学家故事' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_security
-- ----------------------------
DROP TABLE IF EXISTS `exp_security`;
CREATE TABLE `exp_security`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验id',
  `security_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '安全性id',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  `security_level` int NULL DEFAULT NULL COMMENT '危险等级（数值越低越危险）',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_exp_security_exp`(`exp_id` ASC) USING BTREE,
  INDEX `idx_exp_security_security`(`security_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_security_exp` FOREIGN KEY (`exp_id`) REFERENCES `exp_msg` (`exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_security_security` FOREIGN KEY (`security_id`) REFERENCES `data_material_security` (`security_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试验安全性关联' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_simulation_record
-- ----------------------------
DROP TABLE IF EXISTS `exp_simulation_record`;
CREATE TABLE `exp_simulation_record`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验id',
  `user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '发起人id',
  `begin_time` datetime NULL DEFAULT NULL COMMENT '模拟开始时间',
  `end_time` datetime NULL DEFAULT NULL COMMENT '模拟结束时间',
  `score` decimal(6, 2) NULL DEFAULT NULL COMMENT '评分',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_exp_simulation_exp`(`exp_id` ASC) USING BTREE,
  INDEX `idx_exp_simulation_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_simulation_exp` FOREIGN KEY (`exp_id`) REFERENCES `exp_msg` (`exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_exp_simulation_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '模拟试验记录' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_step
-- ----------------------------
DROP TABLE IF EXISTS `exp_step`;
CREATE TABLE `exp_step`  (
  `step_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验id',
  `step_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '步骤名称',
  `step_comments` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '步骤内容（富文本）',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`step_id`) USING BTREE,
  INDEX `idx_exp_step_exp`(`exp_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_step_exp` FOREIGN KEY (`exp_id`) REFERENCES `exp_msg` (`exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试验步骤' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exp_video
-- ----------------------------
DROP TABLE IF EXISTS `exp_video`;
CREATE TABLE `exp_video`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `video_url` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '视频URL',
  `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验id',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  `file_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '素材id',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_exp_video_exp`(`exp_id` ASC) USING BTREE,
  CONSTRAINT `fk_exp_video_exp` FOREIGN KEY (`exp_id`) REFERENCES `exp_msg` (`exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试验视频' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for material_msg
-- ----------------------------
DROP TABLE IF EXISTS `material_msg`;
CREATE TABLE `material_msg`  (
  `material_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `material_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '材料名称',
  `material_prop_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '材料属性id',
  `material_type_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '材料分类id',
  `material_num` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '建议用量（含单位，如\"500 毫升\"）',
  `main_pic_url` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '主图片URL',
  `exp_purpose` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '试验用途',
  `additional_comments` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '补充说明',
  `comments` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '备注/安全说明',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `create_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '创建人id',
  `create_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `update_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '最后更新人id',
  `update_time` datetime NULL DEFAULT NULL COMMENT '最后更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除：0 正常，1 已删除',
  PRIMARY KEY (`material_id`) USING BTREE,
  INDEX `idx_material_msg_prop`(`material_prop_id` ASC) USING BTREE,
  INDEX `idx_material_msg_type`(`material_type_id` ASC) USING BTREE,
  CONSTRAINT `fk_material_msg_prop` FOREIGN KEY (`material_prop_id`) REFERENCES `data_material_prop` (`prop_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_material_msg_type` FOREIGN KEY (`material_type_id`) REFERENCES `data_material_type` (`type_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试验材料主库' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for material_pic
-- ----------------------------
DROP TABLE IF EXISTS `material_pic`;
CREATE TABLE `material_pic`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `material_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '材料id',
  `material_url` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '图片URL',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  `create_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_material_pic_material`(`material_id` ASC) USING BTREE,
  CONSTRAINT `fk_material_pic_material` FOREIGN KEY (`material_id`) REFERENCES `material_msg` (`material_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '材料图片' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for material_security
-- ----------------------------
DROP TABLE IF EXISTS `material_security`;
CREATE TABLE `material_security`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `material_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '材料id',
  `security_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '安全性id',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  `create_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_material_security_material`(`material_id` ASC) USING BTREE,
  INDEX `idx_material_security_security`(`security_id` ASC) USING BTREE,
  CONSTRAINT `fk_material_security_material` FOREIGN KEY (`material_id`) REFERENCES `material_msg` (`material_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_material_security_security` FOREIGN KEY (`security_id`) REFERENCES `data_material_security` (`security_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '材料安全性关联' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for migration_error_log
-- ----------------------------
DROP TABLE IF EXISTS `migration_error_log`;
CREATE TABLE `migration_error_log`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `batch_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `src_table` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `src_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `error_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `error_msg` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for migration_id_map
-- ----------------------------
DROP TABLE IF EXISTS `migration_id_map`;
CREATE TABLE `migration_id_map`  (
  `src_table` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `src_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `new_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`src_table`, `src_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for parent_report
-- ----------------------------
DROP TABLE IF EXISTS `parent_report`;
CREATE TABLE `parent_report`  (
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
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '亲子实验报告' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for parent_session
-- ----------------------------
DROP TABLE IF EXISTS `parent_session`;
CREATE TABLE `parent_session`  (
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
  CONSTRAINT `fk_parent_session_exp` FOREIGN KEY (`exp_id`) REFERENCES `exp_msg` (`exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_parent_session_parent` FOREIGN KEY (`parent_user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_parent_session_student` FOREIGN KEY (`student_user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '家长辅导会话' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for scale_log
-- ----------------------------
DROP TABLE IF EXISTS `scale_log`;
CREATE TABLE `scale_log`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户id',
  `scale_source` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '积分来源',
  `scale_num` int NOT NULL DEFAULT 0 COMMENT '积分变化量（正数增加，负数减少）',
  `create_time` datetime NULL DEFAULT NULL COMMENT '记录时间',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_scale_log_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_scale_log_time`(`create_time` ASC) USING BTREE,
  CONSTRAINT `fk_scale_log_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '积分流水' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for scale_title
-- ----------------------------
DROP TABLE IF EXISTS `scale_title`;
CREATE TABLE `scale_title`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `role_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '角色id',
  `title_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '称号名称',
  `icon` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '称号图标URL',
  `score_num` int NOT NULL DEFAULT 0 COMMENT '达标积分下限',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_scale_title_role`(`role_id` ASC) USING BTREE,
  CONSTRAINT `fk_scale_title_role` FOREIGN KEY (`role_id`) REFERENCES `data_role` (`role_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '积分称号规则' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for social_collection
-- ----------------------------
DROP TABLE IF EXISTS `social_collection`;
CREATE TABLE `social_collection`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验id',
  `user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户id',
  `create_time` datetime NULL DEFAULT NULL COMMENT '收藏时间',
  PRIMARY KEY (`seq_id`) USING BTREE,
  UNIQUE INDEX `uk_social_collection_exp_user`(`exp_id` ASC, `user_id` ASC) USING BTREE,
  INDEX `idx_social_collection_exp`(`exp_id` ASC) USING BTREE,
  INDEX `idx_social_collection_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_social_collection_exp` FOREIGN KEY (`exp_id`) REFERENCES `exp_msg` (`exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_social_collection_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '收藏记录' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for social_evaluate
-- ----------------------------
DROP TABLE IF EXISTS `social_evaluate`;
CREATE TABLE `social_evaluate`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验id',
  `user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户id',
  `evaluate_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '评价内容',
  `evaluate_url` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '评价附件URL',
  `create_time` datetime NULL DEFAULT NULL COMMENT '评价时间',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_social_evaluate_exp`(`exp_id` ASC) USING BTREE,
  INDEX `idx_social_evaluate_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_social_evaluate_exp` FOREIGN KEY (`exp_id`) REFERENCES `exp_msg` (`exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_social_evaluate_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '评价记录' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for social_like
-- ----------------------------
DROP TABLE IF EXISTS `social_like`;
CREATE TABLE `social_like`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验id',
  `user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户id',
  `create_time` datetime NULL DEFAULT NULL COMMENT '点赞时间',
  PRIMARY KEY (`seq_id`) USING BTREE,
  UNIQUE INDEX `uk_social_like_exp_user`(`exp_id` ASC, `user_id` ASC) USING BTREE,
  INDEX `idx_social_like_exp`(`exp_id` ASC) USING BTREE,
  INDEX `idx_social_like_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_social_like_exp` FOREIGN KEY (`exp_id`) REFERENCES `exp_msg` (`exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_social_like_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '点赞记录' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for social_notlike
-- ----------------------------
DROP TABLE IF EXISTS `social_notlike`;
CREATE TABLE `social_notlike`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `exp_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试验id',
  `user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户id',
  `create_time` datetime NULL DEFAULT NULL COMMENT '倒赞时间',
  PRIMARY KEY (`seq_id`) USING BTREE,
  UNIQUE INDEX `uk_social_notlike_exp_user`(`exp_id` ASC, `user_id` ASC) USING BTREE,
  INDEX `idx_social_notlike_exp`(`exp_id` ASC) USING BTREE,
  INDEX `idx_social_notlike_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_social_notlike_exp` FOREIGN KEY (`exp_id`) REFERENCES `exp_msg` (`exp_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_social_notlike_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '倒赞记录' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for subject_group
-- ----------------------------
DROP TABLE IF EXISTS `subject_group`;
CREATE TABLE `subject_group`  (
  `group_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '组唯一ID',
  `group_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '组名称',
  `comments` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说明/备注',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'NORMAL' COMMENT '状态: NORMAL-正常, DISABLED-禁用',
  `review_status` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 't' COMMENT '审核状态：t 待审核，y 通过，n 驳回',
  `review_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '审核人ID',
  `review_time` datetime NULL DEFAULT NULL COMMENT '审核时间',
  `review_comments` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '审批意见/驳回理由',
  `reject_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '驳回全文（与 review_comments 共存）',
  `subject_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '所属学科ID',
  `owner_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '负责人用户ID (所有者)',
  `create_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '原始创建人ID',
  `create_time` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`group_id`) USING BTREE,
  INDEX `idx_owner`(`owner_id` ASC) USING BTREE,
  INDEX `idx_subject`(`subject_id` ASC) USING BTREE,
  INDEX `idx_review_status`(`review_status` ASC) USING BTREE,
  INDEX `idx_subject_group_review_status`(`review_status` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '课题组/教研组主表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for subject_group_member
-- ----------------------------
DROP TABLE IF EXISTS `subject_group_member`;
CREATE TABLE `subject_group_member`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '序列ID',
  `group_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '关联组ID',
  `user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户ID',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'JOINED' COMMENT '成员状态: JOINED-已加入, QUITTED-已退出',
  `create_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '添加人ID',
  `create_time` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '加入时间',
  PRIMARY KEY (`seq_id`) USING BTREE,
  UNIQUE INDEX `uk_group_user`(`group_id` ASC, `user_id` ASC) USING BTREE,
  INDEX `idx_group`(`group_id` ASC) USING BTREE,
  INDEX `idx_user`(`user_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '组成员关系表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for sys_auth_refresh_token
-- ----------------------------
DROP TABLE IF EXISTS `sys_auth_refresh_token`;
CREATE TABLE `sys_auth_refresh_token`  (
  `sid` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_hash` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_code` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `org_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`sid`) USING BTREE,
  INDEX `idx_expires_at`(`expires_at` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for sys_feedback
-- ----------------------------
DROP TABLE IF EXISTS `sys_feedback`;
CREATE TABLE `sys_feedback`  (
  `feedback_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '主键',
  `type` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'BUG / FEATURE / OPTIMIZE / INQUIRY',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '简述标题',
  `content` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '富文本 HTML 内容',
  `status` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TODO' COMMENT 'TODO / DOING / DONE / REJECT',
  `reporter` json NULL COMMENT '提报人信息：{userId, name, role, orgId, orgName}',
  `env` json NULL COMMENT '环境信息：{url, ua, browser, resolution}',
  `issue_fingerprint` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `reply` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '修复说明 HTML',
  `replier_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '运维回复人 user_id',
  `reply_time` datetime NULL DEFAULT NULL COMMENT '回复时间',
  `create_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `update_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`feedback_id`) USING BTREE,
  INDEX `idx_feedback_type`(`type` ASC) USING BTREE,
  INDEX `idx_feedback_status`(`status` ASC) USING BTREE,
  INDEX `idx_feedback_create_time`(`create_time` ASC) USING BTREE,
  INDEX `idx_issue_fingerprint`(`issue_fingerprint` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户反馈表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for sys_log
-- ----------------------------
DROP TABLE IF EXISTS `sys_log`;
CREATE TABLE `sys_log`  (
  `log_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '操作人id',
  `log_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '日志类型',
  `log_time` datetime NULL DEFAULT NULL COMMENT '记录时间',
  `log_data_type` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '操作数据类型',
  `log_data_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '操作数据id',
  `log_data_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '操作数据内容（JSON 格式的详细上下文）',
  PRIMARY KEY (`log_id`) USING BTREE,
  INDEX `idx_sys_log_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_sys_log_time`(`log_time` ASC) USING BTREE,
  INDEX `idx_sys_log_type_time`(`log_type` ASC, `log_time` ASC) USING BTREE,
  CONSTRAINT `fk_sys_log_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '系统日志' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_menu
-- ----------------------------
DROP TABLE IF EXISTS `sys_menu`;
CREATE TABLE `sys_menu`  (
  `menu_id` int NOT NULL AUTO_INCREMENT COMMENT '菜单主键，自增ID',
  `parent_id` int NULL DEFAULT NULL COMMENT '父级菜单ID',
  `menu_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '菜单/页面名称',
  `menu_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '稳定业务编码，用于权限锚点',
  `menu_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'menu/page/button',
  `path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '路由路径',
  `component` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '前端组件或页面标识',
  `sort_order` int NOT NULL DEFAULT 0 COMMENT '排序',
  `status` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'y' COMMENT '状态：y启用/n停用',
  `comments` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '备注',
  `create_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '创建人',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '更新人',
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`menu_id`) USING BTREE,
  UNIQUE INDEX `uq_sys_menu_code`(`menu_code` ASC) USING BTREE,
  INDEX `idx_sys_menu_parent`(`parent_id` ASC) USING BTREE,
  INDEX `idx_sys_menu_path`(`path` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 49 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '系统菜单目录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for sys_msg
-- ----------------------------
DROP TABLE IF EXISTS `sys_msg`;
CREATE TABLE `sys_msg`  (
  `msg_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `receiver_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '接收人id',
  `sender_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '发送人id',
  `msg_type_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '消息类型id',
  `msg_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '消息内容',
  `read_tag` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '0' COMMENT '阅读状态：0 未读，1 已读',
  `send_time` datetime NULL DEFAULT NULL COMMENT '发送时间',
  `read_time` datetime NULL DEFAULT NULL COMMENT '阅读时间',
  PRIMARY KEY (`msg_id`) USING BTREE,
  INDEX `idx_sys_msg_receiver`(`receiver_user_id` ASC) USING BTREE,
  INDEX `idx_sys_msg_sender`(`sender_user_id` ASC) USING BTREE,
  CONSTRAINT `fk_sys_msg_receiver` FOREIGN KEY (`receiver_user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_sys_msg_sender` FOREIGN KEY (`sender_user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '系统消息' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_org
-- ----------------------------
DROP TABLE IF EXISTS `sys_org`;
CREATE TABLE `sys_org`  (
  `org_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `org_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '组织名称',
  `org_type_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '组织类型id',
  `grade_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '年级id（班级节点使用）',
  `parent_org_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '父组织id',
  `org_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '物化路径，如 /root/school1/class1',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `sort_order` int NULL DEFAULT NULL COMMENT '排序',
  `create_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '创建人id',
  `create_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `update_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '最后更新人id',
  `update_time` datetime NULL DEFAULT NULL COMMENT '最后更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除：0 正常，1 已删除',
  PRIMARY KEY (`org_id`) USING BTREE,
  INDEX `idx_sys_org_parent`(`parent_org_id` ASC) USING BTREE,
  INDEX `idx_sys_org_type`(`org_type_id` ASC) USING BTREE,
  INDEX `fk_sys_org_grade`(`grade_id` ASC) USING BTREE,
  CONSTRAINT `fk_sys_org_grade` FOREIGN KEY (`grade_id`) REFERENCES `data_school_grade` (`grade_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_sys_org_parent` FOREIGN KEY (`parent_org_id`) REFERENCES `sys_org` (`org_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_sys_org_type` FOREIGN KEY (`org_type_id`) REFERENCES `data_org_type` (`type_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '组织（学校/班级/课题组等）' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_parent_student_rel
-- ----------------------------
DROP TABLE IF EXISTS `sys_parent_student_rel`;
CREATE TABLE `sys_parent_student_rel`  (
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
  UNIQUE INDEX `uk_parent_student`(`parent_user_id` ASC, `student_user_id` ASC) USING BTREE,
  INDEX `idx_parent_id`(`parent_user_id` ASC) USING BTREE,
  INDEX `idx_student_id`(`student_user_id` ASC) USING BTREE,
  INDEX `idx_audit_list`(`school_org_id` ASC, `audit_status` ASC) USING BTREE,
  CONSTRAINT `fk_parent_student_rel_parent` FOREIGN KEY (`parent_user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_parent_student_rel_school` FOREIGN KEY (`school_org_id`) REFERENCES `sys_org` (`org_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_parent_student_rel_student` FOREIGN KEY (`student_user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '家长-学生绑定审核表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_role_menu_perm
-- ----------------------------
DROP TABLE IF EXISTS `sys_role_menu_perm`;
CREATE TABLE `sys_role_menu_perm`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键',
  `role_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '角色ID，关联 data_role.role_id',
  `menu_id` int NOT NULL COMMENT '菜单ID，关联 sys_menu.menu_id',
  `can_read` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否可读/可见/可进入',
  `can_write` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否可写/可编辑/可保存',
  `status` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'y' COMMENT '状态：y启用/n停用',
  `create_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '创建人',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '更新人',
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`seq_id`) USING BTREE,
  UNIQUE INDEX `uq_sys_role_menu_perm`(`role_id` ASC, `menu_id` ASC) USING BTREE,
  INDEX `idx_sys_role_menu_perm_role`(`role_id` ASC) USING BTREE,
  INDEX `idx_sys_role_menu_perm_menu`(`menu_id` ASC) USING BTREE,
  CONSTRAINT `fk_sys_role_menu_perm_menu` FOREIGN KEY (`menu_id`) REFERENCES `sys_menu` (`menu_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_sys_role_menu_perm_role` FOREIGN KEY (`role_id`) REFERENCES `data_role` (`role_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '角色菜单权限表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for sys_user
-- ----------------------------
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user`  (
  `user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `user_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '姓名',
  `user_org_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '所属组织id',
  `user_role_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '主角色id',
  `user_logo` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '头像URL',
  `user_nick_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '昵称',
  `login_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '登录名',
  `login_pwd` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '登录密码（哈希存储）',
  `user_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '手机号',
  `user_email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '邮箱',
  `expire_date` datetime NULL DEFAULT NULL COMMENT '账号有效期',
  `comments` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '备注',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '状态：y 启用，n 停用',
  `last_login_time` datetime NULL DEFAULT NULL COMMENT '最后登录时间',
  `pref_title_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '个人职称id',
  `per_resume` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '个人简介',
  `per_score` int NULL DEFAULT 0 COMMENT '个人积分',
  `create_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '创建人id',
  `create_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `update_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '最后更新人id',
  `update_time` datetime NULL DEFAULT NULL COMMENT '最后更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除：0 正常，1 已删除',
  PRIMARY KEY (`user_id`) USING BTREE,
  UNIQUE INDEX `uk_sys_user_login`(`login_name` ASC) USING BTREE,
  INDEX `idx_sys_user_org`(`user_org_id` ASC) USING BTREE,
  INDEX `idx_sys_user_role`(`user_role_id` ASC) USING BTREE,
  INDEX `fk_sys_user_title`(`pref_title_id` ASC) USING BTREE,
  CONSTRAINT `fk_sys_user_org` FOREIGN KEY (`user_org_id`) REFERENCES `sys_org` (`org_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_sys_user_role` FOREIGN KEY (`user_role_id`) REFERENCES `data_role` (`role_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_sys_user_title` FOREIGN KEY (`pref_title_id`) REFERENCES `data_pref_title` (`title_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_user_role
-- ----------------------------
DROP TABLE IF EXISTS `sys_user_role`;
CREATE TABLE `sys_user_role`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户id',
  `role_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '角色id',
  `org_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '所属组织id',
  `create_time` datetime NULL DEFAULT NULL COMMENT '关联时间',
  PRIMARY KEY (`seq_id`) USING BTREE,
  INDEX `idx_sys_user_role_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_sys_user_role_role`(`role_id` ASC) USING BTREE,
  INDEX `idx_sys_user_role_org`(`org_id` ASC) USING BTREE,
  CONSTRAINT `fk_sys_user_role_org` FOREIGN KEY (`org_id`) REFERENCES `sys_org` (`org_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_sys_user_role_role` FOREIGN KEY (`role_id`) REFERENCES `data_role` (`role_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_sys_user_role_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户角色关联' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for teacher_class
-- ----------------------------
DROP TABLE IF EXISTS `teacher_class`;
CREATE TABLE `teacher_class`  (
  `seq_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `teacher_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '教师人员id（sys_user.user_id）',
  `class_org_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '班级组织id（sys_org.org_id，org_type_id=Org_School_Class）',
  `subject_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '学科id（data_school_subject.subject_id）',
  `status` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'y' COMMENT '状态：y启用 n停用',
  `create_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime NULL DEFAULT NULL COMMENT '更新时间',
  `create_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '创建人',
  `update_user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '更新人',
  PRIMARY KEY (`seq_id`) USING BTREE,
  UNIQUE INDEX `uk_teacher_class_subject`(`teacher_id` ASC, `class_org_id` ASC, `subject_id` ASC) USING BTREE,
  INDEX `idx_tc_teacher`(`teacher_id` ASC) USING BTREE,
  INDEX `idx_tc_class`(`class_org_id` ASC) USING BTREE,
  INDEX `idx_tc_subject`(`subject_id` ASC) USING BTREE,
  CONSTRAINT `fk_tc_class` FOREIGN KEY (`class_org_id`) REFERENCES `sys_org` (`org_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_tc_subject` FOREIGN KEY (`subject_id`) REFERENCES `data_school_subject` (`subject_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_tc_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `sys_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '教师授课班级关系' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- View structure for v_active_parent_children
-- ----------------------------
DROP VIEW IF EXISTS `v_active_parent_children`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_active_parent_children` AS select `r`.`seq_id` AS `seq_id`,`r`.`parent_user_id` AS `parent_user_id`,`r`.`student_user_id` AS `student_user_id`,`r`.`school_org_id` AS `school_org_id`,`r`.`create_time` AS `create_time`,`r`.`audit_status` AS `audit_status`,`r`.`audit_user_id` AS `audit_user_id`,`r`.`audit_comments` AS `audit_comments`,`r`.`audit_time` AS `audit_time` from `sys_parent_student_rel` `r` where (`r`.`audit_status` = 'Y');

-- ----------------------------
-- View structure for v_active_student_enrollments
-- ----------------------------
DROP VIEW IF EXISTS `v_active_student_enrollments`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_active_student_enrollments` AS select `iam_student_enrollments`.`id` AS `id`,`iam_student_enrollments`.`tenant_id` AS `tenant_id`,`iam_student_enrollments`.`user_id` AS `user_id`,`iam_student_enrollments`.`class_org_id` AS `class_org_id`,`iam_student_enrollments`.`academic_year` AS `academic_year`,`iam_student_enrollments`.`semester` AS `semester`,`iam_student_enrollments`.`enroll_status` AS `enroll_status`,`iam_student_enrollments`.`start_at` AS `start_at`,`iam_student_enrollments`.`end_at` AS `end_at`,`iam_student_enrollments`.`from_enrollment_id` AS `from_enrollment_id`,`iam_student_enrollments`.`created_at` AS `created_at`,`iam_student_enrollments`.`updated_at` AS `updated_at` from `iam_student_enrollments` where ((`iam_student_enrollments`.`enroll_status` = 'enrolled') and ((`iam_student_enrollments`.`start_at` is null) or (`iam_student_enrollments`.`start_at` <= now())) and ((`iam_student_enrollments`.`end_at` is null) or (`iam_student_enrollments`.`end_at` >= now())));

-- ----------------------------
-- View structure for v_active_user_org_posts
-- ----------------------------
DROP VIEW IF EXISTS `v_active_user_org_posts`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_active_user_org_posts` AS select `iam_user_org_posts`.`id` AS `id`,`iam_user_org_posts`.`tenant_id` AS `tenant_id`,`iam_user_org_posts`.`user_id` AS `user_id`,`iam_user_org_posts`.`org_id` AS `org_id`,`iam_user_org_posts`.`role_id` AS `role_id`,`iam_user_org_posts`.`is_primary` AS `is_primary`,`iam_user_org_posts`.`status` AS `status`,`iam_user_org_posts`.`start_at` AS `start_at`,`iam_user_org_posts`.`end_at` AS `end_at`,`iam_user_org_posts`.`created_at` AS `created_at`,`iam_user_org_posts`.`updated_at` AS `updated_at` from `iam_user_org_posts` where ((`iam_user_org_posts`.`status` = 1) and ((`iam_user_org_posts`.`start_at` is null) or (`iam_user_org_posts`.`start_at` <= now())) and ((`iam_user_org_posts`.`end_at` is null) or (`iam_user_org_posts`.`end_at` >= now())));

-- ----------------------------
-- View structure for v_active_user_org_subject_posts
-- ----------------------------
DROP VIEW IF EXISTS `v_active_user_org_subject_posts`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_active_user_org_subject_posts` AS select `iam_user_org_subject_posts`.`id` AS `id`,`iam_user_org_subject_posts`.`tenant_id` AS `tenant_id`,`iam_user_org_subject_posts`.`user_id` AS `user_id`,`iam_user_org_subject_posts`.`org_id` AS `org_id`,`iam_user_org_subject_posts`.`subject_code` AS `subject_code`,`iam_user_org_subject_posts`.`role_id` AS `role_id`,`iam_user_org_subject_posts`.`is_primary` AS `is_primary`,`iam_user_org_subject_posts`.`status` AS `status`,`iam_user_org_subject_posts`.`start_at` AS `start_at`,`iam_user_org_subject_posts`.`end_at` AS `end_at`,`iam_user_org_subject_posts`.`created_at` AS `created_at`,`iam_user_org_subject_posts`.`updated_at` AS `updated_at` from `iam_user_org_subject_posts` where ((`iam_user_org_subject_posts`.`status` = 1) and ((`iam_user_org_subject_posts`.`start_at` is null) or (`iam_user_org_subject_posts`.`start_at` <= now())) and ((`iam_user_org_subject_posts`.`end_at` is null) or (`iam_user_org_subject_posts`.`end_at` >= now())));

-- ----------------------------
-- View structure for v_user_school_stage
-- ----------------------------
DROP VIEW IF EXISTS `v_user_school_stage`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_user_school_stage` AS select `u`.`user_id` AS `user_id`,`u`.`user_name` AS `user_name`,`u`.`login_name` AS `login_name`,`u`.`user_role_id` AS `user_role_id`,`u`.`user_org_id` AS `user_org_id`,`o`.`org_id` AS `class_org_id`,`o`.`org_name` AS `class_org_name`,`o`.`grade_id` AS `grade_id`,`g`.`grade_name` AS `grade_name`,`g`.`school_level_id` AS `school_level_id`,`l`.`level_name` AS `school_level_name` from (((`sys_user` `u` left join `sys_org` `o` on(((`o`.`org_id` = `u`.`user_org_id`) and (`o`.`is_deleted` = 0)))) left join `data_school_grade` `g` on((`g`.`grade_id` = `o`.`grade_id`))) left join `data_school_level` `l` on((`l`.`level_id` = `g`.`school_level_id`))) where (`u`.`is_deleted` = 0);

SET FOREIGN_KEY_CHECKS = 1;
