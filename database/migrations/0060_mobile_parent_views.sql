DROP VIEW IF EXISTS `v_active_parent_children`;
CREATE VIEW `v_active_parent_children` AS
SELECT
  r.seq_id,
  r.parent_user_id,
  r.student_user_id,
  r.school_org_id,
  r.create_time,
  r.audit_status,
  r.audit_user_id,
  r.audit_comments,
  r.audit_time
FROM sys_parent_student_rel r
WHERE r.audit_status = 'Y';

DROP VIEW IF EXISTS `v_user_school_stage`;
CREATE VIEW `v_user_school_stage` AS
SELECT
  u.user_id,
  u.user_name,
  u.login_name,
  u.user_role_id,
  u.user_org_id,
  o.org_id AS class_org_id,
  o.org_name AS class_org_name,
  o.grade_id,
  g.grade_name,
  g.school_level_id,
  l.level_name AS school_level_name
FROM sys_user u
LEFT JOIN sys_org o ON o.org_id = u.user_org_id AND o.is_deleted = 0
LEFT JOIN data_school_grade g ON g.grade_id = o.grade_id
LEFT JOIN data_school_level l ON l.level_id = g.school_level_id
WHERE u.is_deleted = 0;
