# 标准实验目录 HTTP 契约（控制台 `/v1/experiment-catalog`）

## 1. 通用约定

- **前缀**：`/v1/experiment-catalog`
- **请求头**（与实现一致）：
  - `x-role`：`teacher` | `researcher` | `district_admin` | `super_admin` | …
  - `x-user-id`、`x-user-name`（可选 URL 编码）、`x-org-id`（组织树节点，**不等于**目录库 `tenant_id`）
  - `x-tenant-id`：`edu_standard_experiments.tenant_id`（种子多为 `district-001`）；未传时后端默认 `district-001`（或环境变量 `EXPERIMENT_CATALOG_DEFAULT_TENANT_ID` / `SEED_TENANT_ID`），**不再回退到 `x-org-id`**，避免列表与详情租户不一致。
  - `x-app-id`：默认 `console`
- **响应包络**：`{ success, data, error }`；错误时 `error.code` / `error.message`。

权限键见后端 `permissions.ts`：`experiment-catalog:read` / `manage` / `contribute` / `review` 等。

## 2. 实验类型（分类）

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/categories` | read | 列表 |
| POST | `/categories` | manage | 新建 |

## 3. 标准实验 Core

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/experiments` | read | 分页列表；`page`、`pageSize`、`keyword`、`stageId`、`subjectId` |
| GET | `/experiments/{id}` | read | 详情；学段/学科/实验类型为 **LEFT JOIN**，便于读取「维度未关联」行以便 PATCH 修正 |
| POST | `/experiments` | manage | 新建 |
| PATCH | `/experiments/{id}` | manage | 局部更新 |
| DELETE | `/experiments/{id}` | manage | 软删 |

列表和统计中的 **主表格可见条数** 和主查询一致：对 `edu_stages`、`edu_subjects`、`edu_standard_experiment_categories` 使用 **INNER JOIN**，只返回可渲染行。

**与控制台「教学维度」BFF 的关系**：控制台页面（教学架构、标准实验年级勾选等）使用的学段/学科/年级/矩阵数据来自 **`GET /api/edu/dimensions`**（主库 `data_school_*`，前端类型 `SchoolDimensionSnapshot`，字段如 `levelId`、`gradeSubjectMatrix`）。本目录接口中的 **`stageId` / `subjectId`** 等仍表示 Core 上的外键语义，取值应与上述快照中的业务键一致；详见 `experimental-standard-library/00-overview.md` §5。

## 4. 教学维度缺口（脏数据对照）

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/experiments/dimension-gaps` | read | 返回主表总行数、已关联行数、**未关联**行列表（LEFT JOIN 后学段/学科或实验类型缺失） |

**响应体 `data` 形状**：

```json
{
  "bareTableCount": 118,
  "linkedCatalogCount": 115,
  "unlinked": [ /* 与列表项结构一致的 CatalogCore 数组 */ ]
}
```

**恒等关系**（同一租户、未软删主表前提下）：`bareTableCount === linkedCatalogCount + unlinked.length`。

**路由注册顺序**：该路径须在 `GET /experiments/{id}` 之前匹配，避免将 `dimension-gaps` 解析为 `id`。

## 5. 边和评审（摘要）

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/experiments/{id}/edges` | read |
| POST | `/experiments/{id}/edges/candidate` | contribute |
| POST | `/experiments/{id}/edges/direct` | manage |
| DELETE | `/edges/{kind}/{edgeId}` | edge-purge |
| POST | `/edges/{kind}/{edgeId}/review` | review |

边类型 `kind`：`chapter` | `material` | `media`（以路由实现为准）。

## 6. 前端对照

- 列表和多页拉取：`frontend` 中 `experimentCatalogApi.listExperiments`、`fetch-all-catalog-experiments.ts`。
- 缺口区：`experimentCatalogApi.listExperimentDimensionGaps`，页面组件 `catalog-dimension-gap-panel.tsx`。
- 租户和联调请求头：`frontend/src/lib/experiment-catalog-api.ts` 内 `catalogTenantId()`、`demoUserId` 说明。

## 7. 关联文档

- `00-overview.md`：域模型总览
- `02-database-dictionary.md`：表与字段
- `03-migrations-and-runbook.md`：迁移与跑数
