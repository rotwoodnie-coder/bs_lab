# 科学小实验社区 · 运营中心与业务域 Mock 规格（与仓库对齐版）

> **文档性质**：产品 / 前后端对齐用 Mock 规格，**部分能力尚未在代码中实现**。  
> **关联冻结契约**：[`api-contract.md`](./api-contract.md)、[`integration-baseline.md`](./integration-baseline.md)（统一响应包、`x-role` / `x-user-id`、作品流水线）。  
> **教育理念用语**：陶行知「生活即教育、社会即学校、教学做合一」、探究链「想法—方法—做法」、小先生制（互教互学与众裁成长）。

---

## 1. 与 `bs_lab` 仓库现状的对照

### 1.1 已实现（可作为真源）

| 类别 | 位置 | 说明 |
|------|------|------|
| 角色枚举 | `frontend/src/types/auth.ts` | `STUDENT` / `PARENT` / `TEACHER` / `RESEARCHER` / `SCHOOL_ADMIN` / `DISTRICT_ADMIN` / `SUPER_ADMIN` |
| 运营中心导航 | `frontend/src/config/console-nav.ts` | **分面**：`ops`（运营中心）含 **教研与评审**（实验评审、**课题组校验** `/console/review/project-groups`）、**AI 实验引导**、**社区动态（法庭）**、**实验报告**、**数据大盘**；`system`（平台管理）含 **实验目录**（`/console/resources/subject-grades` / `experiments`）、**材料与设备**、账号与权限、通知与校区等。面包屑根为「运营中心」或「平台管理」。`RESEARCHER` 不可进 `/console/system/*`，系统分面为 **实验目录 + 材料设备 + 平台通知**；`SCHOOL_ADMIN` 运营侧仅小法庭（无评价/动态/话题），系统侧全量。 |
| 领域注释真源 | `frontend/src/lib/console/experiment-community-domain.ts` | `work_id` vs `submission_id`、**后置发布**、申辩与运营中心筛选约定 |
| P0 交互骨架页 | `console/ai/strategies`、`console/social/court`、`console/reports/templates` | 占位 UI：双轨 Prompt 开关、**实验导师人格**（`localStorage` Mock）、想法—方法—做法预览；法庭列表 Tab + `is_appealed` 筛选；报告数据点预览（含 **耗材勋章** 键） |
| 主导航矩阵 | `frontend/src/config/nav-config.ts` | 门户 **实验工坊**（`/resources`）；管理台含 **运营中心** + **平台管理**（教研平台管理默认 `/console/platform/notifications`，区管/超管 `/console/system/users`）；校管 **平台管理** `/console/system/organizations`。主导航将 **实验材料**（`/experimental-materials`）与探究教学场景对齐；**探究方案编辑**由 `/teacher/experiment-editor` 承担（步骤、材料与安全等），**教师侧栏不单独展示「实验发布」**，从 `/experiment-manage` 的「新建探究方案」与列表「编辑」进入；该路由下侧栏高亮 **实验管理**（`exp-mgmt`）。**不包含** IoT 设备台账。旧路径 `/admin/experiment-config` 若保留则仅作重定向至上述编辑器，不承载硬件配置。`resolveDashboardNavId`：Console 按分面高亮 `console-ops` / `console-system-base`（校管仍可 `school-console-*` / `school-monitoring-bind`）。 |
| 实验管理页 | `frontend/src/app/(dashboard)/experiment-manage/page.tsx` | 教研/区管/超管/校管展示「前往材料与硬件映射」入口，直达 `/console/resources/materials-hardware` |
| Next API（示例） | `frontend/src/app/api/console/*`、`experiments/[id]/view-permissions` | 导入导出、用实验视图能力 |
| 冻结 API 故事线 | `docs/contracts/api-contract.md` | `works` → `ai-precheck` → `review` → `publish` → `feed`；`parent-sessions` / `parent-reports`；`teacher-assets` |

