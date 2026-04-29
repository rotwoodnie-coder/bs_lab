# 媒体资源中台数据库字段说明（人工核对版）

## 使用说明

本文档用于辅助开发人员审阅 `database/migrations/0004_media_platform_init.sql`。  
每张表按“用途、关键字段、约束与索引、开发注意事项”进行说明，便于评审和联调阶段快速核对。

---

## 1. `iam_principal_map`

### 表用途

统一主体映射表，用于把资源系统中的 `principal_key` 映射到真实用户体系。  
在“无用户体系阶段”可先只使用 `principal_key`，后续补齐 `user_id`。

### 关键字段说明

- `tenant_id`：租户隔离键，必填。
- `app_id`：应用隔离键，必填。
- `principal_key`：统一主体键，格式建议 `TYPE:ID`，如 `USER:1001`。
- `principal_type`：主体类型，限定 `USER/ORG/ROLE/SYSTEM/EXTERNAL`。
- `user_id`：真实用户ID，可空；仅 `USER` 场景建议填充。
- `status`：映射状态（1 启用，0 停用）。
- `source`：映射来源（如 `MIGRATION/API/SYNC`）。
- `version`：乐观锁版本，防并发覆盖。

### 约束与索引

- 唯一键 `uk_iam_principal`：防止同租户同应用主体重复。
- 索引 `idx_iam_user`：支持按用户反查主体。
- `chk_iam_principal_type`：限制类型合法值。

### 开发注意事项

- 禁止直接依赖宿主系统用户表外键，避免跨系统耦合。
- 用户系统接入后采用“双读双写 + 灰度切流”。

---

## 2. `sys_media_assets`

### 表用途

物理资源主表，承载去重与存储定位。  
业务层不直接引用本表，而是通过 `registry/references` 间接使用。

### 关键字段说明

- `content_hash_sha256`：内容哈希，用于去重主键。
- `file_size`：文件大小，和哈希一起用于判重与校验。
- `media_type`：媒体类型（IMAGE/VIDEO/DOC/AUDIO/PPT/PDF/EXCEL）。
- `storage_engine`：存储驱动（LOCAL/OSS/COS/S3）。
- `storage_key`：对象键或相对路径，避免暴露物理直链。
- `duration_ms`：音视频时长，非音视频为空。
- `image_width/image_height`：图片像素尺寸，支撑网格与瀑布流预占位。
- `thumb_generation`：封面 / 缩略图代次（`BIGINT UNSIGNED`，默认 `0`）。入队 `THUMBNAIL` 时写入**本次** `sys_media_jobs.id`；Worker 写回 `THUMB_SM` 前须校验 `thumb_generation` 仍等于当前 Job id，防止并发重截时旧 Job 覆盖新图。详见 `06-thumbnail-cover-pipeline-final.md` §3.3。
- `aspect_ratio`：图片宽高比（如 16:9），用于首屏骨架布局稳定。
- `dominant_color`：图片主色调（HEX），用于加载前色块占位。
- `exif_json`：EXIF元数据（拍摄时间、设备信息等），用于审计与真伪辅助。
- `image_meta_json`：图片扩展信息（方向、色彩空间、位深等）。
- `ref_count`：引用计数，用于回收策略判断。
- `status`：资源状态（ACTIVE/PENDING_DELETE/DELETED/QUARANTINED）。
- `pending_delete_at`：进入待物理删除的时间戳，用于“宽限期GC保险栓”（避免误删共享资源）。
- `created_by/updated_by`：操作主体，建议写入 `principal_key`。

### 约束与索引

- 唯一键 `uk_asset_dedup`：同租户同应用下确保内容唯一。
- 索引 `idx_asset_status`：支撑回收任务扫描。
- 索引 `idx_asset_media_type`：支撑筛选查询。

### 开发注意事项

- `ref_count` 必须与引用增删在同事务更新。
- 删除走墓碑机制，不要直接物理删除。
- 当 `ref_count` 归零时应写入 `pending_delete_at`，GC 仅处理超过宽限期的资源（建议 7 天）。
- 宽限期内若同内容文件再次被引用，应清空 `pending_delete_at` 立即恢复。
- 图片前端预览建议优先读取 `aspect_ratio + dominant_color`，减少布局抖动。
- EXIF 解析失败不应阻断上传，可异步补全。

