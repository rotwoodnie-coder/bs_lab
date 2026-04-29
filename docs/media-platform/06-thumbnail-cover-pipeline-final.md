# 视频 / 图片封面与缩略图全链路方案（最终版）

本文档为媒体中台「衍生缩略图（`THUMB_SM`）+ 异步 Job（`THUMBNAIL`）」的**冻结设计**，与仓库现状（登记入队、`mysql-job-thumb-worker` 占位实现、`getMaterialDetail` 在 infrastructure 层等）对齐，供分阶段实施与评审使用。

---

## 1. 文档目的与范围

**目的**：为视频 / 大图资产生成统一的小图衍生资源，在上传、列表、详情、媒体库中一致展示；支持处理中、失败、重截、缓存失效与并发安全；业务表不重复存储封面物理真源。

**范围**：`sys_media_jobs`（`THUMBNAIL`）、`sys_media_derivatives`（`THUMB_SM`）、`edu_media_registry`、`sys_media_assets`、Worker（Sharp + FFmpeg）、API 批量聚合（`enrichRegistries`）、前端 `MediaPreview`、实验材料等业务消费方。

**非目标**：MinIO Webhook 的详细配置（可与「上传完成入队」并存，由同一 Worker 消费）。

---

## 2. 设计原则

1. **单一真源**：每个 `asset_id` 仅保留**一条当前有效**的 `THUMB_SM`（`process_status = SUCCESS`）；历史对象通过版本化 `storage_key` 失效 CDN，库内通过事务与代次淘汰旧记录。
2. **Job 与 Web 解耦**：重计算在 Worker；入队在登记事务内（已有实践）。
3. **API 聚合**：海报 URL 与处理状态在 domain 层批量 enrich，禁止各路由重复 Join。
4. **可观测失败**：稳定 `error_code`，默认不自动重试；用户「重新处理」显式入队。
5. **Worker 与 MinIO 同内网**：拉取原对象使用内网 Endpoint，控制带宽与耗时。

---

## 3. 数据模型与存储路径

### 3.1 Job 与衍生类型

- **Job**：`sys_media_jobs.job_type = 'THUMBNAIL'`（不新增类型；视频 / 图片在 Worker 内分流）。
- **衍生**：`sys_media_derivatives.derivative_type = 'THUMB_SM'`（与现有代码命名一致）。

### 3.2 存储路径（缓存 bust）

建议：

`derivatives/{tenant_id}/{app_id}/{asset_id}/thumb_v{job_id}.jpg`

- 新任务新 `job_id` → 新 URL，天然刷新 CDN / 浏览器缓存。
- 库内仍只保留**一条**当前 SUCCESS 的 `THUMB_SM` 行（见 §5、§6）。

### 3.3 并发重截：单调代次 `thumb_generation`

**问题**：用户连点「重新截取」产生 Job1、Job2；若 Job2 先完成、Job1 后完成，可能把旧图写回。

**方案**：在 `sys_media_assets` 增加 **`thumb_generation`**（`BIGINT UNSIGNED NOT NULL DEFAULT 0`）（迁移见 §14 实施阶段）。

**规则**：

1. **入队**（与 `INSERT sys_media_jobs` 同一事务）：插入 Job 得到 `new_job_id` 后执行  
   `UPDATE sys_media_assets SET thumb_generation = ? WHERE id = ?`（写入**本次 Job 的 id**）。
2. **初始值**：`0` 表示尚未绑定代次；首 Job 入队后即为该 Job 的 id。
3. **事务回滚**：若 Job 插入失败整段回滚，则 `thumb_generation` 一并回滚，与 Job 表一致。
4. **Worker 提交前**（建议 `SELECT ... FOR UPDATE`）：读取 `thumb_generation`。
   - **仅当 `thumb_generation == 当前 job.id`** 时：淘汰旧 `THUMB_SM`、写入新 SUCCESS 行、将 Job 置 SUCCESS。
   - **若不相等**：本 Job 为**过期完成**，将 Job 置 **`CANCELLED`**（或统一枚举 `SUPERSEDED`），**不得**更新当前真源 derivative；并打**结构化日志**（见下）。

