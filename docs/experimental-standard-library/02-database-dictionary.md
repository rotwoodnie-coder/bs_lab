# 实验名称库 · 数据库字段字典

> DDL 真源：`database/migrations/0007_standard_experiment_library_init.sql`  
> 指纹与幂等：`01-fingerprint-and-idempotency-v1.md`  
> 适用年级映射：`04-grade-scope-model.md`

## 枚举约定

| 域 | 取值 | 说明 |
|----|------|------|
| `source_type`（边表） | `OFFICIAL` |教研或系统预置 |
| | `CROWDSOURCED` | 教师实践回流 |
| `review_status`（边表） | `PENDING` | 待审核 |
| | `APPROVED` | 已通过，可参与默认推荐 |
| | `REJECTED` | 已驳回 |
| Core `status` | `1` | 启用 |
| | `0` | 停用 |
| 维表 `status` | `1` / `0` | 同 Core，启用/停用 |

---

## 1. `edu_standard_experiment_categories`（实验类型维表）

**用途**：实验分类（观察、探究、验证等），可按租户扩展；与 Core 的 `exp_category_id` 关联。

**约束与索引**

- `uk_sel_cat_code`：`UNIQUE(tenant_id, app_id, code)`，同租户应用下类型编码唯一。
- `idx_sel_cat_list`：`(tenant_id, app_id, status, sort_order)`，列表与下拉。

| 列名 | 类型 | 可空 | 默认 | 说明 |
|------|------|------|------|------|
| `id` | BIGINT UNSIGNED | 否 | 自增 | 主键 |
| `tenant_id` | VARCHAR(64) | 否 | — | 租户隔离，与材料/媒体一致 |
| `app_id` | VARCHAR(64) | 否 | — | 应用隔离 |
| `code` | VARCHAR(64) | 否 | — | 业务稳定编码，大写+下划线风格 |
| `name` | VARCHAR(128) | 否 | — | 展示名称 |
| `description` | TEXT | 是 | NULL | 类型说明（教学法、适用场景等） |
| `sort_order` | INT | 否 | 0 | 排序，越小越靠前 |
| `status` | TINYINT | 否 | 1 | 1启用，0 停用 |
| `created_at` | DATETIME | 否 | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | DATETIME | 否 | ON UPDATE | 更新时间 |

---

## 2. `edu_standard_experiments`（Core Node）

**用途**：标准实验锚点；白名单字段仅允许教研工单修改（应用层）。

**约束与索引**

- `uk_sel_exp_fingerprint`：`UNIQUE(tenant_id, app_id, stage_id, subject_id, name_fingerprint)`，防同名变体重复入库。
- `uk_sel_exp_code`：`UNIQUE(tenant_id, app_id, standard_code)`，业务编码唯一。
- `fk_sel_exp_stage` / `subject` / `category`：外键见迁移脚本。
- **适用年级**：以子表 `edu_standard_experiment_grade_scope` 为真源（见下文第 2b 节），不再使用 `min_grade_id` / `max_grade_id`。
- `official_video_registry_id`：**逻辑关联** `edu_media_registry.id`，迁移中仅建索引 `idx_sel_exp_official_vid`，不设库外键（避免未跑 `0004` 时无法建表；生产可在媒体表就绪后按需 `ALTER TABLE` 补外键）。
- `idx_sel_exp_query`：`(tenant_id, app_id, stage_id, subject_id, status)`，筛选列表。

| 列名 | 类型 | 可空 | 默认 | 说明 |
|------|------|------|------|------|
| `id` | BIGINT UNSIGNED | 否 | 自增 | 主键 |
| `tenant_id` | VARCHAR(64) | 否 | — | 租户 |
| `app_id` | VARCHAR(64) | 否 | — | 应用 |
| `standard_code` | VARCHAR(64) | 否 | — | 对外稳定业务编码 |
| `display_name` | VARCHAR(255) | 否 | — | 规范展示名（可读） |
| `name_fingerprint` | VARCHAR(64) | 否 | — | 规范名指纹（SHA-256 十六进制） |
| `fingerprint_version` | TINYINT UNSIGNED | 否 | 1 | 指纹算法版本 |
| `stage_id` | BIGINT UNSIGNED | 否 | — | 学段，关联 `edu_stages.id` |
| `subject_id` | BIGINT UNSIGNED | 否 | — | 主学科，关联 `edu_subjects.id` |
| `is_mandatory` | TINYINT | 否 | 0 | 1 必做，0 选做 |
| `exp_category_id` | BIGINT UNSIGNED | 否 | — | 实验类型，关联本维表 `id` |
| `official_video_registry_id` | BIGINT UNSIGNED | 是 | NULL | 官方视频，关联 `edu_media_registry.id` |
| `created_by_actor_id` | VARCHAR(128) | 是 | NULL | 创建人 actor |
| `updated_by_actor_id` | VARCHAR(128) | 是 | NULL | 最后修改人 actor |
| `status` | TINYINT | 否 | 1 | 启用/停用 |
| `created_at` | DATETIME | 否 | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | DATETIME | 否 | ON UPDATE | 更新时间 |
| `deleted_at` | DATETIME | 是 | NULL | 软删时间 |

