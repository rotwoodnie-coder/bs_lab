# 去 Mock 分步执行：暂停点与恢复条件

与 `de-mock-standard-catalog-playbook.md` 配套使用。每一阶段在 **「需你配合」** 处暂停；完成后按 **「恢复条件」** 再继续让 Agent 或下一项工程任务进场。

---

## 当前进度（维护时请更新）

| 阶段 | 状态 | 说明 |
|------|------|------|
| 骨架屏（标准实验卡片） | 已完成 | `catalog-experiments-card-grid-skeleton.tsx` |
| Phase 1：维度 + 影子资源登记 | **已完成** | 资源名：实验材料默认图 / 教材默认图 / 实验封面默认图 |
| Phase 2：Core 全真实验收 | **已完成** | 已完成样本闭环：列表筛选、详情读取、边表读取（为空） |
| Phase 3：材料/教材 + Edges | **已完成** | 已补齐教材第一层章节与材料映射，样本实验边表可读 |

---

## Phase 1 — 维度快照 + 影子资源（登记与文件一致）

### 目标

- 控制台标准实验页依赖的 **`GET /api/edu/dimensions`** 与主库 V2 表（`data_school_level` / `data_school_grade` / `data_school_subject` / `data_school_grade_subject`）一致；历史环境若仍用旧库 `edu_*` 维表，由 BFF 适配为同一快照形状即可。
- 至少 **3 条** `edu_media_registry` 记录（推荐规格：16:9、1:1、竖版封面），且 `sys_media_assets.storage_key` 在本地/MinIO **可读**，预览无 404/403。

### 需你配合（暂停点 A）

1. **环境对齐**（与 `.env.example` 一致即可作为起点）  
   - 租户：`NEXT_PUBLIC_EXPERIMENT_CATALOG_TENANT_ID` 与数据库、请求头一致（默认常为 `district-001`）。  
   - 媒体：`MINIO_*`、`MEDIA_MIRROR_TO_MINIO`、数据库 `MEDIA_USE_MYSQL` 按团队约定就绪。
2. **准备三张图**（物理文件）：16:9 列表用、1:1 材料用小图、竖版教材封面（占位图即可）。
3. **完成登记**（二选一，推荐前者）：  
   - **A. 走前台上传链路**：使用应用内媒体上传（经 `frontend` 的 `/api/media/upload` 等已由项目封装的路径），保证 `hash`、`storage_key`、存储引擎与后端一致。  
   - **B. 直接调后端**：`POST /v1/media/assets/upload`，JSON 体字段见 `backend/src/http/routes/media-route-schemas.ts` 中 `createAssetSchema`；请求头需含 `x-role`（如 `researcher`）、`x-org-id`（与租户一致）、`x-tenant-id`、`x-app-id`（常为 `console`），以及 `x-subject-key`（可与 `.env` 中 `NEXT_PUBLIC_MEDIA_SUBJECT_KEY` 对齐）。文件内容需与 `hash`、`storage_key` 指向的物理文件一致。
4. **记录 ID**：将三个 `registry.id` 写入仓库根目录 **`README.local`**（已从 Git 忽略），模板见 `docs/local-dev-seeds.example.md`。

### 恢复条件（完成后回复一句即可继续）

- [x] 三个 Registry ID 已写入 `README.local`（或在本会话中贴出三个数字 ID）。  
- [x] 任选其一，在控制台或 `/v1/media/stream/...` 联调路径下可见图或视频，无 404/403。

### Phase 1 完成记录

- 已确认完成，影子资源命名为：`实验材料默认图`、`教材默认图`、`实验封面默认图`。
- 已登记影子资源资产（`sys_media_assets.id`）：`89`、`90`、`91`（租户 `org-school-east`，应用 `console`，存储引擎 `S3`）。

### Agent 恢复后可执行的任务示例

- 把三个 ID 用于种子 SQL、脚本或文档中的「黄金引用」；  
- 检查标准实验列表/详情中与官方视频、封面关联的字段是否需批量指向影子 ID；  
- **不会**替你向 MinIO 上传文件（无你环境凭证）。

---

## Phase 2 — `edu_standard_experiments`（Core）主轴

### 需你配合（暂停点 B）

- [x] 已做代码核查：控制台实验目录前后端链路未检出 `experiment-catalog` 的 mock 回退实现。  
- [x] 已提供验收样本：`id=3`，`standard_code=STD_STAGE_PRIMARY_SUB_SCIENCE_GRADE_1_GRADE_2_D18CA60B`。
- [x] 已将影子资源补齐到 `district-001`（新登记：`registry.id=92/93/94`，`asset.id=92/93/94`）。

### 恢复条件

