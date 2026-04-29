-- ============================================================
-- BS-Exp-Data 全量种子初始化
-- 目标库：bs_exp_data
-- 用途：重建空库后执行，导入字典 + 超级管理员
-- 执行：mysql -h 10.0.181.204 -P 13306 -u root -p bs_exp_data < database/seed/init-full-seed.sql
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. 组织类型 data_org_type
-- ============================================================
INSERT IGNORE INTO `data_org_type` (`type_id`, `type_name`, `comments`, `status`, `sort_order`) VALUES
('Org_Manage',          '管理组织', '教育管理/集团', 'y', 1),
('Org_School',          '学校',     '顶层学校',     'y', 2),
('Org_School_Campus',   '校区',     '学校下属校区/分校', 'y', 3),
('Org_School_Level',    '学段',     '校区下的学段，如小学、初中', 'y', 4),
('Org_School_Grade',    '年级',     '学段下的年级', 'y', 5),
('Org_School_Class',    '班级',     '年级下的班级', 'y', 6);

-- ============================================================
-- 2. 用户角色 data_role
-- ============================================================
INSERT IGNORE INTO `data_role` (`role_id`, `role_name`, `comments`, `status`, `sort_order`) VALUES
('Role_Sys_Admin',      '系统管理员',   '系统超级管理员', 'y', 1),
('Role_District_Admin', '区管理员',     '区级管理员',    'y', 2),
('Role_School_Admin',   '校管理员',     '学校管理员',    'y', 3),
('Role_Researcher',     '教研员',       '教研员',        'y', 4),
('Role_Teacher',        '教师',         '教师',          'y', 5),
('Role_Student',        '学生',         '学生',          'y', 6),
('Role_Parent',         '家长',         '家长',          'y', 7);

-- ============================================================
-- 3. 学段 data_school_level
-- ============================================================
INSERT IGNORE INTO `data_school_level` (`level_id`, `level_name`, `comments`, `status`, `sort_order`) VALUES
('Level_Primary',   '小学', '小学学段', 'y', 1),
('Level_Junior',    '初中', '初中学段', 'y', 2),
('Level_Senior',    '高中', '高中学段', 'y', 3);

-- ============================================================
-- 4. 学科 data_school_subject
-- ============================================================
INSERT IGNORE INTO `data_school_subject` (`subject_id`, `subject_name`, `comments`, `status`, `sort_order`) VALUES
('Subj_Physics',   '物理', '物理学科', 'y', 1),
('Subj_Chemistry', '化学', '化学学科', 'y', 2),
('Subj_Biology',   '生物', '生物学科', 'y', 3),
('Subj_Science',   '科学', '科学学科', 'y', 4);

-- ============================================================
-- 5. 年级 data_school_grade（关联学段）
-- ============================================================
INSERT IGNORE INTO `data_school_grade` (`grade_id`, `grade_name`, `comments`, `status`, `sort_order`, `school_level_id`) VALUES
('Grade_P1',  '一年级', '小学一年级', 'y', 1,   'Level_Primary'),
('Grade_P2',  '二年级', '小学二年级', 'y', 2,   'Level_Primary'),
('Grade_P3',  '三年级', '小学三年级', 'y', 3,   'Level_Primary'),
('Grade_P4',  '四年级', '小学四年级', 'y', 4,   'Level_Primary'),
('Grade_P5',  '五年级', '小学五年级', 'y', 5,   'Level_Primary'),
('Grade_P6',  '六年级', '小学六年级', 'y', 6,   'Level_Primary'),
('Grade_J1',  '初一',   '初中一年级（初一/七年级）', 'y', 7,  'Level_Junior'),
('Grade_J2',  '初二',   '初中二年级（初二/八年级）', 'y', 8,  'Level_Junior'),
('Grade_J3',  '初三',   '初中三年级（初三/九年级）', 'y', 9,  'Level_Junior'),
('Grade_S1',  '高一',   '高中一年级',        'y', 10, 'Level_Senior'),
('Grade_S2',  '高二',   '高中二年级',        'y', 11, 'Level_Senior'),
('Grade_S3',  '高三',   '高中三年级',        'y', 12, 'Level_Senior');

