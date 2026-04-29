# 旧库 bs_lab_data 结构分析与迁移策略

> 分析日期：2026-04-21  
> 结论：**大多数业务表与 V2 schema 完全一致，可直接 INSERT IGNORE SELECT * 复制**

## 核心发现

### 发现 1：sys_org / sys_user 已是 V2 结构

旧库 `bs_lab_data` 中已存在 `sys_org` 和 `sys_user`，列名与 `bs_exp_data` V2 **完全相同**（varchar(32) UUID 主键）。  
`exp_*` 业务表的 `create_user_id`、`teacher_user_id` 等均指向这些旧 `sys_user.user_id` 值。

**迁移策略：直接复制旧 `sys_org`/`sys_user`，无需 UUID 重映射。**

> E-03 试跑脚本（iam_org_nodes → sys_org UUID 映射）用于验证新 IAM 用户的迁移逻辑，  
> E-04 全量迁移改为直接复制旧 sys_* 表，以保证 exp_* 外键引用完整性。

### 发现 2：exp_* / material_* / social_* 结构与 V2 完全一致

可全部直接 `INSERT IGNORE ... SELECT *`，唯一例外：

| 表名 | 差异 | 处理方式 |
|------|------|----------|
| `exp_question` | 新库多 `reject_reason TEXT NULL` 列 | 显式列出列名，跳过 reject_reason（默认 NULL） |

### 发现 3：data_* 字典表需先迁移

`sys_org.org_type_id` → `data_org_type(type_id)`  
`sys_user.user_role_id` → `data_role(role_id)`  
必须先复制字典表，再复制系统主数据，再复制业务表。

## 迁移分层

| 阶段 | 内容 | 方式 |
|------|------|------|
| P1 | data_* 字典/参考表（约 20 张） | 直接复制 |
| P2 | sys_org, sys_user, sys_user_role, sys_msg, sys_log | 直接复制 |
| P3 | exp_library 及子表 | 直接复制 |
| P4 | exp_msg 及全部子表 | 直接复制 |
| P5 | exp_homework / exp_arbitration | 直接复制 |
| P6 | exp_question（特殊处理） | 显式列出列名 |
| P7 | material_msg 及子表 | 直接复制 |
| P8 | social_* / scale_* | 直接复制 |

## 跳过不迁移的表

| 表前缀 | 原因 |
|--------|------|
| `edu_*` | 属于另一套 edu 系统（bigint ID 体系），与 V2 schema 不兼容 |
| `iam_*`（迁移完成后） | 已通过 E-03 映射到 sys_* |
| `v_active_*` | 视图，自动重建 |

## 与 E-03 试跑的关系

- E-03 仍有价值：验证了 iam_org_nodes/iam_users 映射逻辑，可用于未来补充迁移新 IAM 用户
- E-04 改用直接复制策略，是正式全量迁移的主体
