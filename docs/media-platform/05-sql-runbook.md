# 媒体资源中台 SQL 执行手册（Runbook）

> 适用对象：DBA、后端开发、运维  
> 目标：按统一步骤完成数据库初始化、验证、回滚和故障处理。

---

## 1. 适用范围与前置条件

## 1.1 适用脚本

- 主脚本：`database/migrations/0004_media_platform_init.sql`
- 增量脚本：`database/migrations/0005_media_review_and_versioning.sql`
- 增量脚本：`database/migrations/0006_media_outbox_events_init.sql`

## 1.2 前置条件检查

- [ ] 数据库版本为 MySQL 8.x（支持 CHECK 约束与 JSON）。
- [ ] 当前账号具备建表、建索引、查看元数据权限。
- [ ] 已确认目标库环境（测试库/预发库/生产库）与备份策略。
- [ ] 已确认窗口期，避免与高峰流量重叠。
- [ ] 已通知后端负责人执行联调验证。

---

## 2. 执行顺序（标准流程）

建议按“测试库 -> 预发库 -> 生产库”三阶段推进，禁止跳级。

1. 备份目标库（结构 + 关键业务表数据）。
2. 在测试库按顺序执行 `0004 -> 0005 -> 0006`（全新库执行最新 0004 全量后可按实际跳过重复增量）。
3. 运行“结构验证 SQL”确认表、索引、约束完整。
4. 运行“冒烟数据验证 SQL”确认主流程可用。
5. 通过后在预发库重复步骤 1~4。
6. 生产库执行时启用发布值守与回滚预案。

---

## 3. 执行命令示例

> 根据本地环境调整连接参数。

```bash
mysql -h <host> -P <port> -u <user> -p<password> <database> < database/migrations/0004_media_platform_init.sql
```

如果使用 PowerShell：

```powershell
Get-Content .\database\migrations\0004_media_platform_init.sql | mysql -h <host> -P <port> -u <user> -p<password> <database>
```

---

## 4. 测试库验证 SQL（结构核验）

## 4.1 核验表是否创建成功

```sql
SHOW TABLES LIKE 'iam_principal_map';
SHOW TABLES LIKE 'sys_media_assets';
SHOW TABLES LIKE 'edu_media_registry';
SHOW TABLES LIKE 'sys_media_references';
SHOW TABLES LIKE 'sys_media_scopes';
SHOW TABLES LIKE 'sys_media_derivatives';
SHOW TABLES LIKE 'sys_media_segments';
SHOW TABLES LIKE 'sys_media_jobs';
SHOW TABLES LIKE 'sys_media_outbox_events';
```

## 4.2 核验字段与类型

```sql
DESC iam_principal_map;
DESC sys_media_assets;
DESC edu_media_registry;
DESC sys_media_references;
DESC sys_media_scopes;
DESC sys_media_derivatives;
DESC sys_media_segments;
DESC sys_media_jobs;
DESC sys_media_outbox_events;
```

## 4.3 核验索引

```sql
SHOW INDEX FROM iam_principal_map;
SHOW INDEX FROM sys_media_assets;
SHOW INDEX FROM sys_media_references;
SHOW INDEX FROM sys_media_jobs;
SHOW INDEX FROM sys_media_outbox_events;
```

## 4.4 核验外键

```sql
SELECT
  TABLE_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME IS NOT NULL
  AND TABLE_NAME IN (
    'edu_media_registry',
    'sys_media_scopes',
    'sys_media_derivatives',
    'sys_media_segments'
  );
```

---

## 5. 测试库验证 SQL（冒烟联调）

> 目的：确认“资产 -> 登记 -> 引用 -> 权限 -> 片段 -> 任务”链路可落库。

## 5.1 插入最小测试数据

```sql
-- 统一主体映射
INSERT INTO iam_principal_map
  (tenant_id, app_id, principal_key, principal_type, user_id, status, source)
VALUES
  ('t_demo', 'app_media', 'SYSTEM:bootstrap', 'SYSTEM', NULL, 1, 'MIGRATION');

-- 资产
INSERT INTO sys_media_assets
  (tenant_id, app_id, content_hash_sha256, file_size, file_ext, media_type, mime_type, storage_engine, storage_key, ref_count, status, created_by)
VALUES
  ('t_demo', 'app_media', REPEAT('a',64), 1024, 'png', 'IMAGE', 'image/png', 'LOCAL', 'media/aa/bb/sample.png', 0, 'ACTIVE', 'SYSTEM:bootstrap');

-- 登记
INSERT INTO edu_media_registry
  (tenant_id, app_id, asset_id, title, owner_type, owner_key, classification_status, status, created_by)
SELECT
  't_demo', 'app_media', id, '实验步骤图片A', 'SYSTEM', 'SYSTEM:bootstrap', 'NORMAL', 'ACTIVE', 'SYSTEM:bootstrap'
FROM sys_media_assets
WHERE tenant_id='t_demo' AND app_id='app_media' AND content_hash_sha256=REPEAT('a',64);

-- 引用（挂到业务节点）
INSERT INTO sys_media_references
  (tenant_id, app_id, target_kind, target_id, ref_type, ref_id, slot_key, sort_order, ref_version, created_by)
SELECT
  't_demo', 'app_media', 'REGISTRY', id, 'EXPERIMENT_STEP', 10001, 'step_1_media_1', 1, 1, 'SYSTEM:bootstrap'
FROM edu_media_registry
WHERE tenant_id='t_demo' AND app_id='app_media' AND title='实验步骤图片A';

-- 权限
INSERT INTO sys_media_scopes
  (tenant_id, app_id, registry_id, subject_type, subject_key, permission_mask, created_by)
SELECT
  't_demo', 'app_media', id, 'SYSTEM', 'SYSTEM:bootstrap', 3, 'SYSTEM:bootstrap'
FROM edu_media_registry
WHERE tenant_id='t_demo' AND app_id='app_media' AND title='实验步骤图片A';

-- 任务
INSERT INTO sys_media_jobs
  (tenant_id, app_id, asset_id, job_type, process_status, retry_count)
SELECT
  't_demo', 'app_media', id, 'THUMBNAIL', 'WAITING', 0
FROM sys_media_assets
WHERE tenant_id='t_demo' AND app_id='app_media' AND content_hash_sha256=REPEAT('a',64);
```