-- ============================================================
-- 6. 年级-学科关联 data_school_grade_subject
-- ============================================================
INSERT IGNORE INTO `data_school_grade_subject` (`seq_id`, `subject_id`, `grade_id`) VALUES
-- 小学：科学（3-6 年级开设科学课）
('sg_ps3_sc', 'Subj_Science', 'Grade_P3'),
('sg_ps4_sc', 'Subj_Science', 'Grade_P4'),
('sg_ps5_sc', 'Subj_Science', 'Grade_P5'),
('sg_ps6_sc', 'Subj_Science', 'Grade_P6'),
-- 初中：物理/化学/生物
('sg_j1_ph', 'Subj_Physics',  'Grade_J1'),
('sg_j1_ch', 'Subj_Chemistry','Grade_J1'),
('sg_j1_bi', 'Subj_Biology',  'Grade_J1'),
('sg_j2_ph', 'Subj_Physics',  'Grade_J2'),
('sg_j2_ch', 'Subj_Chemistry','Grade_J2'),
('sg_j2_bi', 'Subj_Biology',  'Grade_J2'),
('sg_j3_ph', 'Subj_Physics',  'Grade_J3'),
('sg_j3_ch', 'Subj_Chemistry','Grade_J3'),
('sg_j3_bi', 'Subj_Biology',  'Grade_J3'),
-- 高中：物理/化学/生物
('sg_s1_ph', 'Subj_Physics',  'Grade_S1'),
('sg_s1_ch', 'Subj_Chemistry','Grade_S1'),
('sg_s1_bi', 'Subj_Biology',  'Grade_S1'),
('sg_s2_ph', 'Subj_Physics',  'Grade_S2'),
('sg_s2_ch', 'Subj_Chemistry','Grade_S2'),
('sg_s2_bi', 'Subj_Biology',  'Grade_S2'),
('sg_s3_ph', 'Subj_Physics',  'Grade_S3'),
('sg_s3_ch', 'Subj_Chemistry','Grade_S3'),
('sg_s3_bi', 'Subj_Biology',  'Grade_S3');

-- ============================================================
-- 7. 实验难度 data_exp_difficulty
-- ============================================================
INSERT IGNORE INTO `data_exp_difficulty` (`difficulty_id`, `difficulty_name`, `comments`, `status`, `sort_order`) VALUES
('Diff_Easy',   '简单', '基础实验', 'y', 1),
('Diff_Medium', '中等', '中等难度', 'y', 2),
('Diff_Hard',   '困难', '较难实验', 'y', 3);

-- ============================================================
-- 8. 试验难度 data_difficulty_type
-- ============================================================
INSERT IGNORE INTO `data_difficulty_type` (`type_id`, `type_name`, `comments`, `status`, `sort_order`) VALUES
('DT_Easy',   '简单', '题库难度简单', 'y', 1),
('DT_Medium', '中等', '题库难度中等', 'y', 2),
('DT_Hard',   '困难', '题库难度困难', 'y', 3);

-- ============================================================
-- 9. 文件类型 data_file_type
-- ============================================================
INSERT IGNORE INTO `data_file_type` (`type_id`, `type_name`, `comments`, `status`, `sort_order`, `logo_class`) VALUES
('FT_Video',   '视频',     '视频文件', 'y', 1, 'video'),
('FT_Pdf',     '课件',     'PDF课件',  'y', 2, 'pdf'),
('FT_Image',   '图片',     '图片文件', 'y', 3, 'image'),
('FT_Package', '压缩包',   '压缩文件', 'y', 4, 'package');

-- ============================================================
-- 10. 题型 data_question_type
-- ============================================================
INSERT IGNORE INTO `data_question_type` (`type_id`, `type_name`, `comments`, `status`, `sort_order`) VALUES
('QT_Choice',    '选择题',   '单选题', 'y', 1),
('QT_Multi',     '多选题',   '多选题', 'y', 2),
('QT_Fill',      '填空题',   '填空题', 'y', 3),
('QT_Short',     '简答题',   '简答题', 'y', 4);

-- ============================================================
-- 11. 素材类型 data_material_type
-- ============================================================
INSERT IGNORE INTO `data_material_type` (`type_id`, `type_name`, `comments`, `status`, `sort_order`) VALUES
('MT_Exp',        '实验器材',     '实验器材类', 'y', 1),
('MT_Reagent',    '实验试剂',     '实验试剂类', 'y', 2),
('MT_Tool',       '实验工具',     '实验工具类', 'y', 3),
('MT_Other',      '其他',         '其他',       'y', 4);

-- ============================================================
-- 12. 消息分类 data_msg_type
-- ============================================================
INSERT IGNORE INTO `data_msg_type` (`type_id`, `type_name`, `comments`, `status`, `sort_order`) VALUES
('MT_Sys',     '系统消息', '系统通知', 'y', 1),
('MT_Exp',     '实验消息', '实验相关通知', 'y', 2),
('MT_Review',  '审核消息', '内容审核通知', 'y', 3);

