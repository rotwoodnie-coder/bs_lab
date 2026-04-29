# 全角色业务闭环审计报告与开发排期

> 审计时间：2026-04-26
> 范围：7 种系统角色 × （业务闭环 + 管理闭环）

---

## 一、角色定义与导航矩阵

| # | 角色 | 导航来源 | 主要路由组 |
|---|------|---------|-----------|
| 1 | **Student** (学生) | `STUDENT_MANAGEMENT_NAV` | `/student/*`, `/experiments` |
| 2 | **Parent** (家长) | `PARENT_MANAGEMENT_NAV` | `/parent/*`, `/profile/family` |
| 3 | **Teacher** (教师) | `TEACHER_MANAGEMENT_NAV` | `/teacher/*`, `/experiment-manage`, `/system-manage/teacher-class` |
| 4 | **Researcher** (教研员) | `RESEARCHER_MANAGEMENT_NAV` | `/console/*`, `/researcher/*`, `/district/*` |
| 5 | **School Admin** (校管) | `SCHOOL_ADMIN_MANAGEMENT_NAV` | `/console/*` |
| 6 | **District Admin** (区管) | `DISTRICT_ADMIN_MANAGEMENT_NAV` | `/console/*`, `/district/*` |
| 7 | **Super Admin** (超管) | `SUPER_ADMIN_MANAGEMENT_NAV` | `/console/*`, `/console/operations/*` |

---

## 二、业务闭环审计

### 2.1 核心业务流程定义

系统核心业务流是一条链：
```
教师创建实验 → 提交审核 → 教研员评审 → 实验发布 → 学生做实验 → 家长查看进度
```

### 2.2 各角色闭环评分

#### 🧑‍🎓 学生 (Student) — 完成度：15%

| 流程 | 状态 | 备注 |
|------|------|------|
| 查看实验任务 | ❌ **页面不存在** | `/experiments` 路由在导航中但有页面缺失，点击 404 |
| 做实验(实验工坊) | ❌ **页面不存在** | `/resources` 实验工坊缺失 |
| 实验闯关 | ❌ **页面不存在** | `/student/experiment-challenge` 纯占位路由 |
| 查看成长足迹 | ⚠️ **UI 完整，数据 Mock** | `/student/footprints` 页面存在，全部硬编码数据 |
| 提交实验作业 | ❌ **未实现** | 与实验任务流程绑定，核心流程空缺 |
| 查看实验报告 | ❌ **未实现** | ReportDialog 在 footprints 中有但数据是 mock |

**结论：学生角色无法完成任何真实业务流程。** 整个学生端是系统的最大缺口。

---

#### 👨‍👩‍👧 家长 (Parent) — 完成度：30%

| 流程 | 状态 | 备注 |
|------|------|------|
| 绑定孩子 | ✅ **全栈闭环** | `/profile/family` → 后端 API → DB 落库。唯一完整链路 |
| 等待审核 | ✅ **全栈闭环** | 管理员审核页面 `/console/settings/system/parent-bindings` 完整 |
| 查看任务中心 | ⚠️ **UI 完整，数据 Mock** | `/parent/tasks` 页面精美，纯内存 Mock |
| 家庭实验室 | ⚠️ **UI 完整，数据 Mock** | `/parent/lab` 四阶联动，AI 引导，雷达图，全部 Mock |
| 查看孩子进度 | ❌ **无入口** | 门户导航中无独立的"孩子进度"入口 |
| 查看实验材料库 | ✅ **页面存在** | `/experimental-materials` 对所有人开放 |

**结论：家长绑定流程完整闭环，核心业务（任务、实验室、进度）全是 Mock。**

---

#### 👩‍🏫 教师 (Teacher) — 完成度：65%