---

## 2b. `sys_media_review_policy`

### 表用途

按组织维度配置「教师上传是否必须经过教研审核」，用于控制台开关与上传后的初始 `review_status` 判定。

### 关键字段说明

- `org_key`：组织键（无用户体系阶段可用学校/区县编码），与请求头 `x-org-id` 对齐。
- `teacher_upload_require_review`：`1` 表示教师新登记默认进入 `DRAFT` 并需走提交审核；`0` 表示上传后可按策略直接视为 `PUBLISHED`（仍保留后续人工归档能力）。

### 约束与索引

- `uk_review_policy_org`：同一租户、应用、组织仅一条策略。
- `chk_review_policy_flag`：限定 0/1。

### 开发注意事项

- 未命中策略行时，后端默认按「需审核」处理，避免误开闸。
- 变更策略不追溯改写历史登记，仅影响之后新上传与「提交审核」分支。

---

## 3. `edu_media_registry`

### 表用途

资源登记表（业务入口），解决“同一物理资源在不同业务下有不同名称和归属”的问题。

### 关键字段说明

- `asset_id`：关联物理资源。
- `title`：业务展示名称，可被修改。
- `owner_type/owner_key`：资源归属主体。
- `extra_meta`：宿主系统扩展元数据（JSON）。
- `ocr_text`：OCR识别文本（文本检索主字段）。
- `classification_status`：分类状态（NORMAL/ORPHANED/PENDING_REBIND）。
- `status`：登记状态（ACTIVE/ARCHIVED）。
- `review_status`：审核状态（DRAFT/PENDING_REVIEW/PUBLISHED/REJECTED/ARCHIVED）。
- `review_comment`：审核意见（驳回原因等）。
- `reviewed_by` / `reviewed_at`：审核动作主体与时间。
- `submitted_at`：最近一次提交审核时间。
- `registry_group_id`：同一逻辑资源的族谱 ID（首条登记建议等于自身 `id`，由应用层写入）。
- `version_number`：族谱内单调递增版本号；业务引用通过 `sys_media_references.ref_version` 与之一致，便于冻结与升级。
- `supersedes_registry_id`：上一版登记 ID，用于版本链追溯。
- `deleted_at`：软删除时间。

### 约束与索引

- 外键 `fk_registry_asset`：登记必须绑定真实物理资源。
- 索引 `idx_registry_owner`：支持按归属主体检索。
- 索引 `idx_registry_status`：支持状态筛选。
- 索引 `idx_registry_review`：按审核状态筛队列（待办）。
- 索引 `idx_registry_lineage`：按族谱与版本排序。
- 全文索引 `ft_registry_ocr_text`：支持按图片识别文本检索。
- `chk_registry_review_status`：限定审核状态枚举。

### 开发注意事项

- 教学架构变更导致失配时，优先将状态改为 `ORPHANED`，不要直接删除。
- OCR任务建议异步完成后写入 `ocr_text`，`extra_meta` 可保留原始识别结构。
  - 检索建议：标题命中优先，其次 OCR 内容命中；API 返回 `match_type` 与匹配片段降低困惑感。
- **已发布素材改版**：应新建登记行（同 `registry_group_id`，`version_number` 递增），由业务引用显式「升级」指向新 `registry_id`，避免静默覆盖历史场景。

---

## 4. `sys_media_references`

### 表用途

统一引用中心，将资源或视频片段挂载到业务节点，支撑“多处复用”。

### 关键字段说明

- `target_kind`：引用目标类型（`REGISTRY` 或 `SEGMENT`）。
- `target_id`：目标ID（对应登记ID或片段ID）。
- `ref_type`：业务场景编码，如 `EXPERIMENT_STEP`。
- `ref_id`：业务主键ID。
- `slot_key`：页面槽位，避免同场景重复挂载。
- `snapshot_json`：引用快照，保障历史显示稳定。
- `annotation_json`：在线标注矢量图层（点、线、框、文本、颜色等）。
- `ref_version`：与当时绑定的 `edu_media_registry.version_number` 对齐，用于引用冻结；升级引用时同步递增。

### 约束与索引

