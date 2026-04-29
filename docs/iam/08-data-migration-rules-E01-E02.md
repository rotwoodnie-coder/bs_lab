# E 阶段：数据清洗规则与字段映射表
**版本**：V1.0  
**日期**：2026-04-20  
**用途**：E-01 清洗规则制定 + E-02 字段映射表，供 E-03 迁移脚本参考

---

## 一、总体策略

| 原则 | 说明 |
|------|------|
| 新旧并行 | 迁移期间旧库（`bs_lab_data`）与新库（`bs_exp_data`）同时存在，不删旧数据 |
| 全量快照 | 每次迁移前执行 `mysqldump` 备份旧库，保留 3 个版本 |
| 幂等设计 | 所有迁移语句使用 `INSERT IGNORE` 或 `ON DUPLICATE KEY UPDATE`，可重复运行 |
| 失败隔离 | 单条记录映射失败只记录到 `migration_error_log`，不中断整批 |
| 人工卡点 | E-03（试跑）完成后，由业务负责人核验样本数据后才允许执行 E-04（全量） |

---

## 二、清洗规则（E-01）

### 2.1 通用字段规则

| 字段类型 | 清洗规则 |
|----------|----------|
| `NULL` 字符串 | `TRIM(IFNULL(old_col, ''))` → 空串视为 NULL 写入 |
| 时间字段 | 统一转为 `DATETIME`；UNIX 时间戳用 `FROM_UNIXTIME(ts)` 转换 |
| 状态字段 | 旧 `status: 0/1` → 新 `status: 'y'/'n'`；旧 `is_active` 同理 |
| 枚举字段 | 按映射表逐一转换；未知值记录到错误日志，写入 NULL |
| 软删除 | 旧 `deleted_at IS NOT NULL` → 新 `is_deleted = 1` |
| UUID 主键 | 旧 INT 自增主键转为 UUID：`UUID()` 生成，写入 `_id_map` 过渡表 |
| 密码字段 | 旧 `password_hash` 迁移到新 `login_pwd`（bcrypt 散列保持不变） |

### 2.2 脏数据处理

| 场景 | 处理方式 |
|------|----------|
| 孤儿记录（外键不存在） | 写入 `migration_orphan_log`，不迁入主表 |
| 重复用户（同 email/phone） | 保留 `created_at` 最早的记录；重复项写入错误日志 |
| 空用户名 | 补填 `loginName` 为 `user_{旧id}` 占位 |
| 无归属组织的用户 | `user_org_id = NULL`（允许为空） |
| 课程/实验内容为空 | 保留记录但 `status = 'n'`（下架），不直接删除 |

### 2.3 枚举映射规则

**用户角色（旧 `role`→新 `user_role_id`）：**

| 旧值 | 新值 |
|------|------|
| `super_admin` | `role_super_admin` |
| `district_admin` | `role_district_admin` |
| `researcher` | `role_researcher` |
| `teacher` | `role_teacher` |
| `student` | `role_student` |
| `parent` | `role_parent` |
| 其他/空 | NULL（记录错误日志） |

**实验状态（旧→新）：**

| 旧值 | 新值 |
|------|------|
| `draft`/`0` | `n` |
| `published`/`1` | `y` |
| `review`/`pending` | `t` |

---

## 三、字段映射表（E-02）

### 3.1 系统用户：`iam_users` → `sys_user`

| 旧表字段 | 旧类型 | 新表字段 | 新类型 | 转换逻辑 |
|----------|--------|----------|--------|----------|
| `id` | INT | `user_id` | VARCHAR(64) | `UUID()` 生成，写入 `_id_map` |
| `username` | VARCHAR | `user_name` | VARCHAR(64) | 直接迁移，TRIM |
| `login_name` | VARCHAR | `login_name` | VARCHAR(64) | 直接迁移 |
| `password_hash` | VARCHAR | `login_pwd` | VARCHAR(255) | 直接迁移 |
| `email` | VARCHAR | `user_email` | VARCHAR(128) | TRIM，去空 |
| `phone` | VARCHAR | `user_phone` | VARCHAR(20) | TRIM，去空 |
| `role` | ENUM | `user_role_id` | VARCHAR(64) | 枚举映射（见 2.3） |
| `org_id` | INT/FK | `user_org_id` | VARCHAR(64) | 通过 `_id_map` 查 org UUID |
| `status` | TINYINT(0/1) | `status` | CHAR(1) | `0→'n'`, `1→'y'` |
| `created_at` | TIMESTAMP | `create_time` | DATETIME | `FROM_UNIXTIME` 或直接 |
| `updated_at` | TIMESTAMP | `update_time` | DATETIME | 同上 |
| `deleted_at` | TIMESTAMP | `is_deleted` | TINYINT | `IS NOT NULL → 1` |