| 流程 | 状态 | 备注 |
|------|------|------|
| 实验列表管理 | ✅ **全栈闭环** | `/experiment-manage` 完整 CRUD |
| 创建实验草稿 | ✅ **全栈闭环** | 编辑器自动保存、手动保存全部对接后端 |
| **提交审核** | 🔴 **严重断裂** | 前端模拟，不调后端 API，`exp_msg.status` 始终为 `'t'` |
| 查看实验预览 | ❌ **骨架页面** | `/teacher/experiment-preview` 不加载实验数据，纯视频 |
| 教课关系管理 | ✅ **全栈闭环** | `/system-manage/teacher-class` 完整 |
| 实验题库 | ✅ **全栈闭环** | `/teacher/question-bank` 完整 |
| 教研组管理 | ❌ **纯 UI 占位** | hooks 层为空，`handleCreate` 是空操作 |
| 小法庭/社区 | ⚠️ **导航页面** | 薄入口页，依赖下游路由 |
| 分配实验作业 | ✅ **全栈闭环** | `POST /v2/exp/publish-course-task` 完整 |

**结论：教师的核心"创建→提交"链断裂。教研组管理未接入数据。**

---

#### 🔬 教研员 (Researcher) — 完成度：80%

| 流程 | 状态 | 备注 |
|------|------|------|
| 实验评审 | ✅ **全栈闭环** | 评审工作台完整，`PATCH /v2/exp/:id` 写入 DB |
| 实验列表管理 | ✅ **全栈闭环** | `/console/settings/experiments` 完整 |
| 教材管理 | ✅ **全栈闭环** | `/console/settings/textbooks` 完整 |
| 字典管理 | ✅ **全栈闭环** | `/console/settings/dictionaries` 完整 |
| 题库管理 | ✅ **全栈闭环** | `/console/assessment/questions` 完整 |
| 统计看板 | ✅ **页面存在** | `/console/analytics/district` |
| 教研组管理 | ❌ **纯 UI 占位** | 与教师端共用，hooks 层为空 |
| 用户管理 | ✅ **闭环** | 教研员走通知入口而非系统设置 |

**结论：教研员角色高度可用。唯一缺口是教研组管理未接入数据。**

---

#### 🏫 校管 (School Admin) — 完成度：90%

| 流程 | 状态 | 备注 |
|------|------|------|
| 实验列表、教材、字典、题库、用户、角色、组织、审核 | ✅ **全部闭环** | 10/10 页面全栈接入 |
| 教课关系管理 | ✅ **全栈闭环** | 包含教师班级绑定 |
| 家长绑定审核 | ✅ **全栈闭环** | 完整审核流程 |
| 学段学科管理 | ✅ **全栈闭环** | subject-grades 完整 |
| 实验评审 | ✅ **全栈闭环** | 与教研员共用评审工作台 |
| 积分与激励 | ⚠️ **页面存在，需确认后端** | `/console/settings/incentives` |

**结论：校管角色功能基本完备。** 是当前系统中可用度最高的角色。

---

#### 🏛️ 区管 (District Admin) — 完成度：90%

与校管一致，且额外有全区看板、排课调度能力。所有功能闭环。

---

#### ⚙️ 超管 (Super Admin) — 完成度：85%

| 流程 | 状态 | 备注 |
|------|------|------|
| 校管/区管所有功能 | ✅ | 全部闭环 |
| 运维概览 | ⚠️ **导航入口页** | `/console/operations/dashboard` 卡片导航已实现 |
| 业务字典同步 | ⚠️ **占位页面** | `/console/operations/dict-sync` 仅骨架 |
| 数据导出 | ⚠️ **占位页面** | `/console/operations/data-export` 仅骨架 |
| 缓存管理 | ⚠️ **占位页面** | `/console/operations/cache-mgmt` 仅骨架 |
| 数据一致性检查 | ✅ **全栈闭环** | `/console/operations/consistency` 调用后端 API |
| 操作记录 | ✅ **页面存在** | `/console/operations/audit-log` |
| 学校通知 | ✅ **页面存在** | `/console/operations/notifications` |
| 数据分析 | ✅ **页面存在** | `/console/analytics/district` |

**结论：超管核心管理功能完备，运维中心框架已搭但大部分是占位。**

---

### 2.3 角色闭环总览矩阵

