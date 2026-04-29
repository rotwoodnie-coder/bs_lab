# 实验名称库（标准实验 / 知识锚点）总览

## 1. 目标与非目标

**目标**

- 在行政与学科维度上为「标准实验」建立**稳定可引用的核心节点（Core Node）**，为教师备课与实验课程提供统一锚点。
- 通过**边表（Edge）**沉淀教学实践中的章节映射、推荐材料清单、推荐媒体等资源；支持众筹贡献与教研审核晋升。
- 与现有**实验材料平台**（`edu_experimental_materials` 等）及**媒体登记**（`edu_media_registry`）衔接：标准实验引用材料与官方视频，推荐资源通过边扩展，不破坏核心白名单。

**非目标（首期）**

- 不替代「课程实例」中的实耗记录与班级执行数据；课程侧私有数据仍留在教学域。
- 不在本模块内实现完整图数据库查询引擎；关系型表即图的物理存储。
- 教材目录主数据表若尚未落地，章节边仅保存预留 ID，不在首期添加指向教材表的外键。

## 2. 核心语义：Core 与 Edge

| 层次 | 语义 | 变更原则 |
|------|------|----------|
| Core Node | 实验在体系中的「身份证」：编码、规范展示名、指纹、学段学科、适用年级（映射表）、必做/选做、实验类型、官方视频锚点 | **禁止**由课程保存流程异步回写；**仅允许**具备教研管理权限的账号通过「教研变更工单」修改（应用层 enforcement） |
| Edge | 教学实践中的「血肉」：章节映射、推荐 BOM、推荐视频/课件等 | 引用可触发 **Upsert 候选边**；教研**转正**只更新边的 `review_status` 等，**不替换** Core 上 `official_video_registry_id` |

## 3. 数据闭环（三态）

1. **私有态**：教师仅在某一课程实例中关联章节或上传资源，数据默认只在该教学上下文中可见（不落标准边或由产品策略决定）。
2. **待审态**：系统根据规则写入边记录：`source_type = CROWDSOURCED`，`review_status = PENDING`，并通过 `idempotency_key` 去重，避免重复保存产生垃圾边。
3. **标准态（推荐态）**：教研将边审为 `APPROVED` 后，该边进入「默认推荐」集合（排序由 `sort_order` / `weight_score` 等支撑）；**不修改** Core 白名单字段。

## 4. 物理表一览

| 表名 | 角色 |
|------|------|
| `edu_standard_experiment_categories` | 实验类型维表 |
| `edu_standard_experiments` | Core Node |
| `edu_standard_experiment_grade_scope` | 适用年级映射（多对多真源） |
| `edu_standard_experiment_chapter_edges` | 章节映射边 |
| `edu_standard_experiment_material_edges` | 材料建议清单边 |
| `edu_standard_experiment_media_edges` | 推荐媒体边 |

DDL 真源：`database/migrations/0007_standard_experiment_library_init.sql`。逐字段说明见 `02-database-dictionary.md`。

## 5. 控制台教学维度快照（V2 主库）

控制台「教学架构 / 学科年级」页与标准实验目录页的年级范围、架构树筛选，依赖 Next BFF **`GET /api/edu/dimensions`**（`frontend/src/app/api/edu/`），与主库 **`data_school_level`、`data_school_grade`、`data_school_subject`、`data_school_grade_subject`**（迁移 **`0024_v2_full_schema_init.sql`**）对齐。

- **前端快照类型**：`SchoolDimensionSnapshot`（见 `frontend/.../subject-grades/page.types.ts`），含 `levels`、`subjects`、`grades`、`levelSubjects`、`levelGrades`、`gradeSubjectMatrix`；学段键字段为 **`levelId`**，学段×学科关联键为 **`linkKey`**（`` `${levelId}:${subjectId}` ``），矩阵行启用为 **`lineActive`（0/1）**。
- **与目录 API 的命名**：`/v1/experiment-catalog` 返回的 `CatalogCore` 等仍可使用字段名 **`stageId`** 表示学段业务键，其取值应与快照中的 **`levelId`**（即 `data_school_level.level_id`）一致。

## 6. 关联文档

- `01-fingerprint-and-idempotency-v1.md`：规范名指纹与边幂等键规则（v1）。
- `04-grade-scope-model.md`：适用年级映射表与升级说明。
- `03-migrations-and-runbook.md`：迁移执行与验证。
- `05-api-contract-catalog-http.md`：控制台标准实验目录 HTTP 契约（含 `dimension-gaps` 与详情 LEFT JOIN 说明）。教学维度 enrich 见上文 §5。