### 3.2 组织机构：`iam_org_nodes` / `iam_tenants` → `sys_org`

| 旧表字段 | 新表字段 | 转换逻辑 |
|----------|----------|----------|
| `id` (INT) | `org_id` (UUID) | 生成 UUID，存入 `_id_map` |
| `name` | `org_name` | TRIM |
| `node_type` | `org_type_id` | 枚举映射（district/school/campus/grade/class） |
| `parent_id` (INT) | `parent_org_id` (UUID) | 通过 `_id_map` 转换 |
| `path` | `org_path` | 将整数路径替换为 UUID 路径 |
| `code` | `org_code` | 直接迁移 |
| `active` (BOOL) | `status` | `true→'y'`, `false→'n'` |

### 3.3 实验记录：旧 `experiments` → `exp_msg`

| 旧表字段 | 新表字段 | 转换逻辑 |
|----------|----------|----------|
| `id` (INT) | `exp_id` (UUID) | 生成 UUID |
| `title` | `exp_name` | TRIM |
| `subject_id` | `subject_id` | 通过字典映射 |
| `grade_level` | `school_level_id` | 通过字典映射 |
| `difficulty` | `difficulty_id` | 通过字典映射 |
| `teacher_id` | `create_user_id` | 通过 user `_id_map` 转换 |
| `status` | `status` | `draft→'n'`, `published→'y'`, `review→'t'` |
| `principle` | `exp_principle` | 直接迁移 |
| `caution` | `exp_caution` | 直接迁移 |
| `created_at` | `create_time` | 时间格式转换 |

### 3.4 素材文件：旧 `teacher_assets` → `material_msg` + `data_file`

| 旧表字段 | 目标表 + 新字段 | 转换逻辑 |
|----------|-----------------|----------|
| `id` (INT) | `material_msg.material_id` (UUID) | 生成 UUID |
| `title` | `material_msg.material_name` | TRIM |
| `category` / `materialTypeCode` | `material_msg.material_type_id` | 枚举映射 |
| `experimentId` | `material_msg.exp_id` | 通过 exp `_id_map` 转换 |
| `payload.mediaAssetId` | `data_file.file_id` | 关联 media_registry |
| `payload.originalFilename` | `data_file.original_name` | 直接迁移 |
| `payload.fileExt` | `data_file.file_ext` | TRIM，小写 |
| `payload.fileSize` | `data_file.file_size` | INT |
| `updatedAt` | `material_msg.update_time` | 时间转换 |

---

## 四、迁移顺序（依赖链）

```
1. sys_org          ← iam_org_nodes / iam_tenants
2. sys_user         ← iam_users （依赖 sys_org uuid 映射）
3. data_file        ← media_registry / teacher_assets.payload
4. material_msg     ← teacher_assets （依赖 data_file、sys_user）
5. exp_library      ← experiment_catalog（标准试验库）
6. exp_msg          ← experiments（依赖 exp_library、sys_user）
7. exp_homework     ← tasks（作业，依赖 exp_msg、sys_user）
8. exp_question     ← questions（题库，依赖 sys_user）
```

---

## 五、错误日志表结构（建议）

```sql
CREATE TABLE IF NOT EXISTS migration_error_log (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  batch_id    VARCHAR(64)   NOT NULL COMMENT '本次迁移批次号',
  src_table   VARCHAR(64)   NOT NULL COMMENT '来源表',
  src_id      VARCHAR(64)   NOT NULL COMMENT '来源记录原始 ID',
  error_type  VARCHAR(32)   NOT NULL COMMENT 'orphan / duplicate / invalid_enum / null_required',
  error_msg   TEXT,
  created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS migration_id_map (
  src_table   VARCHAR(64)   NOT NULL,
  src_id      VARCHAR(64)   NOT NULL COMMENT '旧 ID（INT 或旧 UUID）',
  new_id      VARCHAR(64)   NOT NULL COMMENT '新 UUID',
  created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (src_table, src_id)
);
```