```
角色          业务闭环  管理闭环  说明
─────────────────────────────────────────────────
学生 (Student)    15%      15%    最大缺口
家长 (Parent)     30%      30%    绑定闭环，业务 Mock
教师 (Teacher)    65%      80%    审核链断裂，教研组占位
教研员 (Res.)     80%      85%    教研组占位
校管 (Sch.Admin)  90%      90%    基本完备
区管 (Dist.Admin) 90%      90%    基本完备
超管 (SuperAdmin) 85%      90%    运维中心框架待填充
```

---

## 三、关键断点分析

### P0 — 阻断性缺陷

```
断点1：教师"提交审核"不调用后端 API
影响：教师 → 教研员的审核链路完全断裂
定位：use-editor-actions.ts → publish() 不调 PATCH /v2/exp/:id
解决：publish() 中增加状态变更调用（需产品确认是否新增 "pending" 状态）

断点2：审核人员"通过/驳回"不调用后端 API  
影响：审核操作无持久化，刷新丢失
定位：use-editor-actions.ts → approveExperiment()/confirmReject() 仅做本地事件
解决：改为调用 PATCH /v2/exp/:id
```

### P1 — 功能缺失

```
断点3：学生端全链路缺失
影响：学生无法查看任务、做实验、提交作业
解决：需要从实验发布链路（exp_homework 表）→ 学生端路由全新建造

断点4：家长端业务数据 Mock
影响：家长无法真实获取任务、实验室数据
解决：需要后端新建 parent/tasks、parent/lab/ 等 API

断点5：实验预览页不加载数据
影响：教师点"预览"看到空页面
解决：/teacher/experiment-preview 需调用 GET /v2/exp/:id 加载详情

断点6：教研组管理 hooks 层为空
影响：教师和教研员看到空列表无法操作
解决：对接 v2-sys-org API 创建/查询教研组类型节点
```

---

## 四、开发排期计划

### Phase 1 — 修复阻断链（预计 3 天）

| # | 任务 | 涉及文件 | 工时 |
|---|------|---------|------|
| 1.1 | 教师"提交审核"对接后端 API | `use-editor-actions.ts`、`v2-exp-api.ts`、`v2-exp.ts` | 1d |
| 1.2 | 审核人员"通过/驳回"对接后端 API | `use-editor-actions.ts` → `approveExperiment()`、`confirmReject()` | 0.5d |
| 1.3 | 添加 `exp_msg.status` 的"待审核"枚举值 | 数据库迁移脚本 + `v2-exp-types.ts` | 0.5d |
| 1.4 | 实验预览页加载真实数据 | `/teacher/experiment-preview/page.tsx` | 0.5d |
| 1.5 | `exp_caution`/`exp_danger` 截断提示 | `EditorBasicSection.tsx` 增加字符计数 | 0.5d |

### Phase 2 — 教师侧增强（预计 3 天）

| # | 任务 | 涉及文件 | 工时 |
|---|------|---------|------|
| 2.1 | 自动保存增加离开前强制保存 | `use-editor-autosave.ts`、`page.container.tsx` | 0.5d | ✅ |
| 2.2 | 教研组管理对接后端 API | `teacher/research-project-groups/page.hooks.ts` → `v2-group-api.ts` | 1.5d | ✅ |
| 2.3 | 驳回原因回显到编辑器 | 链路已完备（无需改动） | 0.5d | ✅ |
| 2.4 | 发布时消除 `pushExperimentMaterialLinks` 重复调用 | `use-editor-actions.ts` `publish()` | 0.5d | ✅ |

### Phase 3 — 学生端全链路（预计 7 天）

| # | 任务 | 涉及文件 | 工时 |
|---|------|---------|------|
| 3.1 | 后端 API: 学生任务列表 `GET /v2/student/tasks` | `v2-student.ts` (new route) + service + repository | 1.5d |
| 3.2 | 后端 API: 学生实验作业提交 `POST /v2/student/tasks/:id/submit` | `v2-student.ts` | 1d |
| 3.3 | 前端: 实验库页面 `/experiments` | `page.tsx` + hooks (复用 `GET /v2/exp` + `exp_homework` 过滤) | 1.5d |
| 3.4 | 前端: 实验闯关页面 `/student/experiment-challenge` | `page.tsx` + hooks | 1.5d |
| 3.5 | 前端: 成长足迹接入后端 API | `/student/footprints/page.hooks.ts` | 1d |
| 3.6 | 实验工坊 `/resources` | `page.tsx` (实验操作模拟界面) | 1d |