**可观测性（必做）**：过期完成时记录日志，便于排查「为什么重截后还是旧图」：

- 建议字段：`event=thumb_job_cancelled_stale_generation`、`asset_id`、`job_id`、`expected_job_id`（本 Job）、`actual_thumb_generation`（资产上当前代次）、`reason=newer_job_scheduled`。

> 说明：`sys_media_derivatives` 当前无 `job_id` 列；**不以**「derivative 上比 job_id」为门禁，**以 `asset.thumb_generation === job.id`** 为唯一门禁即可。

---

## 4. Worker 行为（分流与嗅探）

### 4.1 输入

- 按 `storage_engine` 从内网拉取原对象至临时文件（或受控流式），超时与大小上限可配置。

### 4.2 嗅探（防伪）

**不信任**仅 DB 中的 `mime_type` / 扩展名。

1. **ffprobe**：若能识别**视频流** → **FFmpeg** 管线（推荐 `thumbnail=N` 等，缓解片头黑场 / 淡入）。
2. 否则尝试 **Sharp** 作为静态图缩放。
3. 均失败 → `ERR_PROBE_FAILED`（或细分码），Job FAIL，**不自动重试**。

### 4.3 输出

- 统一写入 `THUMB_SM`；`storage_engine` 与主资产一致（LOCAL / S3）。
- 图片分支：Sharp 缩放；视频分支：FFmpeg 截帧 + 统一尺寸策略（产品可定）。

### 4.4 并发与资源

- Worker 进程级**最大并发**（如全局 2 路 FFmpeg）硬限制，避免 CPU 被打满。

---

## 5. GC（僵尸对象）

### 5.1 逻辑层（强一致）

在同一事务内：新 SUCCESS 写入前，将同 `asset_id` + `THUMB_SM` 的旧行 **删除**或标记为非 SUCCESS（如 `OBSOLETE`，需与字典一致），保证查询只认一条当前真源。

### 5.2 物理层（最终一致）

- **不在 Worker 成功路径同步删 MinIO**（易与事务竞态）。
- 采用 **Lifecycle** 或 **Cron**：删除 DB 中**无任何 `storage_key` 引用**的 orphan 对象（需 dry-run / 告警防误删）。

---

## 6. API 聚合层（`enrichRegistries`）

### 6.1 批量约束

- 列表 / 搜索：对 `asset_id`、`registry_id` **批量 `IN` 查询** derivatives 与 jobs；**禁止**在 `map` 内逐条查库。

### 6.2 处理状态语义（锚点）

对每条登记（或统一 DTO）：

- **`posterUrl`**：SUCCESS 的 `THUMB_SM` 经签名 / 网关后的 URL；无则 `null`。
- **`processingStatus`**：
  - **READY**：有 `posterUrl`，且无进行中的更新 Job。
  - **PROCESSING**：无 SUCCESS `THUMB_SM`，最新 Job ∈ {WAITING, PROCESSING}。
  - **FAILED**：无 SUCCESS，且最新 Job 为 FAIL（或衍生明确失败），并带 `errorCode`。
  - **NONE**：无成功衍生且无进行中 Job（如历史未入队）。
  - **STALE**：**有** `posterUrl`（继续展示旧图），但最新 Job ∈ {WAITING, PROCESSING}（用户已触发重截）。前端**不闪空白**。

### 6.3 STALE 前端微交互（建议）

- 在 **不替换 poster** 前提下，对 poster 容器轻微 **降权**（如 `filter: grayscale(0.2)` 或 `opacity: 0.8`～`0.92` 择一），配合「正在更新…」角标，表达「非最新、处理中」。
- 无障碍：角标配套简短文案或 `aria-busy` / `aria-live` 适度提示。

### 6.4 签名 URL

- `signUrl` 须尊重 `storage_engine`（LOCAL 网关 vs S3 预签名），禁止前端裸拼 MinIO 路径。

---

## 7. 失败终态编码（不自动重试）