-- ============================================================
-- 13. 评分等级 data_rating_scale
-- ============================================================
INSERT IGNORE INTO `data_rating_scale` (`scale_id`, `scale_name`, `comments`, `status`, `sort_order`) VALUES
('RS_A', 'A（优秀）', '优秀', 'y', 1),
('RS_B', 'B（良好）', '良好', 'y', 2),
('RS_C', 'C（合格）', '合格', 'y', 3),
('RS_D', 'D（不合格）','不合格', 'y', 4);

-- ============================================================
-- 14. 职称 data_pref_title
-- ============================================================
INSERT IGNORE INTO `data_pref_title` (`title_id`, `title_name`, `comments`, `status`, `sort_order`) VALUES
('T_Teacher',   '教师',     '普通教师', 'y', 1),
('T_Senior',    '高级教师', '高级教师', 'y', 2),
('T_Researcher','教研员',   '教研员',   'y', 3);

-- ============================================================
-- 15. 题目能力侧重点 data_question_capacity
-- ============================================================
INSERT IGNORE INTO `data_question_capacity` (`capacity_id`, `capacity_name`, `comments`, `status`, `sort_order`) VALUES
('QC_Memory',  '记忆',   '记忆能力', 'y', 1),
('QC_Apply',   '应用',   '应用能力', 'y', 2),
('QC_Analyze', '分析',   '分析能力', 'y', 3);

-- ============================================================
-- 16. 素材属性 data_material_prop
-- ============================================================
INSERT IGNORE INTO `data_material_prop` (`prop_id`, `prop_name`, `comments`, `status`, `sort_order`) VALUES
('MP_Glass',   '玻璃',   '玻璃材质', 'y', 1),
('MP_Metal',   '金属',   '金属材质', 'y', 2),
('MP_Plastic', '塑料',   '塑料材质', 'y', 3);

-- ============================================================
-- 17. 素材安全标识 data_material_security
-- ============================================================
INSERT IGNORE INTO `data_material_security` (`security_id`, `security_name`, `comments`, `status`, `sort_order`) VALUES
('MS_Safe',     '安全',   '安全', 'y', 1),
('MS_Caution',  '注意',   '需注意', 'y', 2),
('MS_Danger',   '危险',   '危险', 'y', 3);

-- ============================================================
-- 18. 素材单位 data_material_unit
-- ============================================================
INSERT IGNORE INTO `data_material_unit` (`unit_id`, `unit_name`, `comments`, `status`, `sort_order`) VALUES
('U_g',   '克',   '克', 'y', 1),
('U_ml',  '毫升', '毫升', 'y', 2),
('U_pcs', '个',   '个数', 'y', 3),
('U_bot', '瓶',   '瓶', 'y', 4);

-- ============================================================
-- 19. 根组织 sys_org（超级管理员所属）
-- ============================================================
INSERT IGNORE INTO `sys_org` (`org_id`, `org_name`, `org_type_id`, `parent_org_id`, `org_path`, `status`, `sort_order`, `create_time`, `is_deleted`) VALUES
('Org_Root', '根组织', 'Org_Manage', NULL, '/Org_Root', 'y', 1, NOW(), 0);

-- ============================================================
-- 20. 超级管理员用户（密码：admin123）
--     密码 bcrypt hash: $2b$10$1eMuHaPGw4KHkEa8sCt7OugqoR8OT6ULV2lc6SxzCJfIN4rICpHbq
-- ============================================================
INSERT IGNORE INTO `sys_user` (`user_id`, `user_name`, `user_org_id`, `user_role_id`, `login_name`, `login_pwd`, `status`, `is_deleted`, `create_time`) VALUES
('u_admin', '超级管理员', 'Org_Root', 'Role_Sys_Admin', 'admin', '$2b$10$1eMuHaPGw4KHkEa8sCt7OugqoR8OT6ULV2lc6SxzCJfIN4rICpHbq', 'y', 0, NOW());

-- ============================================================
-- 21. 超级管理员角色关联 sys_user_role
-- ============================================================
INSERT IGNORE INTO `sys_user_role` (`seq_id`, `user_id`, `role_id`, `org_id`, `create_time`) VALUES
('sur_admin_001', 'u_admin', 'Role_Sys_Admin', 'Org_Root', NOW());

SET FOREIGN_KEY_CHECKS = 1;
