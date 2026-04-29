# 实验材料领域模型

## 1. 主体结构

- 主表 `edu_experimental_materials`：承载材料核心信息。
- 子表 `edu_experimental_material_attribute_ext`：承载可变扩展属性。
- 子表 `edu_experimental_material_safety_link`：承载结构化安全标签。
- 子表 `edu_experimental_material_resource_link`：承载图片/附件/视频关联。

## 2. 维度结构

- `edu_experimental_material_types`：材料属性维度。
- `edu_experimental_material_categories`：材料分类维度。
- `edu_experimental_material_safety_tags`：安全标签维度。

## 3. 关联结构

- `edu_experimental_material_category_link`：材料-分类多对多。
- `edu_experimental_material_applicability`：材料-教育路径矩阵多对多。
- `edu_experimental_material_favorites`：材料收藏。
- `edu_experimental_material_scopes`：材料共享权限范围。
- `edu_experimental_material_experiment_link`：材料-实验关联。

## 4. 关键关系说明

- 一个材料可关联多个分类、多个适用路径、多个安全标签、多个资源。
- 一个材料可被多个共享主体授权（学校/班级/课题组/角色/用户）。
- 一个材料可关联多个实验，一个实验可关联多个材料。

## 5. 资源槽位规范

`edu_experimental_material_resource_link.slot_key` 建议固定取值：

- `cover`：封面图
- `gallery`：图集
- `attachment`：附件文档
- `material_intro_video`：材料介绍视频
- `experiment_demo_video`：适用实验视频
- `safety_training_video`：安全培训视频

业务约束：

- `*_video` 槽位必须绑定媒体类型为 `VIDEO` 的资源。
- 同一材料同一槽位可多条，使用 `sort_order` 决定展示顺序。