| `error_code` | 触发场景 | UI 建议 |
|--------------|----------|---------|
| `ERR_PROBE_FAILED` | ffprobe 非视频且无法作为有效图片解码 | 「文件损坏」类占位 |
| `ERR_FFMPEG_TIMEOUT` | 截帧超时（过大 / 卡死 / 损坏） | 「视频解析失败」 |
| `ERR_SHARP_CORRUPT` | 宣称图片但 Sharp 无法完整解码 | 「图片损坏」 |
| `ERR_SIZE_EXCEEDED` | 超过 Worker 处理阈值 | 「资源过大，无法预览」 |

**策略**：写入 Job `FAIL` + `error_code`；**不自动重试**；仅用户「重新处理」产生新 Job 并刷新 `thumb_generation`。

### 7.1 运维：错误热点监控

- `error_code` 为**产品可观测性契约**：同时服务用户占位与运维告警。
- 建议对 `error_code` **按时间窗口计数**（日志或指标）：
  - **`ERR_FFMPEG_TIMEOUT` 突增** → Worker CPU / 并发不足、或 MinIO 内网带宽 / 延迟异常。
  - **`ERR_PROBE_FAILED` 突增** → 批量脏源或嗅探回归问题。
  - **`ERR_SIZE_EXCEEDED` 持续高** → 阈值过严或业务上传超规范。

---

## 8. 实验材料「双封面」优先级（enrich 后置）

**禁止**把合并逻辑写进复杂 SQL；在应用层 **`enrichRegistries` 之后** 解析：

1. **显式封面**：`coverRegistryId` 有值 → **始终**以该 registry 的 enrich 结果为准（含坏图 / FAILED 报错态）。
2. **槽位封面**：否则取 `resources` 中 `slot_key === 'cover'` 的 registry。
3. **自动预览**：否则取 `resources` 中**按列表顺序第一个** `mime_type` 匹配 `video/*` 的 `registry_id`（依赖批量已加载的 asset 元数据，避免 N+1）。

**与 `coverSnapshotUrl`**：约定 **enrich 后的签名 poster 优先**；snapshot 作兜底或离线场景（产品可再收紧）。

**API 落点**：`GET /v1/experimental-materials/:id` → `getMaterialDetail`（`mysql-materials-repository.ts`）扩展返回 **`cover_info`**（或等价结构），内部调用上述优先级与 enrich。

---

## 9. 前端：`MediaPreview`、SSR、IO 门禁

- **包位置**：交互在 `packages/ui`；业务传 `posterUrl`、`processingStatus`、`errorCode` 等。
- **SSR**：服务端仅输出 **poster 静态层**（如 `img`），**不挂载 `<video>`**。
- **IO 门禁**：`IntersectionObserver`，`threshold` 默认如 `0.1`；**仅当可见**且用户 **hover（或点击展开）** 时再挂载 `<video>`，减轻屏外解码与带宽。
- **清理**：`useEffect` 返回中 **`observer.disconnect()`**，依赖变更时重建 observer。
- **图片**：`<img loading="lazy">` 作为列表补充。

> 变更 `packages/ui` 须同步 `frontend/src/app/debug/ui/all-components`（registry + living-docs）。

---

## 10. 与现有代码映射

| 能力 | 现状 / 建议落点 |
|------|-----------------|
| 入队 | `backend/src/domain/media/persistence/mysql-media-repository.ts` 登记事务内已插入 `THUMBNAIL` |
| Worker | `backend/src/domain/media/persistence/mysql-job-thumb-worker.ts` 需替换为 Sharp + FFmpeg + 支持 S3/LOCAL |
| 批量 enrich | 新建或扩展 `backend/src/domain/media/`，避免各路由重复 Join |
| 材料详情 | `backend/src/http/routes/materials.ts` + `mysql-materials-repository.ts` 的 `getMaterialDetail` |
| 登记搜索 enrich 参考 | `backend/src/domain/media/media-search-enrich.ts`（批量 `IN` 模式） |

---

## 11. 验收清单（摘要）