### 1.2 规格已描述、代码尚未落地（实施时需补）

| 能力 | 缺口说明 |
|------|-----------|
| AI 策略 API / 持久化 | 仅有策略页骨架；待接 `GET/PUT /api/v1/agent/config` 与 `ai-precheck` 联动 |
| 法庭后端与详情页 | 仅有 `/console/social/court` 列表骨架；待接案件 API、`appeal_process`、`jury_growth_system`；可选另建 `/console/court/cases/[id]` 详情 |
| 报告生成与多格式导出 | 仅有模板页预览骨架；待接 `POST /api/v1/report/generate` 与 `output_formats` |
| 拍同款血缘 `lineage_tree` | 作品/动态模型需 `parent_video_id` / `source_video_id` 与统计 API |
| C 端申辩与红点 | 「我的作品」下架态 + 申辩页路由待实现；运营中心已预留 `is_appealed` 筛选叙事 |

### 1.3 命名与网关约定（避免前后端歧义）

- **冻结文档**使用 **`/v1/...`**（后端资源路径）。  
- **Next.js Route Handlers** 可为 **`/api/.../v1/...`** 或 BFF 反向代理至同一后端；本规格表格中 **「逻辑路径」** 写 `/api/v1/...`，实施时与网关统一即可。  
- **`work_id`**：业务层「作品」主键，**师生端与运营话术统一使用**。  
- **`submission_id`**：技术层「一次提交记录」；多版本/重传可多条归属同一 `work_id`。  
- **作品（Work）** 与投稿记录应对齐为同一业务真源，避免列表展示 `submission_id`。

---

## 2. 冻结流水线与扩展域的映射（必须读）

以下为 **在不大改 MVP 心智** 的前提下，将「科学社区」域接到现有契约上的推荐映射：

| 冻结端点 / 概念 | 本规格扩展 |
|-----------------|------------|
| `POST /v1/works` | Body 扩展：`is_same_style`、`source_video_id`（或 `parent_video_id`）、`grade_id`、`category`（课内/创意）；用于血缘与推荐 |
| `POST /v1/works/:id/ai-precheck` | 预检规则由 **`GET/PUT /api/v1/agent/config`**（按年级）驱动；返回的 `dimensions` / `suggestions` 对齐 **想法—方法—做法** 分层 |
| `POST /v1/works/:id/review` | **行政/内容审核**；与众裁 **`audit_court_status`** 并存时，应用状态机约定谁优先（建议：法庭 `resolved` 前不执行 `publish`） |
| `POST /v1/works/:id/publish` | 仅当审核轨 + 法庭轨（若适用）均满足 |
| `GET /v1/feed` | 列表项扩展：`like_count`、可选 `lineage_depth`；筛选 `topic_id` |
| `POST /v1/parent-reports` | 与 **`POST /api/v1/report/generate`** 合并产品故事：会话报告可视为 `template_id = default_parent_session` 的一种生成方式 |
| `POST /v1/teacher-assets` | 教师 **金标准视频** / 教案素材；可作为 `lineage_tree.root_video_id` 的主要来源 |

---

## 3. 页面路由清单（运营中心 + 与现有导航对齐）

### 3.1 运营中心 `/console`（`console-nav.ts` 已注册 P0 骨架）