- 索引 `idx_ref_lookup`：按业务节点查挂载素材。
- 索引 `idx_ref_target`：按素材反查被使用位置。
- 唯一键 `uk_ref_slot`：同槽位防重复挂载。

### 开发注意事项

- 删除引用后要同步更新 `sys_media_assets.ref_count`。
- 快照字段只存展示必需信息，避免冗余过大。
- 标注建议随引用保存，确保同一底图在不同业务场景可独立标注。

---

## 5. `sys_media_scopes`

### 表用途

资源权限范围表，定义谁可以对某登记资源做什么动作。

### 关键字段说明

- `registry_id`：权限作用对象（登记资源）。
- `subject_type/subject_key`：被授权主体。
- `permission_mask`：位标记权限（view=1、download=2、edit=4、share=8）。
- `expires_at`：到期时间，可为空表示长期有效。

### 约束与索引

- 外键 `fk_scope_registry`：权限记录必须绑定登记资源。
- 索引 `idx_scope_subject`：按主体批量求权。

### 开发注意事项

- 访问地址签发前必须实时校验本表。
- 过期权限可通过定时任务做失效清理。

---

## 6. `sys_media_derivatives`

### 表用途

衍生资源表，存储缩略图、预览、转码等结果。

### 关键字段说明

- `asset_id`：关联原始资源。
- `derivative_type`：衍生类型（THUMB_SM/THUMB_MD/WEBP_VER/PDF_PREVIEW/VIDEO_POSTER/TRANSCODED）。
- `storage_key`：衍生文件定位。
- `width/height`：衍生图尺寸。
- `quality`：转码或压缩质量（0-100）。
- `strategy`：处理策略（crop/fit/fill）。
- `ref_count`：衍生资源引用计数。
- `process_status`：处理状态（WAITING/PROCESSING/SUCCESS/FAIL/RETRYING）。
- `error_code/error_message`：失败原因记录。

### 约束与索引

- 外键 `fk_derivative_asset`：衍生资源从属于某资产。
- 索引 `idx_derivative_status`：支撑失败任务排查与重试。

### 开发注意事项

- 前端看到 `PROCESSING` 显示处理中占位图。
- 状态为 `FAIL` 时必须允许人工重触发。
- 图片建议至少生成三类衍生：`THUMB_SM`、`THUMB_MD`、`WEBP_VER`。

---

## 7. `sys_media_hotspots`

### 表用途

图片热点标注表，用于在图片局部区域挂载说明信息，支撑实验图示点击讲解。

### 关键字段说明

- `registry_id`：关联资源登记记录。
- `x_ratio/y_ratio/w_ratio/h_ratio`：热点框坐标与尺寸占比（范围 0~1）。
- `title`：热点标题。
- `content`：热点说明文本。
- `tag`：热点标签（如“安全提示”“关键接线点”）。

### 约束与索引

- 外键 `fk_hotspot_registry`：热点必须绑定有效登记资源。
- `chk_hotspot_*`：保证热点坐标与尺寸占比合法。
- 索引 `idx_hotspot_registry`：按资源快速加载全部热点。

### 开发注意事项

- 坐标建议以前端原图渲染区域归一化计算，避免分辨率差异导致偏移。
- 热点编辑建议增加最小宽高阈值，避免误触难操作。

---

## 8. `sys_media_segments`

### 表用途

视频切片表，支持同一视频在不同业务节点按不同时间区间复用。

### 关键字段说明

- `asset_id`：所属视频资源。
- `segment_type`：片段类型（STEP/RESULT/SUMMARY/SAFETY/OTHER）。
- `start_ms/end_ms`：片段起止时间（毫秒）。
- `source_type`：片段来源（MANUAL/AI_GENERATED）。
- `confidence`：置信度（0-1），AI生成片段建议填写，用于后台“确认/筛选”。
- `transcript_excerpt`：文本摘要（可选）。
- `tags`：标签（JSON）。
- `status`：片段状态（ACTIVE/INVALID/OUTDATED）。

### 约束与索引

- 检查约束 `chk_segment_range`：要求 `start_ms < end_ms`。
- 索引 `idx_segment_asset`：按视频查片段。

### 开发注意事项

- 业务播放时使用原视频 + `start_ms/end_ms` 控制，不复制视频文件。
- 原视频时长变化后必须重新校验片段并更新状态。
- AI 自动生成片段建议写入 `source_type=AI_GENERATED` 并携带 `confidence`，供人工一键确认。