- 主轴接口可用；**允许**材料/章节边为空。
- 影子资源在 `district-001` 下可读，并拿到新的 `registry.id`（用于 Core 绑定验收）。
- 已完成：`district-001` 默认图登记为 `92`（实验封面默认图）、`93`（实验材料默认图）、`94`（教材默认图）。
- 已完成：验收样本 `id=3` 已绑定 `officialVideoRegistryId=92`，回读 `officialVideoReachable=true`，边表读取 `count=0`（符合“允许为空”口径）。

### Agent 可执行

- 空态文案、错误边界、与 `experimentCatalogApi` 的联调修复（在代码库内）。
- 已执行：检查 `frontend/src/lib/experiment-catalog-api.ts` 与 `backend/src/http/routes/standard-experiment-catalog.ts`，当前均为真实接口路径（`/v1/experiment-catalog/*`）。
- 注意：Phase 1 资产登记租户为 `org-school-east`，本条 Core 样本租户为 `district-001`；若要把这批默认图直接绑定到标准实验官方视频/封面，需先统一租户（同租户同 app 才能稳定联查）。
- 执行指引：`docs/media-platform/shadow-assets-copy-to-district-001.md`。

---

## Phase 3 — 材料、教材主数据 + Edges

### 需你配合（暂停点 C）

- [x] 教材树：已确认 `district-001` 下教材主表存在，并补齐第一层章节（`textbook_id=1`、`chapter_id=1`）。  
- [x] 材料：已补齐 `district-001/console` 下材料主数据（示例 `material_id=11`）。

### 恢复条件

- [x] 样本实验 `id=3` 已写入章节边（`edge_id=5`）与材料边（`edge_id=7`），状态 `APPROVED`。  
- [x] 材料边可解析名称（`materialDisplayName=透明玻璃杯（Phase3）`）。  
- [x] 章节边后端已补充教材/章节名称联表字段（`textbookTitle`、`chapterTitle`）；若当前服务进程尚未重启，重启后即可在关系面板显示可读名称。

---

## Phase 3+ — 收尾快照（样本 `id=3`）

- [x] Core 回读：`officialVideoRegistryId=92`、`officialVideoReachable=true`。  
- [x] 边表总数：`edgeCount=2`（章节 + 材料）。  
- [x] 章节边：`edge_id=5`、`reviewStatus=APPROVED`、`textbookTitle/chapterTitle` 已在接口返回。  
- [x] 材料边：`edge_id=7`、`reviewStatus=APPROVED`、`materialDisplayName=透明玻璃杯（Phase3）`。  

---

## 当前任务完成情况

- [x] Step 1（维度 + 影子资源）完成。  
- [x] Step 2（Core 主轴）完成。  
- [x] Step 3（材料/教材 + Edges）完成。  
- [x] 骨架屏（标准实验卡片 6 条）已落地。  
- [x] 去 Mock 交接文档链路齐全（主手册 + 交接点 + district 影子资源执行指引）。  

## IAM 去 Mock 主线（新增）

- [x] IAM 建表迁移已完成并通过 PASS 验收（`0021/0022/0023`）。  
- [x] 已建立 IAM 执行清单：`docs/iam/03-iam-de-mock-task-checklist.md`。  
- [~] T1（真实上下文接入）进行中：后端 `/v1/iam/me`、`/v1/iam/my-posts`、`/v1/iam/org-tree` 已落地，前端 `useAuth` 已切到接口读取。  
- [~] T2-1（users 页面去 mock）进行中：后端 `/v1/iam/users*` 已落地，前端 `console/users/mock-service` 已切到真实 IAM API。  
- [ ] 待完成：T2-2（organizations 页面去 mock）→ T3（学籍/任教）→ T4（实验管理主链）→ T5（收口上线）。
- [ ] 新增评审稿：联邦教研组审核闭环（状态机 + DDL + Runbook）已落文，见 `docs/iam/04-federated-research-group-review-spec.md`。

## Global — 骨架与 CLS

- Phase 1 起即可同时观察：列表加载骨架是否与真实卡片 **高度一致**（已落地 6 卡骨架）。  
- 真接口变慢时：详情内 `MediaPreview` 在签名未返回前保持占位（后续迭代可拆任务）。

---

## 如何发起「继续」

在本仓库对话中直接说明，例如：  
「Phase 1 已完成，README.local 已填好」或附上三个 Registry ID。Agent 将从 Phase 1 验收与下一项代码任务继续。

### IAM 联邦教研组闭环继续口令（新增）

可直接回复：  
「按 04 文稿执行 Step 1（DDL 补丁）」  
或  
「按 04 文稿执行 Step 2（状态机守卫）」  
Agent 将按 `docs/iam/04-federated-research-group-review-spec.md` 的 Runbook 分步推进并回报验收结果。