| 路由 | 模块 | 说明 |
|------|------|------|
| `/console` | 运营中心首页 | 待办：法庭案件、审核队列、挑战赛；角色化卡片 |
| **`/console/ai/strategies`** | **AI 实验引导（P0）** | **已落地骨架**：低年级/高年级 Prompt 开关、探究阶梯预览 |
| `/console/ai/agent-strategies/[gradeId]` | （规划）按年级详情 | `teaching_style`、`hint_scaffolding`、安全阈值、预警策略；可与 strategies 合并为子路由 |
| `/console/ai/safety-rules` | 安全规则 | 全局词库、强制人工复核条件 |
| **`/console/social/court`** | **实验小法庭（P0）** | **已落地骨架**：待审 / 众裁中 / 已结案；**`is_appealed` 筛选**；法官资格跳转 `/console/system/users?focus=jury` |
| `/console/court/settings` | （规划）法庭规则 | 众裁资格、20 人规则、误裁阈值 |
| `/console/court/question-bank` | （规划）众裁题库 | 维度：安全 / 规范 / 设计 |
| `/console/court/cases/[caseId]` | （规划）案件详情 | 时间线、`improvement_suggestions`、`appeal_process` |
| `/console/court/jury-growth` | （规划）法官成长 | `jury_growth_system` 全局规则 |
| **`/console/reports/templates`** | **亲子报告模板（P0）** | **已落地骨架**：四阶联动预览 + 数据点键名（实验表现、AI 评分、点赞、**耗材勋章** `inventory.material_badges`、全区排名） |
| `/console/reports/templates/[templateId]` | 模板编辑 | 区块绑定数据点 |
| `/console/reports/data-bindings` | 数据点字典 | 含全区排名、AI 规范分、点赞数等键说明 |
| `/console/social/same-style-topics` | 拍同款运营 | 话题与源视频绑定 |
| `/console/social/same-style/lineage` | 血缘分析 | 根视频检索、`lineage_tree` 指标 |
| **`/console/review/project-groups`** | **课题组校验（P1 Mock）** | 教研员对 **教研课题组** 的审核与生效后管理；与实验评审区分；契约见 [`research-project-group-mock.md`](./research-project-group-mock.md) |
| 已有 | 动态/审核/用户组织等 | 见 `CONSOLE_NAV_GROUPS`（运营 + 系统分组拼接，供扁平查找） |

### 3.2 教师工作台（已与 `nav-config` 部分一致）

| 路由 | 说明 |
|------|------|
| `/teacher/social` | **社交仲裁**（现有）：宜承载 **法庭平局终裁**、紧急下架协查入口，与中台 `court` 联动 |
| `/teacher/assignments` | 日任务与实验库发布（与 `tasks/daily/publish` 故事衔接） |
| `/teacher/reports` | 报告批改；可与自动报告生成状态联动 |
| `/teacher/experiment-editor` | 实验发布与金标准素材挂载 |

### 3.3 学生 / 家长（C 端或轻管理台）

| 路由 | 说明 |
|------|------|
| `/experiments` | 实验库与任务（与投稿、闯关衔接） |
| `/student/footprints` | 成长足迹（报告、积分、排名展示入口之一） |
| **`/parent/lab`** | 家长侧家庭实验室（进度、四阶、成就卡；旧 `/parent/child-progress` 重定向） |
| （规划）`/student/works` 或作品中心 | **我的作品**：下架 **红点** → 申辩页（与中台 `is_appealed` 联动） |

---

## 4. 核心数据模型摘要

### 4.1 法庭案件 `CourtCase`（逻辑模型）

| 字段 | 类型 | 描述（含业务语义） |
|------|------|-------------------|
| `case_id` | string | 主键 |
| `work_id` | string | 业务作品主键（列表、对家长展示） |
| `submission_id` | string? | 技术提交记录（内部流水线）；可选仅在详情/审计中展示 |
| `audit_court_status` | enum | `pending` / `in_progress` / `resolved` / `appealed` |
| `vote_count_positive` | int | 「无问题」 |
| `vote_count_negative` | int | 「有问题」 |
| `jury_target_count` | int | 默认 20，可配置 |
| `teacher_tiebreak_required` | bool | 平局则 true |
| `teacher_verdict` | enum | `none` / `clear` / `takedown` |
| `court_outcome` | object | 见下 |
| `appeal_process` | object | **申辩流程**（见 4.2） |
| `jury_growth_system` | object | **法官等级快照**（案件维度可选；用户维度见 `jury-profile`） |

**`court_outcome`（众裁非冷处理）**

