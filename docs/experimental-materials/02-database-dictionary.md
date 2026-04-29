# 实验材料数据库字段字典

> 对应迁移：`0005_experimental_materials_init.sql`、`0006_experimental_materials_proxy_and_experiment_link.sql`、`0009_experimental_materials_school_stages_proxy.sql`、`0013_experimental_material_dimension_enhancements.sql`

## 1) edu_experimental_materials（主表）

- 用途：材料主档信息。
- 关键字段：
  - `tenant_id` / `app_id`：租户与应用隔离键。
  - `name`：材料名称，列表主展示字段。
  - `material_type_code`：材料类型编码，关联 `edu_experimental_material_types.code`。
  - `usage`：实验用途。
  - `suggested_amount`：建议用量。
  - `home_alternative`：家庭替代建议。
  - `safety_note`：安全补充说明（非结构化）。
  - `remark`：备注。
  - `category_name_proxy` / `safety_tags_proxy`（`0006`）：分类与安全标签 code 的逗号分隔冗余，与前端多选一致。
  - `school_stages_proxy`（`0009`）：适用学段 code 的逗号分隔冗余（`primary` / `junior` / `senior`），与前端「适用学段」多选一致。
  - `cover_registry_id`：封面资源登记 ID（关联 `edu_media_registry.id`）。
  - `status`：`ACTIVE/ARCHIVED`。
  - `version`：乐观锁版本。
  - `created_by_actor_id` / `updated_by_actor_id`：操作人。
  - `deleted_at`：软删时间。
- 索引建议：
  - `idx_em_list(tenant_id, app_id, status, updated_at)`
  - `idx_em_type(tenant_id, app_id, material_type_code)`
  - `idx_em_cover(tenant_id, app_id, cover_registry_id)`
  - 全文索引 `ft_em_search(name, usage, home_alternative, suggested_amount, safety_note, remark)`

## 2) edu_experimental_material_attribute_ext（子表一）

- 用途：低频和可变属性扩展。
- 字段说明：
  - `attr_key`：扩展字段名（例如 `unit`、`difficulty`、`is_consumable`）。
  - `value_type`：`STRING/NUMBER/BOOL/JSON`。
  - `attr_value`：扩展字段值（统一文本存储）。
- 约束：
  - 同材料同键唯一：`uk_em_attr_key(tenant_id, app_id, material_id, attr_key)`。

## 3) edu_experimental_material_safety_link（子表二）

- 用途：结构化安全标签关联。
- 字段说明：
  - `safety_tag_code`：关联 `edu_experimental_material_safety_tags.code`。
  - `sort_order`：标签排序。
- 约束：
  - 同材料同安全标签唯一：`uk_em_safety_link`。

## 4) edu_experimental_material_resource_link（子表三）

- 用途：材料与媒体资源登记关系。
- 字段说明：
  - `registry_id`：关联 `edu_media_registry.id`。
  - `slot_key`：资源槽位（封面/图集/附件/视频）。
  - `snapshot_json`：引用快照（可选）。
- 约束：
  - 同材料同资源同槽位唯一：`uk_em_resource_slot`。

## 5) edu_experimental_material_types（维表）

- 用途：材料类型字典（回答「材料在哪儿找 / 谁该准备」）。
- 核心字段：`code`（稳定键）、`name`（内部短名）、`display_name`（列表/筛选用可读说明，与 code 解耦）、`sort_order`、`status`。
- 接口：`GET /v1/experimental-materials/dimensions` 返回 `types[].displayName`（由 `display_name` 映射）。

## 6) edu_experimental_material_categories（维表）

- 用途：材料分类字典与类目树骨架。
- 核心字段：`code`、`name`、`subject_id`、`parent_code`（指向同表 `code`，子类展示）、`sort_order`、`status`。
- 说明：`subject_id` 对齐 `edu_subjects.id`，用于「化学药品」等仅在某学科出现的分类；材料主数据仍以 `edu_experimental_material_category_link` 与（兼容用的）`category_name_proxy` 写回，列表解析以 link 与维表为准。

## 7) edu_experimental_material_category_link（关联表）

- 用途：材料与分类多对多关系。
- 约束：同材料同分类唯一 `uk_em_category_link`。

## 8) edu_experimental_material_applicability（关联表）

- 用途：材料适用范围关联教育路径矩阵。
- 核心字段：`path_matrix_id`（关联 `edu_path_matrix.id`）。
- 约束：同材料同路径唯一 `uk_em_applicability`。

## 9) edu_experimental_material_safety_tags（维表）

- 用途：安全标签字典；`risk_level` 参与材料列表 SQL 聚合（`MAX` 序位），前端筛选「安全风险」与标红展示均以此为准，避免写死标签名推断。
- 核心字段：`code`、`name`、`risk_level`、`sort_order`、`status`。
- `risk_level` 取值：`none` / `low` / `medium` / `high`（表约束校验）。

## 10) edu_experimental_material_favorites（关联表）

- 用途：用户收藏材料。
- 核心字段：`material_id`、`actor_id`。
- 约束：同用户同材料唯一 `uk_em_favorite_user`。

## 11) edu_experimental_material_scopes（共享权限表）

- 用途：材料共享范围与权限控制。
- 核心字段：
  - `subject_type`：`ORG/SCHOOL/CLASS/GROUP/ROLE/USER/EXTERNAL`
  - `subject_key`：主体键
  - `permission_mask`：位掩码（示例：查看1、编辑2、管理4、分享8）
  - `expires_at`：授权到期时间
- 约束：同材料同主体授权唯一 `uk_em_scope_subject`。

## 12) edu_experimental_material_experiment_link（关联表）

- 用途：材料与实验关系。
- 核心字段：
  - `experiment_id`：实验主键（业务系统 ID）
  - `relation_type`：`REQUIRED/OPTIONAL/SUBSTITUTE`
  - `note`：说明文本
- 约束：同材料同实验同关系唯一 `uk_em_experiment_link`。