### Phase 4 — 家长端接入后端（预计 5 天）

| # | 任务 | 涉及文件 | 工时 |
|---|------|---------|------|
| 4.1 | 后端 API: 家长任务中心 `GET /v2/parent/tasks` | `v2-parent.ts` 扩展 | 1.5d |
| 4.2 | 后端 API: 家庭实验室 session `POST/GET /v2/parent/lab` | `v2-parent.ts` 扩展 | 1.5d |
| 4.3 | 前端: 家长任务中心替换 Mock | `/parent/tasks/page.hooks.ts` | 1d |
| 4.4 | 前端: 家庭实验室替换 Mock | `/parent/lab/page.hooks.ts` | 1d |

### Phase 5 — 超管运维中心（预计 3 天）

| # | 任务 | 涉及文件 | 工时 |
|---|------|---------|------|
| 5.1 | 业务字典同步真实 API | `v2-ops-dict-sync.ts` (new route) | 1d |
| 5.2 | 数据导出真实 API | `v2-ops-data-export.ts` (new route) | 1d |
| 5.3 | 缓存管理页面接入 | `v2-ops-cache.ts` (new route) | 0.5d |
| 5.4 | 运维页面鉴权 | 所有 ops 页面增加角色校验 | 0.5d |

### Phase 6 — 技术债务清理（预计 2 天，穿插进行）

| # | 任务 | 工时 |
|---|------|------|
| 6.1 | `POST /v2/exp` 统一为 snake_case（或统一规范文档） | 0.5d |
| 6.2 | 大文件拆分：`use-editor-bootstrap.ts` (26K → <300) | 1d |
| 6.3 | `v2-exp-repository.ts` (~670行) 按职责拆分 | 0.5d |
| 6.4 | `exp_principle` 分段重构方案设计 | 0.5d |

---

## 五、甘特图概览

```
周次     Phase 内容                                  交付物
──────────────────────────────────────────────────────────────
第1周    Phase 1 修复阻断链                            审核工作流修复
         Phase 2 教师侧增强                            教研组、预览页、驳回回显
第2周    Phase 3 学生端全链路(上)                      实验库、闯关页面、footprints API
第3周    Phase 3 学生端全链路(下)                      实验工坊、作业提交
第4周    Phase 4 家长端接入后端                        任务中心、家庭实验室真实 API
第5周    Phase 5 运维中心                              运维页面上线
         技术债务(穿插)                                 文件拆分、命名规范化
第6周    集成测试 + 联调 + Bug 修复                    全角色回归测试
```

---

## 六、风险提示

| 风险 | 级别 | 说明 |
|------|------|------|
| 学生端工作量大 | 🔴 | 学生端目前几乎空白，7天工期仅覆盖基础流程，UI/UX 需独立设计 |
| 审核状态枚举需产品确认 | 🟠 | 当前 `exp_msg.status` 只有 t/y/n，新增 pending 或 workflow_status 需要产品和数据团队裁定 |
| 家长端 Mock 数据复杂 | 🟠 | `parent-sessions-mock-store.ts` 逻辑复杂，替换为真实 API 时需考虑迁移路径 |
| 教研组管理的数据模型 | 🟡 | 课题组是存储在 `sys_org` 中还是独立表？需与 `org_type_id` 体系对齐 |
| 实验预览页面定位模糊 | 🟡 | 当前是"视频测试页"还是"实验预览页"？两种定位导致实现口径不一 |
| 导航矩阵重复项 | 🟡 | `exp-question-bank` id 在教师/超管导航中指向不同 href，`to-app-shell-nav.ts` 去重可能丢失 |