| 字段 | 说明 |
|------|------|
| `outcome_type` | `cleared` / `revise_and_reupload` / `takedown_pending_revision` / 教师终裁子类型 |
| `improvement_suggestions[]` | **必填（当判定需整改时）**；每条含 `dimension`、`idea_method_practice_hint`（想法—方法—做法）、可选 `reference_resource_id`（金标准视频） |

### 4.2 `appeal_process`（申辩）

| 字段 | 说明 |
|------|------|
| `status` | `none` / `submitted` / `under_review` / `accepted` / `rejected` / `closed` |
| `submitted_at` | datetime |
| `statement` | 探究意图与理由（想法层） |
| `evidence_refs[]` | 方法—做法层证据（重拍片段、对比说明等） |
| `reviewer_notes` | 教研/教师复核说明 |

### 4.3 `jury_growth_system`（法官等级）

| 字段 | 说明 |
|------|------|
| `tier` | `apprentice` / `trusted` / `mentor`（小先生仲裁员） |
| `experience_points` | 有效裁量、一致率等 |
| `misjudgment_streak_reset_at` | 误裁惩罚与重考节点 |

### 4.4 Agent 配置（按年级）

| 字段 | 说明 |
|------|------|
| `grade_id` | 年级维度主键 |
| `agent_prompt` | 主引导语 |
| `agent_prompt_by_scene` | 可选：分场景覆盖 |
| `teaching_style` | `buddy`（低年级伙伴化，生活化鼓励）/ `professional`（高年级专业化与证据链） |
| `hint_scaffolding` | `level_1_idea` / `level_2_method` / `level_3_practice`；可选 `advance_condition` |
| `safety_threshold` | 触发预警的置信度等 |
| `error_warning_policy` | 阻断/仅标记/通知角色 |

### 4.5 拍同款血缘 `lineage_tree`

| 字段 | 说明 |
|------|------|
| `root_video_id` | 多为教师金标准 |
| `nodes[]` | `video_id`, `parent_video_id`, `depth`, `creator_role`, `created_at`, `school_id`, `grade_id` |
| `metrics` | `branch_count`, `max_depth`, `cross_school_spread` 等 |

### 4.6 报告数据点（模板绑定键名建议）

| 键名 | 含义 |
|------|------|
| `experiment.performance_summary` | 实验表现摘要（任务/作品完成度） |
| `challenge.district_rank` | 全区排名 |
| `ai.normative_score` | AI 规范评分（与预检维度同源） |
| `social.like_count` | 互动点赞数 |
| `inventory.material_badges` | **实验耗材勋章**：按学生完成实验所涉耗材标签聚合（与 B 域材料库/实验步骤引用对齐），用于亲子报告激励 |
| `court.audit_court_status` / `court.improvement_suggestions` | 法庭状态与改进建议 |
| `lineage.depth` / `lineage.root_title` | 血缘展示（可选） |

---

## 5. 核心业务 API（逻辑路径）

统一响应结构遵循冻结契约：`{ success, data, error }`。鉴权：`x-role`、`x-user-id`（至生产 IAM 替换前）。

### 5.1 AI 策略

- `GET /api/v1/agent/config?grade_id=&scene=`  
- `PUT /api/v1/agent/config`（含 `agent_prompt`、`tutor_persona`（如 `neutral` / `professor` / `whiz` / `coach`）、`teaching_style`、`hint_scaffolding`、阈值、预警策略）  
- `POST /api/v1/agent/config/preview`（Mock 预览，可选返回建议阶梯 `scaffold_step_suggested`）

### 5.2 实验小法庭

- `GET /api/v1/court/cases`（筛选 `audit_court_status`、**`is_appealed`**（bool，申辩中队列））  
- `GET /api/v1/court/cases/{caseId}`（含 `appeal_process`、`court_outcome`）  
- `POST /api/v1/court/cases/{caseId}/open`  
- `POST /api/v1/court/cases/{caseId}/vote`（学生陪审）  
- `POST /api/v1/court/cases/{caseId}/teacher-verdict`  
- `POST /api/v1/court/cases/{caseId}/appeal`  
- `POST /api/v1/court/cases/{caseId}/resolve`（服务侧计票回调或管理员强制结案，**带 `improvement_suggestions`**）  
- `GET/PUT /api/v1/court/settings`  
- `GET /api/v1/court/questions`（+ CRUD）  
- `GET /api/v1/users/{userId}/jury-profile`  

