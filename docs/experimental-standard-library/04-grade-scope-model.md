# 标准实验 · 适用年级映射模型（设计说明）

> **DDL 真源**：`database/migrations/0007_standard_experiment_library_init.sql`（表 `edu_standard_experiment_grade_scope`）  
> **旧库升级**：`database/migrations/0010_standard_experiment_grade_scope_legacy_upgrade.sql`（仅当 Core 表仍存在 `min_grade_id` / `max_grade_id` 时执行）

## 1. 背景与问题

原先在 `edu_standard_experiments` 上使用 `min_grade_id` / `max_grade_id` 表示「适用年级闭区间」，隐含假设：

- 年级在 `edu_grades.sort_order` 上**线性有序**；
- 适用集合**必为连续区间**。

局限：无法表达「仅三年级与五年级」等非连续集合；与 `edu_path_matrix`（学段 × 学科 × 年级 × 版本）对齐时，区间语义也不如**显式枚举年级**清晰。

## 2. 目标

1. **数据库真源**：以多行映射表表达「某标准实验适用于哪些 `edu_grades`」。
2. **支持非连续**：一行一个 `grade_id`，无「必须连续」约束。
3. **与路径矩阵一致**：应用层写入前校验：若 `(stage_id, subject_id)` 在 `edu_path_matrix` 中存在启用行，则每个 `grade_id` 必须落在该矩阵中；若该组合在矩阵中**无任何启用行**，则退化为仅校验年级存在（与种子迁移逻辑一致，避免空矩阵环境无法写入）。
4. **兼容升级**：已部署旧版 DDL 的环境，通过 `0010` 存储过程一次性展开旧区间并删除两列。

## 3. 表设计：`edu_standard_experiment_grade_scope`

| 列名 | 类型 | 可空 | 说明 |
|------|------|------|------|
| `id` | BIGINT UNSIGNED | 否 | 自增主键 |
| `tenant_id` | VARCHAR(64) | 否 | 租户隔离，与 Core 一致 |
| `app_id` | VARCHAR(64) | 否 | 应用隔离 |
| `standard_experiment_id` | BIGINT UNSIGNED | 否 | FK → `edu_standard_experiments.id`，级联删除 |
| `grade_id` | BIGINT UNSIGNED | 否 | FK → `edu_grades.id` |
| `sort_order` | INT | 否 | 冗余 `edu_grades.sort_order`，插入时写入，便于列表 `GROUP_CONCAT` 排序 |
| `created_at` / `updated_at` | DATETIME | 否 | 审计 |

**约束与索引**

- `UNIQUE uk_sel_exp_grade_scope`：`(`tenant_id`, `app_id`, `standard_experiment_id`, `grade_id`)` — 同一实验下年级不重复。
- `KEY idx_sel_exp_grade_by_grade`：按年级反查实验（控制台筛选扩展用）。
- `KEY idx_sel_exp_grade_by_exp`：按实验加载全部适用年级。

**与 Core 的关系**

- Core 行不再包含 `min_grade_id` / `max_grade_id`。
- 删除 Core（硬删或未来物理删）时，映射行随 `ON DELETE CASCADE` 清除。

## 4. Core 表变更摘要

从 `edu_standard_experiments` **移除**：

- 列：`min_grade_id`、`max_grade_id`
- 外键：`fk_sel_exp_min_grade`、`fk_sel_exp_max_grade`

其余业务字段（`standard_code`、`display_name`、指纹、`stage_id`、`subject_id`、`is_mandatory` 等）不变。

## 5. 读模型与 API

### 5.1 列表 / 详情查询

通过子查询聚合（避免 N+1）：

- `grade_scope_ids_csv`：`GROUP_CONCAT(g.id ORDER BY g.sort_order)`；
- `grade_scope_first_name` / `grade_scope_last_name`：按 `sort_order` 的首末年级名，供列表「×～×」简写（**非连续**时 UI 可改为顿号枚举，真源仍以 `grade_ids` 数组为准）。

### 5.2 写入

- **创建**：`INSERT` Core 后，在同一请求内调用 `replaceCatalogGradeScope`：先 `DELETE` 该实验下全部映射，再批量 `INSERT` 选中年级（带 `sort_order`）。
- **更新**：
  - 若请求体包含 `gradeIds`，则按新列表替换；
  - 若仅修改 `stage_id` / `subject_id` 而未带 `gradeIds`，则对**现有** `gradeIds` 在新学段学科下重新校验并写回（避免脏数据）。

### 5.3 错误码（应用层）

| `Error#message` | HTTP | 说明 |
|-----------------|------|------|
| `GRADE_SCOPE_EMPTY` | 422 | 未选择任何年级 |
| `GRADE_NOT_ON_PATH_MATRIX` | 422 | 某年级不在当前学段+学科的路径矩阵中 |

## 6. 前端约定

