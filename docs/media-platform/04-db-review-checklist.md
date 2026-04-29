# 媒体资源中台数据库开发自检表

> 用途：用于数据库评审、联调前自检、上线前核对。  
> 使用方式：逐项打勾，通过后进入下一阶段。

---

## 一、建模与命名规范

- [ ] 所有核心表命名符合领域语义（assets / registry / references / scopes / segments / derivatives / jobs）。
- [ ] 所有表均包含 `tenant_id`、`app_id`，并用于查询过滤。
- [ ] 字段命名使用统一风格（下划线命名），无歧义缩写。
- [ ] 关键状态字段均给出合法值约束（CHECK 或代码枚举）。
- [ ] 所有 JSON 字段都在文档中注明用途和边界。

## 二、主键、唯一键与外键

- [ ] 每张表都有单一主键 `id`（BIGINT UNSIGNED）。
- [ ] `sys_media_assets` 去重唯一键已建立：`(tenant_id, app_id, content_hash_sha256, file_size)`。
- [ ] `iam_principal_map` 唯一键已建立：`(tenant_id, app_id, principal_key)`。
- [ ] 外键关系完整且符合业务：registry -> assets、scopes -> registry、derivatives/segments -> assets。
- [ ] 外键删除策略符合预期（RESTRICT/CASCADE）并经过评审确认。

## 三、索引与查询性能

- [ ] 高频检索路径存在索引（按业务节点查引用、按目标反查引用）。
- [ ] 状态扫描路径存在索引（assets.status、jobs.process_status）。
- [ ] 权限求值路径存在索引（scopes.subject_type + subject_key）。
- [ ] 所有列表查询均可命中 `(tenant_id, app_id, ...)` 前缀索引。
- [ ] 无明显冗余索引与重复索引。

## 四、事务与一致性

- [ ] 创建引用时与 `assets.ref_count + 1` 在同一事务中完成。
- [ ] 删除引用时与 `assets.ref_count - 1` 在同一事务中完成。
- [ ] `ref_count` 不允许出现负值（代码防护已实现）。
- [ ] 存在 `ref_count` 对账与修复任务设计（定时任务）。
- [ ] 删除采用墓碑策略（`PENDING_DELETE`）而非立即物理删除。

## 五、权限与安全

- [ ] 所有下载/预览请求都经过权限校验（`sys_media_scopes`）。
- [ ] 不直接暴露物理 `storage_key` 给前端。
- [ ] 云存储使用短时签名 URL，本地存储使用后端代理流。
- [ ] `permission_mask` 位语义已文档化并在代码统一解释。
- [ ] `expires_at` 过期权限在鉴权时已正确处理。

## 六、异步处理与可观测性

- [ ] `sys_media_assets.thumb_generation` 已落地：`THUMBNAIL` 入队与字段更新同事务；Worker 回填前校验代次；过期 Job 标记 `CANCELLED` 并打结构化日志（见 `06-thumbnail-cover-pipeline-final.md`）。
- [ ] `sys_media_jobs` 支持失败状态落库（FAIL）与重试（RETRYING）。
- [ ] `sys_media_derivatives.process_status` 与任务状态联动规则已定义。
- [ ] 错误信息字段 `error_code/error_message` 有统一约定。
- [ ] 有任务失败监控指标与告警阈值。
- [ ] 支持人工重试入口（API 或后台管理）。
- [ ] `sys_media_outbox_events` 已落地，引用增减/审核状态变更事件可追踪并可重放。

## 七、视频切片正确性

- [ ] 切片时间满足 `start_ms < end_ms`（数据库约束 + 服务校验）。
- [ ] 片段状态支持 `ACTIVE/INVALID/OUTDATED`。
- [ ] 原视频时长变化后有重校验机制。
- [ ] 越界片段处理策略已明确（失效或自动裁剪）。
- [ ] 业务播放基于同一视频 + 时间轴，不复制视频文件。

## 八、无用户体系到真实用户体系迁移

- [ ] 当前阶段统一使用 `principal_key`（如 `SYSTEM:bootstrap`）。
- [ ] 资源库未直接关联宿主系统用户表。
- [ ] `iam_principal_map` 已纳入迁移规划与灰度方案。
- [ ] 双读双写流程和回滚开关方案已评审。
- [ ] 审计字段 `created_by/updated_by` 已按主体键写入。

## 九、发布与回滚准备

- [ ] 迁移脚本可重复执行（`CREATE TABLE IF NOT EXISTS`）。
- [ ] 在测试库完成全量建表验证。
- [ ] 关键接口联调通过（上传、引用、检索、授权、切片、任务查询）。
- [ ] 具备回滚预案（版本回退 + 开关回切）。
- [ ] 文档已同步更新：`03-database-dictionary.md` 与本检查表。

---

## 评审结论

- [ ] 通过（可进入开发/联调）
- [ ] 有条件通过（需完成整改项）
- [ ] 不通过（需重新评审）

### 整改项记录

1. 
2. 
3. 

### 评审签字

- 架构负责人：
- 后端负责人：
- DBA：
- 测试负责人：
- 日期：