---

## 2b. `edu_standard_experiment_grade_scope`（适用年级映射）

**用途**：标准实验与适用年级多对多真源；支持非连续年级。

**约束与索引**

- `uk_sel_exp_grade_scope`：`UNIQUE(tenant_id, app_id, standard_experiment_id, grade_id)`。
- `fk_sel_exp_grade_scope_exp` → `edu_standard_experiments`，`ON DELETE CASCADE`。
- `fk_sel_exp_grade_scope_grade` → `edu_grades`。
- 详见 `04-grade-scope-model.md`。

| 列名 | 类型 | 可空 | 默认 | 说明 |
|------|------|------|------|------|
| `id` | BIGINT UNSIGNED | 否 | 自增 | 主键 |
| `tenant_id` | VARCHAR(64) | 否 | — | 租户 |
| `app_id` | VARCHAR(64) | 否 | — | 应用 |
| `standard_experiment_id` | BIGINT UNSIGNED | 否 | — | 关联 Core |
| `grade_id` | BIGINT UNSIGNED | 否 | — | 关联 `edu_grades.id` |
| `sort_order` | INT | 否 | 0 | 冗余年级排序，便于展示 |
| `created_at` | DATETIME | 否 | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | DATETIME | 否 | ON UPDATE | 更新时间 |

---

## 3. `edu_standard_experiment_chapter_edges`（章节映射边）

**用途**：标准实验与教材章节的映射；教材主表未落地时 `textbook_id`/`chapter_id` 为预留业务 ID，无指向教材表的外键。

**约束与索引**

- `uk_sel_ch_edge_idem`：`UNIQUE(tenant_id, app_id, idempotency_key)`；业务去重以幂等键为准（含 edition 的拼接规则见 `01`文档）。
- `idx_sel_ch_exp`：`(tenant_id, app_id, standard_experiment_id, review_status)`。
- `idx_sel_ch_lookup`：`(tenant_id, app_id, textbook_id, chapter_id)`，按章节反查实验（可选）。
- `textbook_edition_id`：**逻辑关联** `edu_editions.id`，不设库外键；索引 `idx_sel_ch_edition`。

| 列名 | 类型 | 可空 | 默认 | 说明 |
|------|------|------|------|------|
| `id` | BIGINT UNSIGNED | 否 | 自增 | 主键 |
| `tenant_id` | VARCHAR(64) | 否 | — | 租户 |
| `app_id` | VARCHAR(64) | 否 | — | 应用 |
| `standard_experiment_id` | BIGINT UNSIGNED | 否 | — | 关联 Core `id` |
| `textbook_id` | BIGINT UNSIGNED | 否 | — | 教材业务 ID（预留） |
| `textbook_edition_id` | BIGINT UNSIGNED | 是 | NULL | 教材版本，可关联 `edu_editions.id` |
| `chapter_id` | BIGINT UNSIGNED | 否 | — | 章节业务 ID（预留） |
| `source_type` | VARCHAR(32) | 否 | — | `OFFICIAL` / `CROWDSOURCED` |
| `review_status` | VARCHAR(32) | 否 | `PENDING` | 审核状态 |
| `source_actor_id` | VARCHAR(128) | 是 | NULL | 首位或主要贡献者 actor |
| `idempotency_key` | VARCHAR(64) | 否 | — | 幂等键（见规范文档） |
| `evidence_count` | INT UNSIGNED | 否 | 0 | 引用/证据次数 |
| `support_teacher_count` | INT UNSIGNED | 否 | 0 | 去重教师数等（应用回写） |
| `weight_score` | INT | 否 | 0 | 综合权重，便于排序 |
| `sort_order` | INT | 否 | 0 | 同状态内展示顺序 |
| `reject_reason` | TEXT | 是 | NULL | 驳回原因 |
| `reviewed_by` | VARCHAR(128) | 是 | NULL | 审核人 |
| `reviewed_at` | DATETIME | 是 | NULL | 审核时间 |
| `created_at` | DATETIME | 否 | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | DATETIME | 否 | ON UPDATE | 更新时间 |

