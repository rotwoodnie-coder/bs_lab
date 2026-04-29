-- 0043 材料主库：material_num int→varchar(60)，comments varchar(200)→text
-- 背景：材料用量需存储含单位的字符串（如"500 毫升"），备注/安全说明需支持较长文本

ALTER TABLE material_msg
  MODIFY COLUMN `material_num` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '建议用量（含单位，如"500 毫升"）' AFTER `material_type_id`;

ALTER TABLE material_msg
  MODIFY COLUMN `comments` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '备注/安全说明' AFTER `additional_comments`;
