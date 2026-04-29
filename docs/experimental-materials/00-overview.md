# 实验材料平台总览

## 1. 目标

- 建立统一的实验材料主档，支持材料名称、用途、建议用量、家庭替代、安全说明等信息管理。
- 支持同学校、同班级、同课题组、同角色等多维度共享。
- 支持材料与图片、附件、视频资源的标准化关联和展示。
- 与现有教育维度矩阵（`edu_path_matrix`）和媒体中台（`edu_media_registry`）对齐。

## 2. 非目标

- 本阶段不实现向量检索与复杂 AI 推荐，仅预留扩展字段。
- 本阶段不在数据库层直接绑定用户主数据外键，避免跨系统耦合。

## 3. 核心设计

- 1 个主表：`edu_experimental_materials`。
- 3 个关键子表：
  - `edu_experimental_material_attribute_ext`
  - `edu_experimental_material_safety_link`
  - `edu_experimental_material_resource_link`
- N 个维表：类型、分类、安全标签，以及关联表（分类关联、适用范围关联、收藏、共享权限、实验关联）。

## 4. 与现有系统对齐

- 教育维度：适用范围不直接存文本，统一关联 `edu_path_matrix`。
- 媒体资源：材料资源统一关联 `edu_media_registry.id`，不重复造资源库。
- 权限模型：沿用 `subject_type + subject_key + permission_mask` 思路，与媒体中台策略一致。

## 5. 业务价值

- 左侧筛选可稳定支持学段/学科/年级组合过滤。
- 共享策略可覆盖“同课题组老师共享”“同学校共享”“同班级共享”。
- 可按槽位管理视频：材料介绍、适用实验、安全培训。