---

## 4. `edu_standard_experiment_material_edges`（材料清单边）

**用途**：标准实验的推荐材料与建议用量；转正后可作为排课/备课默认 BOM 推荐，与材料主表 `edu_experimental_materials` 对齐。

**约束与索引**

- `uk_sel_mat_edge_idem`：`UNIQUE(tenant_id, app_id, idempotency_key)`。
- `idx_sel_mat_exp`：`(tenant_id, app_id, standard_experiment_id, review_status)`。

| 列名 | 类型 | 可空 | 默认 | 说明 |
|------|------|------|------|------|
| `id` | BIGINT UNSIGNED | 否 | 自增 | 主键 |
| `tenant_id` | VARCHAR(64) | 否 | — | 租户 |
| `app_id` | VARCHAR(64) | 否 | — | 应用 |
| `standard_experiment_id` | BIGINT UNSIGNED | 否 | — | 关联 Core |
| `material_id` | BIGINT UNSIGNED | 否 | — | 关联 `edu_experimental_materials.id` |
| `standard_qty` | DECIMAL(12,4) | 否 | — | 建议用量数值 |
| `qty_unit` | VARCHAR(32) | 否 | — | 单位（根、套、mL 等），参与幂等 |
| `source_type` | VARCHAR(32) | 否 | — | 来源类型 |
| `review_status` | VARCHAR(32) | 否 | `PENDING` | 审核状态 |
| `source_actor_id` | VARCHAR(128) | 是 | NULL | 贡献者 |
| `idempotency_key` | VARCHAR(64) | 否 | — | 幂等键 |
| `evidence_count` | INT UNSIGNED | 否 | 0 | 证据次数 |
| `support_teacher_count` | INT UNSIGNED | 否 | 0 | 去重教师数 |
| `weight_score` | INT | 否 | 0 | 权重 |
| `sort_order` | INT | 否 | 0 | 排序 |
| `reject_reason` | TEXT | 是 | NULL | 驳回原因 |
| `reviewed_by` | VARCHAR(128) | 是 | NULL | 审核人 |
| `reviewed_at` | DATETIME | 是 | NULL | 审核时间 |
| `created_at` | DATETIME | 否 | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | DATETIME | 否 | ON UPDATE | 更新时间 |

---

## 5. `edu_standard_experiment_media_edges`（推荐媒体边）

**用途**：推荐教学视频、课件等媒体；**不**覆盖 Core 的 `official_video_registry_id`。`registry_id` **逻辑关联** `edu_media_registry.id`，迁移中不设指向媒体表的外键（与 Core 官方视频字段策略一致）；应用层须校验登记存在且租户一致。

**约束与索引**

- `uk_sel_med_edge_idem`：`UNIQUE(tenant_id, app_id, idempotency_key)`。
- `idx_sel_med_exp`：`(tenant_id, app_id, standard_experiment_id, review_status)`。

| 列名 | 类型 | 可空 | 默认 | 说明 |
|------|------|------|------|------|
| `id` | BIGINT UNSIGNED | 否 | 自增 | 主键 |
| `tenant_id` | VARCHAR(64) | 否 | — | 租户 |
| `app_id` | VARCHAR(64) | 否 | — | 应用 |
| `standard_experiment_id` | BIGINT UNSIGNED | 否 | — | 关联 Core |
| `registry_id` | BIGINT UNSIGNED | 否 | — | 关联 `edu_media_registry.id` |
| `media_kind` | VARCHAR(32) | 否 | — | `VIDEO`、`DOC`、`PPT` 等 |
| `source_type` | VARCHAR(32) | 否 | — | 来源类型 |
| `review_status` | VARCHAR(32) | 否 | `PENDING` | 审核状态 |
| `source_actor_id` | VARCHAR(128) | 是 | NULL | 贡献者 |
| `idempotency_key` | VARCHAR(64) | 否 | — | 幂等键 |
| `evidence_count` | INT UNSIGNED | 否 | 0 | 证据次数 |
| `support_teacher_count` | INT UNSIGNED | 否 | 0 | 去重教师数 |
| `weight_score` | INT | 否 | 0 | 权重 |
| `sort_order` | INT | 否 | 0 | 排序 |
| `reject_reason` | TEXT | 是 | NULL | 驳回原因 |
| `reviewed_by` | VARCHAR(128) | 是 | NULL | 审核人 |
| `reviewed_at` | DATETIME | 是 | NULL | 审核时间 |
| `created_at` | DATETIME | 否 | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | DATETIME | 否 | ON UPDATE | 更新时间 |
