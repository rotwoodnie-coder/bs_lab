# 实验材料 SQL 迁移与种子执行手册

## 1. 迁移文件

- `database/migrations/0005_experimental_materials_init.sql`

## 2. 执行顺序

1. `0001_init.sql`
2. `0002_edu_dimensions.sql`
3. `0003_edu_dimensions_seed.sql`
4. `0004_media_platform_init.sql`
5. `0005_experimental_materials_init.sql`

## 3. 前置检查

- MySQL 8.x，字符集 utf8mb4。
- 确认 `edu_path_matrix` 与 `edu_media_registry` 已存在。
- 确认生产窗口与备份策略。

## 4. 种子策略

建议在 `0005` 内一并初始化：

- `edu_experimental_material_types`
- `edu_experimental_material_categories`
- `edu_experimental_material_safety_tags`

要求：

- 使用 `ON DUPLICATE KEY UPDATE`，支持重复执行。
- 编码值与前端常量保持一致。

## 5. 结构验证 SQL

```sql
SHOW TABLES LIKE 'edu_experimental_materials';
SHOW TABLES LIKE 'edu_experimental_material_scopes';
SHOW TABLES LIKE 'edu_experimental_material_resource_link';
SHOW TABLES LIKE 'edu_experimental_material_applicability';
SHOW TABLES LIKE 'edu_experimental_material_experiment_link';
```

```sql
SHOW INDEX FROM edu_experimental_materials;
SHOW INDEX FROM edu_experimental_material_scopes;
SHOW INDEX FROM edu_experimental_material_resource_link;
```

## 6. 冒烟验证建议

1. 创建材料主档。
2. 绑定分类、适用路径、安全标签。
3. 绑定一个 `material_intro_video` 资源。
4. 新增 `GROUP` 与 `SCHOOL` 两条 scope 授权。
5. 通过主体命中查询验证可见性。

## 7. 回滚建议

- 测试环境：可直接按依赖逆序 DROP 新增表。
- 生产环境：不建议直接 DROP；优先回切应用开关并保留表结构。
