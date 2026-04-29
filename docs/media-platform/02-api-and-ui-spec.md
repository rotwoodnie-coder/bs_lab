# 媒体资源中台 API 与前端交互说明

## 1. API 设计规范

- 路径前缀：`/api/media`
- 鉴权上下文：请求头传递 `tenant_id`、`app_id`、`authorization`
- 响应结构统一：
  - `code`：业务码
  - `message`：提示信息
  - `data`：业务数据
- 分页参数统一：`page`、`size`

## 1.1 媒体类型枚举值（联调基线）

`mediaType` / `media_type` 统一使用以下枚举值：

- `IMAGE`：图片（png/jpg/jpeg/webp 等）
- `VIDEO`：视频（mp4/webm/mov 等）
- `DOC`：通用文档（txt/md/doc/docx 等）
- `AUDIO`：音频（mp3/wav/aac 等）
- `PPT`：文稿（ppt/pptx）
- `PDF`：便携文档（pdf）
- `EXCEL`：表格文档（xls/xlsx/csv）

约束说明：

- 后端接口参数校验与本枚举保持一致。
- 数据库 `sys_media_assets.media_type` 取值与本枚举保持一致。
- 前端筛选、上传、展示分类必须使用同一枚举，不允许本地自定义别名。

## 1.2 图片预览策略与衍生优先级

图片场景建议统一走衍生资源读取策略，避免直接加载原图带来的首屏抖动和带宽浪费。

衍生类型定义：

- `THUMB_SM`：`200x200` 裁剪图，用于列表/网格缩略卡片。
- `THUMB_MD`：宽度约 `800px` 等比图，用于瀑布流卡片。
- `WEBP_VER`：原尺寸 WebP，用于图片详情预览优先加载。

前端加载优先级：

- 列表/网格：`THUMB_SM` -> 原图兜底。
- 瀑布流：`THUMB_MD` -> 原图兜底。
- 详情预览：`WEBP_VER` -> 原图兜底。

渲染体验建议：

- 先使用 `aspect_ratio` 进行骨架占位，避免图片加载前高度跳变。
- 使用 `dominant_color` 作为占位底色，减少白屏闪烁感。

## 2. 核心接口清单

## 2.1 资源上传与详情

- `POST /api/media/assets/upload`
  - 功能：上传素材并创建登记记录。
  - 请求：`file`、`title`、`owner_type`、`owner_key`。
  - 返回：`asset_id`、`registry_id`、`process_status`。

- `GET /api/media/assets/{assetId}`
  - 功能：获取物理资源详情、衍生资源、引用统计。

- `GET /api/media/registry/{registryId}`
  - 功能：获取资源业务登记信息和权限摘要。

## 2.2 引用挂载与解绑

- `POST /api/media/references`
  - 请求体：
    - `target_kind`（`REGISTRY` 或 `SEGMENT`）
    - `target_id`
    - `ref_type`（如 `EXPERIMENT_STEP`）
    - `ref_id`
    - `slot_key`
    - `sort_order`
    - `snapshot_json`
    - `annotation_json`（图片在线标注矢量层）
  - 功能：将素材挂载到业务节点。

- `DELETE /api/media/references/{referenceId}`
  - 功能：解除引用并更新 `ref_count`。

- `GET /api/media/references`
  - 查询参数：`ref_type`、`ref_id`
  - 功能：获取业务节点已挂载素材列表。

## 2.3 检索接口

- `GET /api/media/search`
  - 参数：
    - `keyword`
    - `media_type`
    - `scene_type`
    - `owner_key`
    - `status`
    - `page`、`size`
  - 功能：统一检索资源，返回资源与引用位置摘要。
  - 响应建议增加：
    - `match_type`：`TITLE_MATCH`（权重 100）/ `CONTENT_MATCH`（权重 50）
    - `match_snippet`：命中片段（OCR命中时用于提示“匹配到内容：...”）
  - 查询参数补充：
    - `reviewStatus`：按 `edu_media_registry.review_status` 精确筛选（如 `PENDING_REVIEW` 待办队列）。

## 2.3b 审核策略、版本与引用升级（P0 联调基线）

