# 实验名称库 · 迁移与执行手册

## 1. 迁移文件

- `database/migrations/0007_standard_experiment_library_init.sql`（含 `edu_standard_experiment_grade_scope`）
- `database/migrations/0010_standard_experiment_grade_scope_legacy_upgrade.sql`（**仅**从含 `min_grade_id` 的旧库升级时执行，见文件头注释）

## 2. 建议执行顺序

在以下脚本之后执行。**硬依赖**：`0002`（`edu_stages` / `edu_subjects` / `edu_grades`）、`0005`（`edu_experimental_materials`，材料边外键）。**`0004`（媒体登记）**：当前 `0007` 对官方视频与推荐媒体仅做逻辑关联，**不建指向 `edu_media_registry` 的外键**，故未跑 `0004` 也可建全表；若需库级引用完整性，可在媒体表就绪后自行 `ALTER TABLE` 补外键。

1. `0001_init.sql`
2. `0002_edu_dimensions.sql`
3. `0003_edu_dimensions_seed.sql`
4. `0004_media_platform_init.sql`
5. `0005_experimental_materials_init.sql`（及同批次媒体相关增量）
6. `0006_*`（若环境已执行）
7. **`0007_standard_experiment_library_init.sql`**
8. **`0008_standard_experiment_library_seed.sql`**（可选种子）
9. 若数据库曾在旧版 `0007` 下创建且仍含 `min_grade_id`：**补跑** `0010_standard_experiment_grade_scope_legacy_upgrade.sql`

## 3. 执行示例（MySQL 8）

```bash
mysql -h HOST -u USER -p DB_NAME < database/migrations/0007_standard_experiment_library_init.sql
```

## 4. 结构验证

```sql
SHOW TABLES LIKE 'edu_standard_experiment%';
```

```sql
SHOW CREATE TABLE edu_standard_experiments\G
SHOW CREATE TABLE edu_standard_experiment_chapter_edges\G
```

## 5. 索引与约束抽检

```sql
SHOW INDEX FROM edu_standard_experiments;
SHOW INDEX FROM edu_standard_experiment_chapter_edges;
SHOW INDEX FROM edu_standard_experiment_material_edges;
SHOW INDEX FROM edu_standard_experiment_media_edges;
```

## 6. 常见问题：只创建了 `edu_standard_experiment_categories`

**原因**：第二条 `CREATE`（Core）或后续表失败时，客户端常只显示第一条成功。最常见是 **库中尚无 `edu_media_registry`**（未执行 `0004`），旧版脚本对 `official_video_registry_id` / 媒体边使用了硬外键，导致整段脚本中断。

**当前脚本**：已对 `official_video_registry_id`、`textbook_edition_id`（章节边）、推荐媒体边的 `registry_id` 使用**索引 + 逻辑关联**，不再强制要求 `0004` 已执行即可建全表。仍须保证 **`0002` 已执行**（存在 `edu_stages` / `edu_subjects` / `edu_grades`），材料边须 **`0005` 已执行**（存在 `edu_experimental_materials`）。

**自检**：

```sql
SHOW TABLES LIKE 'edu_stages';
SHOW TABLES LIKE 'edu_media_registry';
SHOW TABLES LIKE 'edu_experimental_materials';
```

修复后请**重新执行** `0007_standard_experiment_library_init.sql`（`CREATE IF NOT EXISTS` 会跳过已存在的维表，并补齐其余表）。

**3823（CHECK 与外键同列）**：历史问题记录；当前 Core 已移除 `min_grade_id` / `max_grade_id`，适用年级以映射表为真源，校验见 `04-grade-scope-model.md`。

## 7. 回滚建议

- **测试环境**：按依赖逆序 `DROP TABLE`（先边表、再 Core、再维表），注意外键顺序。
- **生产环境**：优先保留表结构，通过功能开关停用写入；避免随意 DROP。

## 8. 执行记录（本地）

| 日期 | 环境 | 结果 | 备注 |
|------|------|------|------|
| 2026-04-19 | 目标库 | 成功 | `0007_standard_experiment_library_init.sql` 已执行，五张表均已创建 |

> 验证命令见第 3～5 节；若库名与实例与上表不同，可在备注中自行补充。