### 5.3 作品与拍同款

- `POST /api/v1/experiment/upload` **或** 扩展 `POST /v1/works`（推荐后者单一真源）  
  - 字段：`is_same_style`, `source_video_id` / `parent_video_id`, `topic_id`, `grade_id`, `category`  
- `GET /api/v1/social/same-style/topics`（+ `POST` 运营创建）  
- `GET /api/v1/social/same-style/lineage/{rootVideoId}`  
- `GET /api/v1/social/same-style/topics/{topicId}/lineage-stats`  

### 5.4 挑战赛

- `GET/POST /api/v1/challenges/district`  
- `GET /api/v1/challenges/district/{id}/leaderboard`  
- `POST /api/v1/challenges/district/{id}/points/adjust`（审计）

### 5.5 报告生成（补强）

`POST /api/v1/report/generate`

**Body 建议**

| 字段 | 类型 | 说明 |
|------|------|------|
| `template_id` | string | 必填 |
| `student_id` | string | 必填 |
| `work_id` 或 `session_id` | string | 与冻结 `parent-reports` 兼容：有会话则走亲子会话聚合 |
| `time_range` | object | 可选，聚合闯关与日任务 |
| `output_formats` | enum[] | **`web`** / **`image`** / **`pdf`**，可多选 |

**数据抓取声明（本迭代强制）**

服务端聚合须能读取：**全区排名**（`challenge.district_rank`）、**AI 规范评分**（`ai.normative_score`，与 `ai-precheck` / Agent 策略一致）、**互动点赞数**（`social.like_count`），并写入对应模板区块。

**Response `data` 建议**

| 字段 | 说明 |
|------|------|
| `report_id` | 主键 |
| `status` | `queued` / `done` / `failed` |
| `artifacts[]` | `{ format, url, mime_type }` |

**幂等**：建议支持 `Idempotency-Key` 或 (`template_id`, `student_id`, `time_range` hash) 防重复生成。

### 5.6 日任务

- `POST /api/v1/tasks/daily/publish`（班级、实验库条目、截止时间）

---

## 6. RBAC 矩阵（与 `UserRole` 严格对齐）

> **说明**：文档中的「系统管理员」对应 **`SUPER_ADMIN`**；「区级教研员」对应 **`RESEARCHER`**；「校级管理员」对应 **`SCHOOL_ADMIN`**；「区级管理员」对应 **`DISTRICT_ADMIN`**（与教研员共用管理工作台菜单时，权限需按接口再细分）。**教师** = `TEACHER`。

| 能力 | SUPER_ADMIN | DISTRICT_ADMIN | RESEARCHER | SCHOOL_ADMIN | TEACHER | STUDENT | PARENT |
|------|-------------|----------------|------------|--------------|---------|---------|--------|
| Agent 全量配置 | ✓ | 区策略（建议） | ✓（教研侧） | 只读 | — | — | — |
| 法庭规则与题库 | ✓ | ✓ | ✓ | 本校配置（可选） | 本班相关 | 陪审（资格通过后） | — |
| 法庭投票 | — | — | — | — | — | ✓（资格） | — |
| 申辩提交 | — | — | — | — | — | ✓（本人作品） | 协助（若产品允许） |
| 教师终裁（平局） | — | — | — | — | ✓ | — | — |
| `improvement_suggestions` 终审编辑 | ✓ | ✓ | ✓ | 本校 | 本班案件 | — | — |
| 拍同款话题 / 挑战赛 | ✓ | ✓ | ✓ | 校际协办（Mock） | 只读或参与 | — | — |
| `lineage_tree` 查看 | ✓ | ✓ | ✓ | 本校子树 | 本班子树 | — | — |
| 报告模板管理 | ✓ | ✓ | ✓ | 校模板 | 使用 | — | 触发/查看亲子报告 |
| `report/generate` | ✓ | ✓ | ✓ | ✓（校范围） | ✓（本班） | — | ✓（亲子，冻结会话路径） |
| 运营中台 `console-nav` | 全部分组 | 全部分组（与教研员同壳时需 API 再切） | 无「系统角色」组 | **AI + 报告 + 仅法庭子项**（无评价审核台、无动态监控） | 默认无中台入口（可走 `/teacher/social`） | — | — |

