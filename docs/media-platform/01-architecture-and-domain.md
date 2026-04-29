# 媒体资源中台架构与领域模型

## 1. 六层能力架构

### 1.1 接入层

- 统一 API 入口。
- SDK 封装调用协议。
- 与宿主系统通过 Hook 解析主体信息与权限上下文。

### 1.2 物理资源层（`sys_media_assets`）

- 按内容哈希去重，存储物理对象唯一记录。
- 管理 `ref_count`、状态与存储定位信息。

### 1.3 资源登记层（`edu_media_registry`）

- 管理显示名称、归属主体与业务扩展元数据。
- 支持资源身份迁移，不影响物理资源。

### 1.4 引用映射层（`sys_media_references`）

- 将资源或视频片段挂载到业务节点。
- 支持快照固化和引用版本控制。

### 1.5 权限范围层（`sys_media_scopes`）

- 按主体发放查看、下载、编辑、分享权限。
- 支持有效期控制和后续审计扩展。

### 1.6 衍生与任务层（`sys_media_derivatives`、`sys_media_segments`、`sys_media_jobs`）

- 管理缩略图/转码/预览等衍生资产。
- 管理视频片段与状态校验。
- 管理异步处理状态与失败重试。

## 2. 关键领域规则

## 2.1 去重规则

- 判重主键为 `(tenant_id, app_id, content_hash_sha256, file_size)`。
- 相同内容仅生成一个物理资源记录。
- 多业务引用共享同一物理资源。

## 2.2 引用规则

- 业务场景挂载统一写入 `sys_media_references`。
- 禁止业务表直接存储物理路径。
- 删除业务挂载仅删除引用，不直接删物理文件。

## 2.3 引用计数规则

- 创建引用：同事务 `ref_count + 1`。
- 删除引用：同事务 `ref_count - 1`。
- 对账任务每日修复漂移，避免并发异常导致不一致。

## 2.4 删除与回收规则

- 资源删除采用墓碑机制：`ACTIVE -> PENDING_DELETE -> DELETED`。
- 当 `ref_count = 0` 时进入延迟回收队列。
- 物理删除失败必须可重试并保留错误记录。

## 2.5 视频片段规则

- 切片仅记录时间轴，不复制原视频文件。
- `start_ms < end_ms` 且 `end_ms <= duration_ms`。
- 当源视频时长变化时，触发全部片段重校验。
- 越界片段自动标记 `INVALID` 或 `OUTDATED`。

## 3. 状态机定义

### 3.1 资源状态（`sys_media_assets.status`）

- `ACTIVE`：可正常使用。
- `PENDING_DELETE`：等待回收。
- `DELETED`：已物理清理。
- `QUARANTINED`：隔离态（安全扫描待确认）。

### 3.2 异步任务状态（`sys_media_jobs.process_status`）

- `WAITING`：待执行。
- `PROCESSING`：处理中。
- `SUCCESS`：处理成功。
- `FAIL`：处理失败。
- `RETRYING`：重试中。

### 3.3 片段状态（`sys_media_segments.status`）

- `ACTIVE`：有效可用。
- `INVALID`：无效（越界、冲突等）。
- `OUTDATED`：需人工复核更新。

## 4. 存储与访问安全

### 4.1 存储键规范

- 数据库存储 `storage_key`，不存公开直链。
- 推荐路径：`/data/{tenant_id}/{app_id}/{engine}/{hash_path}`。

### 4.2 访问策略

- 云端对象存储：返回短时效签名 URL。
- 本地存储：走后端代理流，实时做权限校验。
- 所有访问记录应可审计（主体、资源、动作、时间）。

## 5. 无用户体系阶段运行策略

- 资源库统一使用 `principal_key` 表示操作主体。
- 示例：`SYSTEM:bootstrap`、`ORG:school-1001`、`ROLE:teacher`。
- 后续接入真实用户体系时，通过 `iam_principal_map` 做映射，无需重构核心表结构。
