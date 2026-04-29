# 标准实验域去 Mock 作战手册（控制台）

## 1. 目标与范围

- **目标**：在控制台「标准实验目录」及相关资源（媒体、材料、教材）上，用真实数据库与对象存储替换 Mock，主列表与关键详情可验收、可回滚。
- **范围**：控制台 `experimentCatalogApi`、实验材料配置、教材与章节、媒体登记与预览。
- **非目标（另册跟踪）**：教师端实验编辑器、统一 Mock Store、审核台等仍依赖 `mock-experiment-*` 的链路。

## 2. 依赖顺序（表与外键）

1. 维度：控制台以 **`GET /api/edu/dimensions`** 为准，主库对应 **`data_school_*`** 四表（见 `0024_v2_full_schema_init.sql`）；若联调环境仍保留旧 `edu_stages` / `edu_subjects` / `edu_grades`，须与 BFF 返回的快照字段语义对齐（`levelId`、`subjectId`、`gradeId` 等）。
2. 媒体物理与登记：`sys_media_assets` → `edu_media_registry`（登记为业务侧引用真源）。
3. 实验材料：`edu_experimental_materials`（及子表，按需）。
4. 教材：`edu_textbooks` → `edu_textbook_chapters`（先书名与封面，再第一层章，再加深）。
5. 标准实验 Core：`edu_standard_experiment_categories`、`edu_standard_experiments`、`edu_standard_experiment_grade_scope`。
6. 边表：`edu_standard_experiment_material_edges`、`edu_standard_experiment_chapter_edges`（须在 Core 与主数据稳定后接）。

## 3. 影子资源池（Shadow Assets）

- 在 MinIO（或等价存储）固定前缀如 `seeds/` 下放置 **5～10 个** 真实对象；**禁止**随机导数导致 `storage_key` 指向不存在文件。
- 数据库中登记行与物理对象一一对应，用于把「业务逻辑（筛选、分页、Join）」与「存储 404」拆开验收。
- **验收**：任选一个 `edu_media_registry.id`，前端经现有流 URL/预览链路能展示，**无 404/403**。

### 3.1 推荐三种规格（覆盖多数场景）

| 规格 | 典型用途 |
|------|----------|
| **16:9** | 标准实验列表卡片视频区（与 `aspect-video` 一致） |
| **1:1** | 实验材料列表小图/图标位 |
| **竖版** | 教材封面展示 |

具体 Registry ID 请在本机维护：复制 `docs/local-dev-seeds.example.md` 为仓库根目录 `README.local`（已忽略版本控制），填入本环境三个 ID。

## 4. API 与签名策略

- **列表**：优先返回可稳定展示的内容（相对路径经网关转直链、或策略允许的缓存型公网 URL；以安全评审为准）。
- **详情 / 强权限预览**：再请求带时效的签名 URL。
- **前端**：`MediaPreview` 在签名未返回前保持骨架或占位，避免裂图与累计布局偏移（CLS）。

联调环境可放宽；生产环境以安全策略为准。

## 5. 分阶段任务与验收

### Step 1：维度 + 媒体登记 + MinIO 种子

- 维度数据完整；Registry 行与 MinIO 种子 **100% 连通**（见 §3 验收）。

### Step 2：`edu_standard_experiments`（Core）

- `experimentCatalogApi` 全链路真实数据；**学段/学科/关键词筛选**可用。
- 允许材料边、章节边为空或展示「未关联」；**列表与主轴不崩**。

### Step 3：材料 / 教材主数据 + Edges

- 主数据中 ID 可解析为材料名、书名；教材树 **至少展开第一层**。
- 再接入各边表；空边与部分失败可接受，但需有明确空态与错误提示。

### Global：加载与 CLS

- 主列表加载：**骨架屏**与真实卡片同栅格、同内边距（见 `catalog-experiments-card-grid-skeleton.tsx`）。
- 骨架数量：**仅 6 个**（视口常见范围），勿铺满全列表。
- 多页合并（如 `fetchAllCatalogExperiments`）时，首屏 loading 期间避免整体剧烈位移。

## 6. 缩略图与 Worker（若启用）

若启用缩略图代次与 Worker，需约定种子资源是否依赖异步任务；联调阶段可接受「已含静态预览」或「占位图」策略，避免与影子资源池同时失败。

## 7. 租户、环境与回滚

- 种子与接口调用使用同一 `tenant_id` / `app_id` 与前端 `actor` 配置一致。
- 记录各环境 MinIO 与签名网关差异；提供回滚方式（特性开关或控制台灰度）。

## 8. 检查清单（发布前）

- [ ] Step 1：随机 Registry ID 预览成功  
- [ ] Step 2：筛选 + 列表稳定，关联可为空  
- [ ] Step 3：材料名/书名解析 + 教材第一层可点  
- [ ] Global：骨架与真实卡片高度一致、无明显 CLS  
- [ ] 文档范围外页面仍 Mock 已标注，无误解  

## 9. 已落地步骤（工程）

- **标准实验卡片列表骨架屏**：`frontend/.../catalog-experiments-card-grid-skeleton.tsx`，首屏加载且尚无数据时展示 6 张与真实 `Card` 同结构的占位。

## 10. 后续分步执行（建议顺序）

**详细暂停点、你需完成的动作与恢复条件见：`docs/de-mock-handoff-checkpoints.md`。**

1. 环境：MinIO 与 `storage_key` 规则；对齐 `tenant_id` / `app_id`。  
2. 种子文件：上传影子资源 → 写入 `sys_media_assets` + `edu_media_registry`（**Phase 1 — 需你本机配合**）。  
3. 维度：保证 **`/api/edu/dimensions`** 聚合结果与控制台 **`SchoolDimensionSnapshot`**（`levelSubjects` / `levelGrades` / `gradeSubjectMatrix` 等）一致。  
4. Core：列表/详情 API 全真实；验收筛选与空边（**Phase 2**）。  
5. 材料与教材主表：接管理页与解析逻辑（**Phase 3**）。  
6. Edges：按实验 ID Join；教材树分阶（书 → 第一层章 → 加深）。  
7. **（已完成）** 实验目录卡片区骨架栅格。  
8. 签名与 MediaPreview：列表/详情分层；未签出前保持占位。  
9. 回归与回滚演练。