后端路径前缀与现网一致：`/v1/media/*`（经网关映射到文档中的 `/api/media/*` 亦可）。

### 审核策略

- `GET /v1/media/review-policy`  
  - 权限：`media:read`  
  - 返回当前 `org_key`（请求头 `x-org-id`）对应策略；无记录时返回默认「需审核」。

- `PUT /v1/media/review-policy`  
  - 权限：`media:review`（教研员/区域管理员等）  
  - 请求体：`{ "teacherUploadRequireReview": true | false }`  
  - 作用：配置教师上传后是否必须经审核才能进入「已发布」。

### 登记审核流转

- `POST /v1/media/registry/{registryId}/submit-review`  
  - 权限：`media:upload`（教师侧提交）  
  - 允许状态：`DRAFT`、`REJECTED`。  
  - 若策略为需审核：`DRAFT/REJECTED` → `PENDING_REVIEW` 并写入 `submitted_at`。  
  - 若策略为免审：直接 `PUBLISHED`（与上传初始态一致）。

- `POST /v1/media/registry/{registryId}/approve`  
  - 权限：`media:review`  
  - 允许状态：`PENDING_REVIEW` → `PUBLISHED`。

- `POST /v1/media/registry/{registryId}/reject`  
  - 权限：`media:review`  
  - 请求体：`{ "comment": "驳回原因（必填）" }`  
  - 允许状态：`PENDING_REVIEW` → `REJECTED`，写入 `review_comment`。

### 已发布素材改版（新版本登记）

- `POST /v1/media/registry/{registryId}/revision`  
  - 权限：`media:upload`  
  - 前置条件：源登记 `review_status=PUBLISHED`。  
  - 请求体（可选）：`title`、`assetId`（更换物理资源时）。  
  - 行为：在同一 `registry_group_id` 下创建新版本行，`version_number` 递增，`review_status=DRAFT`，**不自动迁移业务引用**。

### 业务引用升级到新版本登记

- `POST /v1/media/references/{referenceId}/upgrade-registry`  
  - 权限：`media:reference`  
  - 请求体：`{ "targetRegistryId": "<新版本登记ID>" }`  
  - 约束：`target` 与当前引用目标须同族谱（`registry_group_id` 一致）、目标须为 `PUBLISHED`，且 `version_number` 不低于引用所冻结的 `ref_version`（实现上为严格升级校验）。  
  - 副作用：更新 `sys_media_references.target_id` 与 `ref_version`，并同步修正 `sys_media_assets.ref_count`。

### 登记详情

- `GET /v1/media/registry/{registryId}`  
  - 权限：`media:read`  
  - 返回完整登记行（含 `review_status`、`version_number`、`registry_group_id` 等），供详情与版本提示。

### 前端交互要点

- **教师**：素材编辑闭环为「草稿/驳回 → 提交审核 →（可选）修订新版本」；已发布改版走 `revision` 接口，避免原地覆盖。  
- **教研员**：资源列表支持 `reviewStatus=PENDING_REVIEW` 筛队列；操作「通过 / 驳回」使用上述 POST。  
- **版本升级提示**：当业务仍引用旧 `registry_id` 时，在宿主页面提示执行 `upgrade-registry` 或业务内等价操作，避免历史内容被静默替换。

## 2.4 权限与访问链接

- `POST /api/media/scopes`
  - 功能：授予主体权限。
  - 请求：`registry_id`、`subject_type`、`subject_key`、`permission_mask`、`expires_at`。

- `DELETE /api/media/scopes/{scopeId}`
  - 功能：撤销权限。

- `GET /api/media/registry/{registryId}/access-url`
  - 参数：`action=view|download`
  - 功能：返回短时访问地址或代理访问地址。

## 2.5 视频片段接口

- `POST /api/media/segments`
  - 请求：`asset_id`、`segment_type`、`title`、`start_ms`、`end_ms`、`tags`。
  - 功能：创建片段。
  - 备注：AI自动生成片段时建议补充 `source_type=AI_GENERATED`、`confidence`。

请求示例（人工创建）：