## 5.2 验证查询

```sql
SELECT id, title, owner_type, owner_key
FROM edu_media_registry
WHERE tenant_id='t_demo' AND app_id='app_media';

SELECT ref_type, ref_id, slot_key
FROM sys_media_references
WHERE tenant_id='t_demo' AND app_id='app_media';

SELECT subject_type, subject_key, permission_mask
FROM sys_media_scopes
WHERE tenant_id='t_demo' AND app_id='app_media';

SELECT job_type, process_status, retry_count
FROM sys_media_jobs
WHERE tenant_id='t_demo' AND app_id='app_media';
```

## 5.3 清理测试数据（可选）

```sql
DELETE FROM sys_media_jobs WHERE tenant_id='t_demo' AND app_id='app_media';
DELETE FROM sys_media_scopes WHERE tenant_id='t_demo' AND app_id='app_media';
DELETE FROM sys_media_references WHERE tenant_id='t_demo' AND app_id='app_media';
DELETE FROM edu_media_registry WHERE tenant_id='t_demo' AND app_id='app_media';
DELETE FROM sys_media_assets WHERE tenant_id='t_demo' AND app_id='app_media';
DELETE FROM iam_principal_map WHERE tenant_id='t_demo' AND app_id='app_media';
```

---

## 6. 回滚策略

## 6.1 回滚原则

- 优先使用“版本回退脚本”回滚，不直接手工删库删表。
- 若生产执行失败，先止损（冻结写入）再回滚。
- 回滚前必须再次确认是否已有新业务数据写入。

## 6.2 结构回滚（仅当无业务数据）

```sql
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS sys_media_jobs;
DROP TABLE IF EXISTS sys_media_segments;
DROP TABLE IF EXISTS sys_media_derivatives;
DROP TABLE IF EXISTS sys_media_scopes;
DROP TABLE IF EXISTS sys_media_references;
DROP TABLE IF EXISTS edu_media_registry;
DROP TABLE IF EXISTS sys_media_assets;
DROP TABLE IF EXISTS iam_principal_map;
SET FOREIGN_KEY_CHECKS = 1;
```

## 6.3 已有数据情况下的回滚建议

- 不执行 DROP，改为应用层回切开关（禁用新功能入口）。
- 保留结构，停止写入，人工核对数据后再做补偿。
- 若需回退版本，优先执行“兼容模式”而非删除表结构。

---

## 7. 常见报错与处理

## 7.1 `ERROR 1064 (42000): SQL syntax ...`

原因：
- MySQL 版本不兼容。
- SQL 文件编码异常或命令行转义问题。

处理：
- 确认 MySQL 8.x。
- 用 UTF-8 无 BOM 保存脚本。
- 使用标准 `mysql < file.sql` 方式执行。

## 7.2 `ERROR 1215/3780: Cannot add foreign key constraint`

原因：
- 引用字段类型不一致。
- 表字符集/排序规则不一致。

处理：
- 校验主外键字段类型完全一致（含 unsigned）。
- 统一 `utf8mb4` 和 `utf8mb4_0900_ai_ci`。

## 7.3 `ERROR 3819: Check constraint ... is violated`

原因：
- 插入了非法状态值或非法区间（例如 `start_ms >= end_ms`）。

处理：
- 修正入参，遵循约束枚举和校验规则。
- 排查应用层枚举是否与数据库一致。

## 7.4 `ERROR 1062: Duplicate entry ... for key uk_asset_dedup`

原因：
- 同租户同应用重复上传同内容文件。

处理：
- 改为读取已有资产并创建登记/引用，不重复插入资产。

## 7.5 `ERROR 1364: Field doesn't have a default value`

原因：
- 必填字段未传值（如 `tenant_id`、`app_id`）。

处理：
- 在服务层统一注入租户和应用上下文。
- 增加接口参数校验。

---

## 8. 发布值守建议

- 发布前：完成结构验证 + 冒烟验证 + 回滚演练。
- 发布中：实时观察错误日志、慢 SQL、连接数、锁等待。
- 发布后：重点监控任务失败率与引用写入成功率。

推荐监控指标：

- `db_ddl_execute_success_total`
- `media_reference_write_error_total`
- `media_job_fail_total`
- `media_permission_check_deny_total`

---

## 9. 责任分工建议

- DBA：执行脚本、索引校验、回滚执行。
- 后端：联调验证、事务一致性校验、异常修复。
- 测试：按检查表验证功能闭环与异常流程。
- 运维：发布窗口保障与监控告警。
