-- ============================================================
-- 0059: 修复校级管理员缺失 org_management 菜单权限
--
-- 背景：0054/0055/0056 迁移中，Role_School_Admin 的
--       sys_role_menu_perm 漏掉了 org_management（组织管理），
--       导致校管打开"组织架构"页面时 withPermission 守卫报 403。
--
-- 修复：INSERT IGNORE 补录 org_management 条目（可读+可写）。
-- ============================================================

-- 写入可读可写权限
INSERT IGNORE INTO `sys_role_menu_perm`
(`seq_id`, `role_id`, `menu_id`, `can_read`, `can_write`, `status`, `create_time`)
SELECT CONCAT('RM_', UUID()), 'Role_School_Admin', m.menu_id,
       1, 1, 'y', NOW()
FROM `sys_menu` m
WHERE m.menu_code = 'org_management'
  AND NOT EXISTS (
    SELECT 1 FROM `sys_role_menu_perm` rp
    WHERE rp.role_id = 'Role_School_Admin' AND rp.menu_id = m.menu_id
  );
