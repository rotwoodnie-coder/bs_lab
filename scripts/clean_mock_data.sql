-- clean_mock_data.sql
-- Purpose: safely remove known mock / demo users from sys_user.
-- Notes:
-- 1) Run in a transaction.
-- 2) Review the SELECT results before executing the DELETE/UPDATE statements in production.
-- 3) If your environment uses logical delete, prefer UPDATE is_deleted = 1.

START TRANSACTION;

-- Preview matching records first.
SELECT user_id, user_name, login_name, comments
FROM sys_user
WHERE user_name IN ('梁文怡', '袁飞')
   OR login_name IN ('梁文怡', '袁飞')
   OR comments LIKE '%测试%'
   OR comments LIKE '%demo%'
ORDER BY user_name, login_name;

-- Physical delete for explicitly known mock users.
DELETE FROM sys_user
WHERE user_name IN ('梁文怡', '袁飞')
   OR login_name IN ('梁文怡', '袁飞');

-- Optional logical cleanup for demo-tagged accounts.
UPDATE sys_user
SET is_deleted = 1,
    update_time = NOW()
WHERE comments LIKE '%测试%'
   OR comments LIKE '%demo%';

COMMIT;