```json
{
  "assetId": "12345",
  "segmentType": "STEP",
  "title": "连接器材",
  "startMs": 45000,
  "endMs": 62000,
  "tags": ["器材", "连接"]
}
```

请求示例（AI 生成，待人工确认）：

```json
{
  "assetId": "12345",
  "segmentType": "STEP",
  "title": "器材连接成功",
  "startMs": 45000,
  "endMs": 62000,
  "sourceType": "AI_GENERATED",
  "confidence": 0.8732,
  "tags": ["AI", "器材检测"]
}
```

- `PATCH /api/media/segments/{segmentId}`
  - 功能：更新片段信息与时间轴。

- `GET /api/media/segments`
  - 参数：`asset_id`
  - 功能：查询视频片段列表。

- `POST /api/media/segments/{segmentId}/validate`
  - 功能：手动触发片段有效性校验。

## 2.6 异步任务接口

- `GET /api/media/jobs/{jobId}`
  - 功能：查询任务状态、错误信息与结果。

- `POST /api/media/jobs/{jobId}/retry`
  - 功能：重试失败任务。

- `GET /api/media/outbox/events`
  - 参数：`status`、`eventType`、`limit`
  - 功能：拉取 Outbox 事件（P1 自动化治理链路联调入口）。
  - 当前事件类型：
    - `REFERENCE_CREATED`
    - `REFERENCE_DELETED`
    - `REGISTRY_REVIEW_STATUS_CHANGED`

- `POST /api/media/outbox/process`
  - 请求体（可选）：`{ "limit": 20 }`（单次最多处理条数，默认 20，上限 100）
  - 功能：消费一批 `PENDING` 且已到 `available_at` 的 Outbox 事件；成功则 `status=PUBLISHED`，失败则指数退避重试，超过上限则 `status=FAILED`。
  - 说明：当前实现为内存 Outbox + 占位分发，便于联调；持久化后应由后台 Worker 或调度器周期性调用等价逻辑。

- `POST /api/media/jobs/pending/complete`
  - 请求体（可选）：`{ "limit": 50 }`（单次最多推进条数，默认 50，上限 200）
  - 功能：将本租户下仍处于 `WAITING` / `PROCESSING` / `RETRYING` 的任务批量标记为 `SUCCESS`（联调占位，对应实际上线时应替换为真实任务执行器回执）。
  - 权限：`media:job`

- `GET /api/media/assets/{assetId}`
  - 功能：按 ID 查询物理资源详情。
  - 权限：`media:read`

- `GET /api/media/segments`
  - 查询参数：`asset_id`（必填）
  - 功能：列出某资源下视频片段。
  - 权限：`media:read`

- `PATCH /api/media/segments/{segmentId}`
  - 功能：更新片段起止、标题、标签等。
  - 权限：`media:segment`

- `POST /api/media/segments/{segmentId}/validate`
  - 功能：触发片段有效性校验，越界或非法区间将标记 `INVALID`。
  - 权限：`media:segment`

- `DELETE /api/media/scopes/{scopeId}`
  - 功能：撤销授权范围记录。
  - 权限：`media:scope`

- `GET /api/media/governance/orphans`
  - 功能：返回「`ref_count=0` 的活跃资产」与「无任何业务引用指向登记 ID」的登记列表快照，供孤儿治理与清理评审（内存实现，持久化后应以 SQL 报表为准）。
  - 权限：`media:read`

环境变量（可选，本地联调）：

- `MEDIA_BACKGROUND_LOOP_MS`：大于 `0` 时，后端按该间隔毫秒对本进程内全部租户执行一次 Outbox 消费与异步任务占位完成，便于无人工触发时的全链路闭环。

### 任务流水线约定（建议）

- `parent_job_id` 用于串联任务链路（如：TRANSCODE -> FRAME_EXTRACT -> CV_DETECT -> SUMMARY）。
- 查询某次分析的全部子任务：按 `parent_job_id` 拉取树状任务。

任务图谱查询（联调建议）：

- `GET /api/media/jobs/{jobId}?include=graph`
  - 返回：`job + parent + children`

返回示例：