- [ ] 同 asset 并发两次重截，仅**最后一次意图**落库为 SUCCESS derivative；过期 Job 为 CANCELLED 且有日志。
- [ ] STALE 态列表**不闪空白**；可选灰度 / 透明度 + 角标。
- [ ] 列表页 **无 N+1**；Worker **限并发**。
- [ ] 错误码与 UI 占位一致；无死循环自动重试。
- [ ] 材料封面优先级与 §8 一致。
- [ ] `thumb_v{job_id}` 与 DB 单 SUCCESS 共存；orphan 对象有清理策略。
- [ ] 监控可对 `error_code` 做热点告警。

---

## 12. 分步实施路线图（执行顺序）

以下为依赖有序的**阶段任务**；每阶段可单独评审与合并。

**已落地（仓库现状）**：阶段 A 迁移 `0020`；阶段 B 入队同事务更新 `thumb_generation`；阶段 C 占位 Worker 已加入代次校验、`CANCELLED`、路径 `thumb_v{job_id}`、写库前删除旧 `THUMB_SM`；阶段 D 已提供 `mysqlBatchEnrichRegistryThumbnails`、`GET /v1/experimental-materials/:id` 的 `coverThumb`、`variant=thumb_sm` 流式输出；阶段 E（部分）实验材料弹窗已展示 `coverThumb` 状态与衍生预览，同源代理 `/api/media/registry-stream` 已转发 `variant`。**待办**：真 FFmpeg/Sharp、S3 Worker、`packages/ui` 内 `MediaPreview` 的通用 IO/lazy、监控与 GC Cron。

### 阶段 A：数据库与字典

1. 新增迁移：`sys_media_assets.thumb_generation`（`BIGINT UNSIGNED NOT NULL DEFAULT 0`）。
2. 更新 `docs/media-platform/03-database-dictionary.md`、`04-db-review-checklist.md`。
3. 若 Job 需 `CANCELLED`：确认 `sys_media_jobs.process_status` 枚举是否需扩展（与现有 `WAITING/PROCESSING/SUCCESS/FAIL` 对照）。

### 阶段 B：入队事务

1. 在插入 `THUMBNAIL` Job 的同一事务中 `UPDATE sys_media_assets SET thumb_generation = new_job_id WHERE id = asset_id`。
2. 「重新截取封面」入口：插入新 Job 并同样更新 `thumb_generation`（幂等与防抖产品定）。

### 阶段 C：Worker 真实现

1. 替换占位逻辑：ffprobe → FFmpeg / Sharp；内网拉取与上传；超时与大小阈值。
2. 提交前 `thumb_generation` 校验；过期则 `CANCELLED` + 结构化日志。
3. 同一事务内淘汰旧 `THUMB_SM` 行再插入新 SUCCESS 行。
4. 全局并发限制与 `ERR_*` 写入。

### 阶段 D：API 聚合

1. 实现 `enrichRegistries`（批量 derivatives + 最新 Job）；输出 `posterUrl`、`processingStatus`（含 STALE）、`errorCode`。
2. `getMaterialDetail`（及列表如需要）挂载 `cover_info` 与 §8 优先级。

### 阶段 E：前端

1. `MediaPreview`：`loading="lazy"`、STALE 视觉、IO + hover 再挂载 video（`packages/ui` + living-docs）。
2. 实验材料表单 / 详情：按 `processingStatus` 切换占位、图、失败态。

### 阶段 F：运维与存量

1. 日志 / 指标：`error_code` 窗口计数与告警规则。
2. 可选：存量补 Job 脚本或管理端「扫描入队」（限流 + 进度）；MinIO Lifecycle / Cron orphan 清理。

---

## 13. 变更维护约定

- 修改 Job / 衍生 / 资产字段时：同步 **本文件**、`03-database-dictionary.md`、相关 checklist。
- 新增 `error_code`：同步 §7 表与监控规则说明。

---

## 14. 参考文献（仓库内）

- `docs/media-platform/00-overview.md`：Derivative / Job 边界。
- `database/migrations/0004_media_platform_init.sql`：`sys_media_derivatives`、`sys_media_jobs`、`sys_media_assets` 表结构。
