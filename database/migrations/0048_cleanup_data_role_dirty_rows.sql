-- ----------------------------
-- Migration 0048: 清理 data_role / data_pref_title 脏数据
--
-- data_role 清理：
--   早期 ensureRoleInDataRole 无条件 INSERT IGNORE，导致非宪法级条目混入。
--   只保留：
--     1. 7 个宪法身份（Role_Sys_Admin, Role_District_Admin, Role_School_Admin,
--        Role_Researcher, Role_Teacher, Role_Student, Role_Parent）
--     2. Subj_* 影子角色（FK 约束需要，由种子 + 触发器维护）
--
-- data_pref_title 清理：
--   职称回归纯技术等级，删除混入的岗位身份条目（如 T_Researcher）。
--   旧教师通用职称 T_Teacher 一并迁移到 T_Grade1（一级教师）。
-- ----------------------------

-- ========================
-- PART A: data_role 脏数据清理
-- ========================

-- 0. 处理 sys_user.user_role_id 指向脏角色的行（重置为 Role_Teacher）
UPDATE sys_user su
INNER JOIN data_role dr ON dr.role_id = su.user_role_id
SET su.user_role_id = 'Role_Teacher'
WHERE dr.role_id NOT LIKE 'Role\_%'
  AND dr.role_id NOT LIKE 'Subj\_%';

-- 1. 解除 sys_user_role 中指向脏角色的行
DELETE sur FROM sys_user_role sur
INNER JOIN data_role dr ON dr.role_id = sur.role_id
WHERE dr.role_id NOT LIKE 'Role\_%' AND dr.role_id NOT LIKE 'Subj\_%';

-- 2. 解除 scale_title 中指向脏角色的行
DELETE st FROM scale_title st
INNER JOIN data_role dr ON dr.role_id = st.role_id
WHERE dr.role_id NOT LIKE 'Role\_%' AND dr.role_id NOT LIKE 'Subj\_%';

-- 3. 删除脏角色行（此时所有 FK 依赖已解除）
DELETE FROM data_role
WHERE role_id NOT LIKE 'Role\_%'
  AND role_id NOT LIKE 'Subj\_%';

-- ========================
-- PART B: data_pref_title 脏数据清理
-- ========================

-- 4. 迁移旧职称引用
--    旧 T_Teacher（普通教师）→ T_Grade1（一级教师，中级职称）
--    旧 T_Researcher（教研员）→ 清空（岗位身份不属于职称范畴）
--    旧 T_Senior（高级教师）→ 保留（与新 T_Senior 同名，自然延续）
UPDATE sys_user SET pref_title_id = 'T_Grade1' WHERE pref_title_id = 'T_Teacher';
UPDATE sys_user SET pref_title_id = NULL WHERE pref_title_id = 'T_Researcher';

-- 5. 删除旧职称行（不需要的旧条目）
DELETE FROM data_pref_title WHERE title_id IN ('T_Teacher', 'T_Researcher');
