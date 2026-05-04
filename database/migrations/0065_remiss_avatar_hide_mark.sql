-- ==========================================================
-- 0065: 补充标记存量头像文件（增量修复）
--
-- 背景：0061 迁移仅在执行时刻匹配了当时的 sys_user.user_logo，
-- 后续注册的新用户、新上传的头像未标记 is_hidden_from_gallery = 1，
-- 导致头像文件出现在视频广场/素材库中。
--
-- 修复逻辑与 0061 的 UPDATE 一致，通过 INNER JOIN data_file.file_url
-- 与 sys_user.user_logo 匹配来标记所有当前头像文件。
-- 此 UPDATE 幂等：已标记的行不受影响。
-- ==========================================================

UPDATE `data_file` df
  INNER JOIN `sys_user` u ON df.file_url = u.user_logo
SET df.is_hidden_from_gallery = 1,
    df.biz_type              = 'avatar'
WHERE u.user_logo IS NOT NULL
  AND u.user_logo != ''
  AND (df.is_hidden_from_gallery IS NULL OR df.is_hidden_from_gallery = 0);