```json
{
  "job": { "id": "2001", "jobType": "TRANSCODE", "processStatus": "SUCCESS", "parentJobId": null },
  "parent": null,
  "children": [
    { "id": "2002", "jobType": "FRAME_EXTRACT", "processStatus": "SUCCESS", "parentJobId": "2001" },
    { "id": "2003", "jobType": "CV_DETECT", "processStatus": "PROCESSING", "parentJobId": "2001" }
  ]
}
```

## 2.7 OCR 检索接口建议

- `GET /api/media/search`
  - 参数补充：`keyword` 同时匹配 `title` 与 `ocr_text`。
  - 功能：支持“标题未命中但图片文字命中”的检索场景。

- `POST /api/media/assets/{assetId}/ocr`
  - 功能：触发 OCR 异步任务（job_type=`OCR`）。
  - 返回：`job_id`、`process_status`。

## 3. 前端交互规范

## 3.1 资源中心页

- 搜索区：
  - 关键词检索、媒体类型、场景类型、状态筛选。
- 列表区：
  - 展示缩略图、标题、媒体类型、大小、引用次数、更新时间。
- 操作区：
  - 预览、复制引用、授权设置、删除、查看引用位置。

## 3.2 业务挂载弹窗

- 左侧过滤：按场景和关键词筛选可挂载素材。
- 右侧列表：支持单选/多选、按引用次数排序。
- 确认挂载：写入 `ref_type + ref_id + slot_key`。

## 3.3 视频切片弹窗

- 播放器区：支持拖拽时间轴打点。
- 片段列表：展示片段类型、起止时间、状态。
- 快捷标签：步骤、结果、总结、安全提醒。

## 3.4 图片热点标注交互

- 支持在图片上框选热点区域（比例坐标）。
- 每个热点可填写标题、说明、标签。
- 点击热点显示说明弹层，用于“结构讲解/安全提醒/关键点说明”。
- 热点数据建议按资源ID一次性加载，减少重复请求。

## 3.5 图片在线标注交互（底图 + 矢量图层）

- 底图始终使用原始资源或衍生资源，不直接改写原图文件。
- 标注内容存储在 `annotation_json`，并与引用关系绑定。
- 同一张图在不同业务场景可维护不同标注，不相互覆盖。
- 渲染层建议采用 SVG/Canvas 叠加，支持撤销与重做。

## 3.6 状态提示规范

- `PROCESSING`：展示“处理中”占位态和轮询提示。
- `FAIL`：展示失败原因和“重新触发”按钮。
- `INVALID`：展示“片段失效，请重新标注”提示。
- 无权限：展示“暂无访问权限”提示，不暴露真实路径。

## 4. 后端联调约定

- 上传后立即返回登记信息，衍生处理走异步任务。
- 引用创建与 `ref_count` 更新必须在同事务内完成。
- 访问地址必须由服务端动态签发，不允许前端拼接存储路径。
- 所有错误响应需返回可追踪 `trace_id`。
- 图片上传后建议后台异步生成 `THUMB_SM/THUMB_MD/WEBP_VER`，并可查询处理状态。
- OCR 任务完成后应写入 `ocr_text`，并刷新检索索引。

## 4.1 分片上传与断点续传协议（建议）

适用场景：大视频/大文件（数百MB~数GB）避免网络抖动导致重传。

### Init

- `POST /api/media/uploads/init`
  - 入参：`hash`、`file_size`、`file_name`、`chunk_size`
  - 返回：
    - `is_instant`：是否秒传（已存在）
    - `upload_session_id`：会话ID（需要上传时返回）
    - `next_part_index`：建议从第几块开始传

### Chunk

- `PUT /api/media/uploads/{upload_session_id}/parts/{part_index}`
  - 入参：分片二进制
  - 返回：`uploaded=true`

### Merge

- `POST /api/media/uploads/{upload_session_id}/complete`
  - 功能：触发合并，合并完成后创建 `asset + registry`，并异步触发 `THUMBNAIL/OCR` 等任务
  - 返回：`job_id`（合并任务或后续任务）

实现建议：

- `sys_media_jobs.job_type=UPLOAD_SESSION` 作为会话记录载体。
- `upload_status` 建议取值：`INIT/UPLOADING/MERGING/COMPLETED/FAILED`。