---

## 9. `sys_media_jobs`

### 表用途

异步任务表，承载抽帧、转码、OCR、切片推荐等任务回执。

### 关键字段说明

- `asset_id`：任务关联资源，可空（某些全局任务）。
- `job_type`：任务类型（THUMBNAIL/TRANSCODE/OCR/SEGMENT/AI_TAG）。
- `process_status`：任务状态。
- `retry_count`：已重试次数。
- `next_retry_at`：下次重试时间。
- `parent_job_id`：父任务ID，用于“任务流水线”编排（转码->抽帧->识别->生成摘要）。
- `payload_json/result_json`：输入输出上下文。
- `error_code/error_message`：失败信息。

### 约束与索引

- 索引 `idx_job_status`：任务调度轮询主索引。
- 索引 `idx_job_asset`：按资源追踪任务链路。

### 开发注意事项

- 任务失败不要静默，必须落状态并可重试。
- 建议配合告警规则监控 `FAIL` 增长趋势。
- 若启用断点续传，建议使用 `job_type=UPLOAD_SESSION` 记录会话状态，并把已上传分片清单放入 `payload_json/result_json`。
- AI 分析链式任务建议所有子任务都写 `parent_job_id`，便于追踪整条流水线。

---

## 10. `sys_media_annotations`

### 表用途

标签与特征占位表，用于承载 AI 分析产出（动作识别、器材检测、语音转文字）以及未来语义检索所需的向量数据。

### 关键字段说明

- `target_kind/target_id`：关联对象（ASSET/REGISTRY/SEGMENT）。
- `label_type`：标签来源类型（OCR/ASR/CV/MANUAL/AI_TAG）。
- `label_key`：标签键（如 equipment/action/keyword）。
- `label_value`：标签值，可存长文本或 Base64 特征。
- `confidence`：置信度（0-1）。
- `source_type`：生成来源（MANUAL/AI_GENERATED）。
- `embedding_base64/embedding_dim`：向量占位字段，用于后续语义搜索。
- `meta_json`：扩展结构，容纳不固定字段输出。

### 约束与索引

- `idx_annotation_target`：按对象快速查询全部标签/特征。
- `idx_annotation_key`：按标签键检索聚合。

### 开发注意事项

- 当前阶段仅做“预留位”，不强依赖具体向量库实现。
- 若未来接入向量库，可保留本表作为回溯与审计存档。

---

## 11. `sys_media_outbox_events`

### 表用途

Outbox 事件落盘表，用于把领域关键动作（引用增减、审核状态变更）可靠地交给后续自动化任务消费，避免业务代码与消费者强耦合。

### 关键字段说明

- `event_type`：事件类型，当前包括 `REFERENCE_CREATED`、`REFERENCE_DELETED`、`REGISTRY_REVIEW_STATUS_CHANGED`。
- `aggregate_type/aggregate_id`：事件归属聚合根（REFERENCE/REGISTRY + ID）。
- `payload_json`：事件载荷（上下文信息、状态迁移信息）。
- `status`：事件发布状态（`PENDING/PUBLISHED/FAILED`）。
- `retry_count`：重试次数，便于失败补偿策略。
- `available_at`：下次可消费时间，支持延迟重试。

### 约束与索引

- 索引 `idx_outbox_poll`：按租户/应用/状态/可消费时间拉取待处理事件。
- 索引 `idx_outbox_aggregate`：按聚合根追溯事件历史。

### 开发注意事项

- 业务变更与 Outbox 记录应同事务提交（真实持久层实现时必须保证）。
- 消费端建议采用“幂等键（event_id）+ 重试退避”，防止重复处理。
- 联调阶段可通过 `POST /v1/media/outbox/process` 触发一批消费；生产环境建议由独立 Worker 轮询数据库并更新 `status/available_at`。

---

## 12. 推荐核对清单（评审/联调）

- 是否所有业务查询都带 `tenant_id + app_id` 条件。
- 是否所有下载都经过权限校验与短时授权。
- 是否引用增删与 `ref_count` 在同事务处理。
- 是否为视频片段做了越界校验与失效处理。
- 是否为异步失败提供了可见、可重试入口。