**与 `getConsoleNavGroupsForRole` 一致**：`RESEARCHER` 仍看不到「系统角色与权限」；`SCHOOL_ADMIN` **不再**完全排除社交组，而是 **仅注入「实验小法庭」单条**。**校管主导航**（`nav-config`）另含「实验小法庭」直达入口，与摘要中「校管工作台加口」方案一致。

---

## 7. 状态机与冲突处理（补齐）

1. **后置发布（推荐）**：学生上传 → AI 预检 → **[可选：进入实验小法庭众裁]** → **`resolved`（通过）** → **自动 `publish` → 进入 Feed**。保证 Feed 中作品均经过算法或「民意」过滤，维护社区科学严肃性。  
2. **与行政审核关系**：若保留 `review` 轨，建议 **串行**：法庭 `resolved` 且结论允许公开（或整改闭环完成）后，再执行或触发 `publish`；避免未结案即入流。  
3. **申辩**：C 端「我的作品」下架态红点进入申辩；中台 `GET /api/v1/court/cases?is_appealed=true` 拉取复核队列；`appealed` 期间可冻结终局执行或进入复核子状态（实施时二选一写死）。  

---

## 8. 错误码建议（在冻结集合上扩展）

| `error.code` | 场景 |
|--------------|------|
| `COURT_QUORUM_NOT_MET` | 未满法定陪审人数 |
| `COURT_NOT_TIE` | 非平局却请求教师终裁 |
| `APPEAL_NOT_ALLOWED` | 当前状态不可申辩 |
| `AGENT_CONFIG_NOT_FOUND` | 年级未配置 |
| `LINEAGE_ROOT_NOT_FOUND` | 根视频不存在 |
| `REPORT_TEMPLATE_BINDING_INVALID` | 模板数据点无法解析 |
| `REPORT_GENERATE_ALREADY_RUNNING` | 幂等冲突 |

---

## 9. 实施优先级建议（供排期）

1. **P0（部分已搭骨架）**：中台 **`/console/ai/strategies`**、**`/console/social/court`**、**`/console/reports/templates`**；校管工作台法庭入口；`work_id` 领域注释。后续：`works` 扩展字段 + `ai-precheck` 与 Agent 配置表关联。  
2. **P1**：法庭案件模型 + 教师终裁与 `/teacher/social` 跳转一致 + `improvement_suggestions`；C 端申辩与红点。  
3. **P2**：申辩流程 + 法官成长 + 血缘统计 API。  
4. **P3**：报告模板 + `output_formats` 三端产物 + 数据点与全区排名打通。  

---

## 10. 修订记录

| 版本 | 日期 | 摘要 |
|------|------|------|
| 1.0 | 2026-04-12 | 初版：与仓库导航、角色、冻结 API 对齐并合并前两轮业务细节 |
| 1.1 | 2026-04-12 | P0 骨架路由：`/console/ai/strategies`、`/console/social/court`、`/console/reports/templates`；校管导航与法庭单列；`work_id`/后置发布/申辩筛选；API 增加 `is_appealed` 查询说明 |

---

*本文档不改变 `api-contract.md` 的冻结语义；后端演进时建议新增 `api-contract-v2.md` 或在同一文件中用「扩展」章节标注版本。*