- 控制台「新建 / 编辑标准实验」：使用多选勾选当前 **学段（`level_id`）+ 学科** 下 `eligibleGradeIdsForCatalog`（实现见 `frontend/.../experiments/catalog-eligible-grades.ts`）。**教学维度快照**类型为 `SchoolDimensionSnapshot`（`subject-grades/page.types.ts`）：优先以聚合字段 **`gradeSubjectMatrix`**（对应 `data_school_grade_subject` + 解析出的学段键）中 `lineActive === 1` 的行推导可选年级；若无矩阵事实行，则退化为 **`levelGrades`** 中当前学段下已启用年级。
- 列表「适用年级」列：`formatCatalogGradeRange` 优先使用接口首末名；否则按快照中的 `grades`（`gradeId` / `gradeName`）解析 `gradeIds`。
- **与目录 API 字段名**：`CatalogCore` 等目录接口仍可能使用 **`stageId`** 表示「学段业务键」，其取值应与快照中的 **`levelId`**（`data_school_level.level_id`）一致。

## 7. 数据迁移与种子

- **全新安装**：执行更新后的 `0007` + `0008`（Core 无 min/max，`0008` 在 `2b` 节写入三至五年级映射）。
- **旧库**：执行 `0010`（检测 `min_grade_id` 列是否存在；存在则展开区间写入映射并删列）。**勿**在已是新结构的环境重复执行删列语句。

### 7.1 旧区间展开规则（0010）

对每条 Core：`g.sort_order` 落在 `[min.sort_order, max.sort_order]` 且 `g.status=1` 的年级；若 `(stage_id, subject_id)` 在 `edu_path_matrix` 有启用行，则仅保留矩阵中出现的 `(stage, subject, grade)`；若该组合在矩阵中**零行**，则退化为不按矩阵过滤（与历史数据兼容）。

## 8. 与指纹 / 唯一约束

`uk_sel_exp_fingerprint` 仍为 `(tenant_id, app_id, stage_id, subject_id, name_fingerprint)`：**适用年级集合不参与同名指纹唯一**，避免「同名校不同年级」被误拆成多条 Core。若产品未来要求年级进指纹，需另开版本说明与迁移。

## 9. 运维注意

- `GROUP_CONCAT` 默认 `group_concat_max_len`（1024）在年级数量极少场景足够；若未来单实验绑定大量自定义年级，需在会话中调大该变量或改为 JSON 聚合。

## 10. 升级脚本 `0010` 常见问题

### 10.1 执行了但主表仍有 `min_grade_id` / `max_grade_id`（结构「完全没变」）

常见原因：**执行脚本时会话未 `USE` 到存放业务表的数据库**。过程体内用 `TABLE_SCHEMA = DATABASE()` 检测旧列；若 `DATABASE()` 为 `NULL`，`COUNT(*)` 为 0，**整段 `IF v_legacy > 0` 静默跳过**，不会报错，主表自然不变。

处理：先 `USE 你的库名;`，再执行 `0010`；脚本末尾带有自检 `SELECT`（`min_grade_column_still_exists_should_be_0` 成功时应为 0）。仓库内过程体已对「未选库」增加 `SIGNAL` 报错（避免再次静默跳过）。

其它需核对：物理表名须为 **`edu_standard_experiments`**（与 `information_schema` 一致）；在**与 GUI 查看结构相同的实例与库**上执行。

### 10.1.1 错误 `1091 - Can't DROP 'fk_sel_exp_min_grade'`

表示库里**并不存在**名为 `fk_sel_exp_min_grade` 的外键约束。常见原因：表由手工或其它脚本创建、InnoDB 自动生成过 `*_ibfk_*` 名称、或曾部分删过约束。迁移脚本**不得**写死约束名；应查询 `information_schema.KEY_COLUMN_USAGE` 中绑定在 `min_grade_id` / `max_grade_id` 上的 `CONSTRAINT_NAME` 再逐个 `DROP FOREIGN KEY`。请使用仓库中已更新的 `0010` 后重新 `CALL`（`INSERT IGNORE` 可重复执行）。

### 10.2 长时间不结束

1. **优先查元数据锁（MDL）**：`ALTER TABLE ... DROP COLUMN` 需要 `edu_standard_experiments` 的 **MDL 独占锁**。任意其它会话对该表未结束的查询/事务、或 GUI 长时间打开的表数据预览，都会让本脚本卡在 `Waiting for table metadata lock`。处理：断开应用、结束未提交事务、关闭占用该表的客户端查询后重试；可用 `performance_schema.metadata_locks` 与 `SHOW PROCESSLIST` 定位阻塞方。  
2. **旧版 INSERT 性能**：若 `0010` 内曾使用对 `edu_path_matrix` 的相关子查询，在「实验行数 × 区间内年级数」较大时会极慢。当前仓库脚本已改为 **LEFT JOIN** 写法以降低扫描次数；若你本地仍是旧脚本，请拉取最新 `0010` 后再执行。  
3. **CREATE TABLE 带外键**：新建 `edu_standard_experiment_grade_scope` 且含指向 Core 的外键时，也会对父表申请 MDL，与第 1 条叠加后更容易表现为「一直执行」。
