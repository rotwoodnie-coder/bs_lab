# 中小学试验平台
# 任务记录及人工验收确认文档
## 现有项目演化为新项目的执行过程记录
**版本**：V1.0
**用途**：记录每一步任务执行结果，并标记需要人工验收确认的关键步骤
---
## 一、任务总览
| 任务编号 | 任务名称 | 状态 | 是否需要人工验收 |
|---|---|---|---|
| A-01 | 前端资产盘点 | **completed** | 是 |
| A-02 | 历史数据盘点 | **completed（老库仅部分数据；已确认以新库作为新的开发基线，缺失数据对应功能视为未落地）** | 是 |
| A-03 | 文档基线确认 | **completed** | 是 |
| B-01 | 新项目目录结构建立 | **completed** | 是 |
| B-02 | API 适配层初始化 | **completed** | 是 |
| B-03 | 类型定义与模型层建立 | **completed** | 是 |
| C-01 | 基础表单控件抽离 | **completed（V2 homework/question 组件已提取）** | 是 |
| C-02 | 展示类控件抽离 | **completed（V2StatusBadge 已创建）** | 是 |
| C-03 | 资源类控件抽离 | **completed（V2Pagination 已创建）** | 是 |
| C-04 | 通用业务组件抽离 | **completed（V2SubjectLevelFilter 已创建）** | 是 |
| D-01 | 实验模块页面重构 | **completed（experiment-manage 已接 V2）** | 是 |
| D-02 | 作业模块页面重构 | **completed（assignments 已接 V2）** | 是 |
| D-03 | 题库模块页面重构 | **completed（question-bank 已接 V2）** | 是 |
| D-04 | 组织用户页面重构 | **completed（users 已接 IAM API；orgs 拆分并接 V2 sys-org）** | 是 |
| D-05 | 文件资源页面重构 | **completed（materials 已接真实 API；v2-material-api.ts 就绪）** | 是 |
| E-01 | 清洗规则制定 | **completed（08-data-migration-rules-E01-E02.md）** | 是 |
| E-02 | 字段映射表生成 | **completed（同上文档，含 5 张核心表映射）** | 是 |
| E-03 | 迁移脚本试跑 | **completed（0026_e03_migration_trial_run.sql，已验收通过）** | 是 |
| E-04 | 全量迁移执行 | **completed（已确认旧库 exp_* / material_* 为空表，直接复制方案跳过；正式迁移改由 0028_e05_edu_to_v2_migration.sql 执行）** | 是 |
| F-01 | 阶段验收确认 | pending（待汇总 D/E 阶段验收结果） | 是 |
| F-02 | 上线切换准备 | pending（待完成全量迁移与回归验证） | 是 |
| F-03 | 旧系统退役确认 | pending（待上线切换稳定后执行） | 是 |
---
## 二、当前开发重构任务清单

> 目标：以数据库整体设计为基础，全面取消 mock 依赖，把前端与真实数据库/真实 API 对齐，完成全量开发与验收闭环。

| 任务编号 | 任务名称 | 对应数据/后端 | 对应前端页面 | 当前状态 | 下一步 |
|---|---|---|---|---|---|
| P-01 | 基础数据管理优先接入 | `data_*` + `/v2/dict/*` | 学科树、学段/年级/难度/教材、角色/职称/组织类型等通用筛选控件 | in_progress | 已补充 `v2-exp-api` 字典端点与 `useV2DictCatalog`；各业务页按需逐步替换内联请求 |
| P-02 | 系统主数据管理重构 | `sys_org` / `sys_user` / `sys_msg` / `sys_log` + `/v2/sys-*` | `console/system/users`、`console/system/organizations`、系统消息相关页 | in_progress | 补齐用户/组织列表、详情、创建、消息链路 |
| P-03 | 实验课程管理重构 | `exp_library` / `exp_msg` + `/v2/exp-library` / `/v2/exp` | `experiment-manage`、实验编辑/详情入口 | in_progress | 列表/筛选/新建/详情与分页统一 |
| P-04 | 作业模块重构 | `exp_homework` / `exp_homework_student` + `/v2/homework` | `teacher/assignments` | in_progress | 完成作业列表、布置、学生子列表与批改闭环 |
| P-05 | 题库管理重构 | `exp_question` / `exp_question_select` + `/v2/question` | `teacher/question-bank` | in_progress | 完成状态流转、驳回原因、选项展示与筛选 |
| P-06 | 材料资源管理重构 | `material_msg` / `data_file` + `/v2/material` / `/v2/file` | `teacher/materials`、素材详情/上传入口 | in_progress | 统一材料列表、编辑、文件关联与空态 |
| P-07 | 认证与个人中心基础能力 | `sys_user` + `/v2/auth/*` | 登录、个人资料、修改密码 | **in_progress** | 已接 `/login`、会话、`/v2/auth/profile` 与改密；待 JWT/顶栏与角色完全对齐 |
| P-08 | 数据迁移/初始化验收 | `0026` / `0028` / `09-old-schema-analysis` | 无直接页面 | completed | 仅保留验收记录，不再作为开发主线 |

### P-01 拆解：基础数据管理优先接入

- **目标**：以数据库整体设计为基础，把前端中所有学科、学段、年级、难度、教材、题型、角色、组织类型等基础数据相关选择器与管理能力统一接到真实数据库/API，逐步替换 mock，并优先补齐基础数据管理页。
- **现状判断**：
  - 后端 `routeV2Dict` 已提供 `/v2/dict/school-levels`、`/v2/dict/school-grades`、`/v2/dict/school-subjects`、`/v2/dict/difficulties`、`/v2/dict/difficulty-types`、`/v2/dict/question-types`、`/v2/dict/question-capacities`、`/v2/dict/material-types`、`/v2/dict/material-props`、`/v2/dict/material-units`、`/v2/dict/file-types`、`/v2/dict/org-types`、`/v2/dict/roles`、`/v2/dict/pref-titles` 等字典接口
  - 前端已有 `SubjectSelectionTree` / `GlobalTree` 树组件，但仍需把业务页面从本地映射和 mock 数据彻底切换到字典/数据库驱动
  - `experiment-manage`、`teacher/question-bank`、`teacher/materials`、`console/system/users`、`console/system/organizations` 均是基础数据优先接入的核心页面
  - 当前阶段的重点是：先把基础数据管理页和依赖它的业务页面统一到真实数据库，再继续推进其余业务模块
- **子任务**：
  1. 梳理所有依赖 `data_*` 的页面、下拉、树选择器和配置面板
  2. 统一前端字典适配层与缓存策略，减少重复请求和重复映射
  3. 将基础数据管理相关页面逐步切换到真实 API，并补齐增删改查能力
  4. 对基础字典管理、系统主数据管理、题库/材料/实验的基础配置项建立统一数据入口
- **验收点**：
  - 所有基础数据下拉/树/选择器均来自真实数据库
  - mock 依赖清理完成
  - 基础数据管理页具备可维护、可扩展、可验收的状态

### P-02 拆解：系统主数据管理重构

- **目标**：把组织、用户、消息能力从“能调用 API”推进到“能完整操作与验收”，并作为全量开发的主数据底座。
- **子任务**：
  1. `console/system/users`：确认列表/详情/新建/编辑/批量状态与 `sys_user` 对应
  2. `console/system/organizations`：确认树、详情、子节点新建、导出与 `sys_org` 对应
  3. 系统消息页面：确认 `sys_msg` 列表、发送、已读状态接口
  4. 校验角色、职称、组织类型字典在系统主数据页面中的使用
- **验收点**：
  - 用户和组织列表真实展示新库数据
  - 新建/编辑后能刷新回显
  - 组织树和用户列表的层级/归属关系正确

### P-03 拆解：实验课程管理重构

- **目标**：完成实验库与实验实例的真实数据展示和筛选。
- **子任务**：
  1. 核对 `experiment-manage` 列表字段与 `/v2/exp` 返回字段映射
  2. 对齐 `subjectId`、`schoolLevelId`、`status`、分页、树筛选的参数传递
  3. 补齐列表/卡片双视图一致性
  4. 验证新建实验入口与实验编辑入口
- **验收点**：
  - 列表筛选正常
  - 字典联动正常
  - 无 mock 数据残留

### P-04 拆解：作业模块重构

- **目标**：完成作业布置、学生任务、批改链路。
- **子任务**：
  1. 核对作业列表字段与 `V2HomeworkItem` 映射
  2. 确认 `CreateHomeworkDialog` 仅依赖真实实验库数据
  3. 校验学生子列表、批改接口与状态刷新
  4. 评估班级字段是否需要进一步联动 `sys_org`
- **验收点**：
  - 作业列表可正常加载
  - 布置作业可提交成功
  - 批改链路可刷新

### P-05 拆解：题库管理重构

- **目标**：完成题库状态流转与驳回原因闭环，并补齐题目基础配置的管理能力。
- **子任务**：
  1. 核对题库列表、选项、状态字段映射
  2. 校验入库/驳回/撤回与 `/v2/question/:id/status` 的交互
  3. 验证 `reject_reason` 展示与提交链路
  4. 确认 `QuestionCard` 各状态渲染一致
  5. 为题型、难度类型、能力侧重点等基础配置提供管理入口或统一字典入口
- **验收点**：
  - 三个 Tab 的数据刷新正确
  - 驳回原因可保存可回显
  - 选项展示无错位

### P-06 拆解：材料资源管理重构

- **目标**：把素材列表、文件关联、后续上传入口统一到真实后端。
- **子任务**：
  1. 核对 `teacher/materials` 当前调用链与 `material_msg` 映射
  2. 确认 `data_file`、`material_msg`、`material_pic`、`material_security` 的展示边界
  3. 评估 `v2-material-api.ts` 与 `/v2/material` 的实际使用情况
  4. 为后续上传/详情/编辑补齐页面结构
- **验收点**：
  - 材料列表正常加载
  - 空态、分页、筛选正常
  - 文件关联字段展示一致

### P-07 拆解：认证与个人中心基础能力

- **目标**：把登录态、个人信息、改密等最小闭环补齐。
- **子任务**：
  1. 对齐 `/v2/auth/login`、`/v2/auth/profile`、`/v2/auth/change-password`
  2. 校验前端登录态注入与角色头部透传
  3. 评估个人中心页面展示需求
- **验收点**：
  - 登录成功可拿到用户信息
  - 个人信息可查看
  - 修改密码可用

### P-08 拆解：数据迁移/初始化验收

- **目标**：保留迁移与初始化结果作为开发基线说明。
- **子任务**：
  1. 仅保留历史执行记录
  2. 不再新增迁移主线任务
- **验收点**：
  - 文档中迁移历史清晰可追溯
  - 不影响当前 P-01 ~ P-07 的推进

## 三、人工验收关键步骤
- 前端资产盘点：确认保留、重构、抽离、废弃范围
- 数据盘点：确认旧表、脏数据、重复数据、孤儿数据
- 清洗规则：确认枚举、时间格式、历史保留策略
- 迁移试跑：确认外键、文件引用、页面展示、异常数据
- 全量迁移：确认数据量、主数据、业务链路、归档结果
- 阶段发布：确认文档与实现一致、风险闭环、回滚可用
---
## 三、任务执行记录

### P-01 ～ P-06 当前开发重构任务拆解

- **P-01 基础字典页面/选择器对接**
  - 目标：统一 `data_*` 字典读取与树形筛选体验
  - 对应 API：`/v2/dict/school-subjects`、`/v2/dict/school-levels`、`/v2/dict/school-grades`、`/v2/dict/difficulties`
  - 对应页面：实验编辑/筛选器、教师侧下拉、题库筛选、组织/材料相关通用筛选
  - 当前状态：进行中
  - 执行摘要（2026-04-21）：前端 `v2-exp-api` 已补齐 `material-*`、`file-types`、`org-types`、`roles`、`pref-titles` 等 GET；新增 `useV2DictCatalog` 并行加载常用字典供控制台/表单复用
  - 下一步：在组织管理、用户表单、材料筛选等页逐步接入 `useV2DictCatalog`，减少重复请求

- **P-02 系统主数据页面重构**
  - 目标：完成 `sys_org / sys_user / sys_msg / sys_log` 的前端接入与管理页重构
  - 对应 API：`/v2/sys-user`、`/v2/sys-org`、`/v2/sys-org/tree`、`/v2/sys-msg`
  - 对应页面：`console/system/users`、`console/system/organizations`、系统消息相关页
  - 当前状态：进行中
  - 执行摘要（2026-04-21，`users` 抽屉）：字段与 `sys_user` 对齐——登录名/姓名/昵称/电话/邮箱/状态/过期日、单角色（`user_role_id`）、组织下拉（`user_org_id` 来自 `/v2/sys-org/tree`）；新建密码至少 6 位；编辑时锁定登录名；批量状态请求体修正为 `ids`；`getConsoleUsersActor` 优先 `NEXT_PUBLIC_V2_BOOTSTRAP_USER_ID`
  - 执行摘要（2026-04-21，`organizations`）：`/v2/sys-org/tree` 扁平行在前端按 `parent_org_id` 组装树；树/详情/新建与 `sys_org` 列一致并接 `data_org_type`、`data_school_grade` 字典；移除不存在的 `org_code`；导出改为当前子树 JSON；页头增加刷新
  - 下一步：`sys_msg` 消息页；权限 Tab 与真实策略表对接；组织 PATCH 编辑（若产品需要）

- **P-03 实验课程管理重构**
  - 目标：以 `exp_library / exp_msg` 为核心恢复实验列表、详情、新建、筛选与分页
  - 对应 API：`/v2/exp-library`、`/v2/exp`、`/v2/dict/*`
  - 对应页面：`experiment-manage`、实验编辑/详情入口
  - 当前状态：进行中
  - 下一步：统一列表筛选、表格卡片状态展示、创建与详情入口的交互

- **P-04 作业模块重构**
  - 目标：恢复作业布置、作业列表、学生子列表和批改链路
  - 对应 API：`/v2/homework`、`/v2/homework/:id/students`、`/v2/homework/students/:seqId/mark`
  - 对应页面：`teacher/assignments`
  - 当前状态：进行中
  - 下一步：补班级选择与 `sys_org` 联动、学生列表与批改操作交互完善

- **P-05 题库管理重构**
  - 目标：恢复题库列表、状态流转、驳回原因与选项展示
  - 对应 API：`/v2/question`、`/v2/question/:id/status`
  - 对应页面：`teacher/question-bank`
  - 当前状态：进行中
  - 下一步：补齐筛选条件、状态切换后的联动刷新与选项展示优化

- **P-06 材料资源管理重构**
  - 目标：恢复材料列表、编辑、删除、文件关联与空态体验
  - 对应 API：`/v2/material`、`/v2/file`
  - 对应页面：`teacher/materials`
  - 当前状态：进行中
  - 下一步：把 `data_file` 资源关联、实验素材创建与编辑的表单字段统一起来

- **P-07 认证与个人中心基础能力**
  - 目标：恢复登录、个人信息、修改密码与权限展示
  - 对应 API：`/v2/auth/login`、`/v2/auth/profile`、`/v2/auth/change-password`
  - 对应页面：登录页、个人中心、账户设置
  - 当前状态：**进行中（2026-04-21）**
  - 执行摘要：移除已不存在的 `/v1/iam/me` 依赖；`useAuth` 改为 `localStorage` 会话 + `GET /v2/auth/profile`；新增 `/login` 与 `v2-auth-api`；个人中心增加 V2 账户区与改密；开发联调可配置 `NEXT_PUBLIC_V2_BOOTSTRAP_USER_ID`
  - 下一步：JWT 或安全 Cookie、与顶栏 `useDemoRole` 的单一事实源收敛、登录拦截路由

- **P-08 数据迁移/初始化验收**
  - 目标：保留迁移与初始化结果作为开发基线说明
  - 对应文档：`0026_e03_migration_trial_run.sql`、`0028_e05_edu_to_v2_migration.sql`、`09-old-schema-analysis.md`
  - 当前状态：完成
  - 下一步：仅保留验收说明，不再作为开发主线

---

### C-02 ～ C-04 + D-04 + D-05 + E-01 ～ E-03 批量执行记录

- **说明**：本批次内容属于旧的迁移/组件抽离阶段记录，当前开发主线已切换至 P-01 ～ P-08 重构任务；此处保留用于追溯历史执行痕迹。

- **任务编号**：C-02/C-03/C-04/D-04/D-05/E-01/E-02/E-03
- **执行日期**：2026-04-20
- **执行人**：AI（辅助执行）
- **执行摘要**：
  - **C-02**：新建 `frontend/src/components/v2/V2StatusBadge.tsx`，支持 exp/question/user/org 四类状态（y/n/t → 中文 Badge）
  - **C-03**：新建 `frontend/src/components/v2/V2Pagination.tsx`，统一分页交互，已可替换各页内联分页
  - **C-04**：新建 `frontend/src/components/v2/V2SubjectLevelFilter.tsx`，学科/学段/年级三级联动筛选条
  - **D-04 用户**：`console/system/users` 已通过 `use-user-list.ts` + `mock-service.ts` 接入真实 `/v1/iam/users` API；同时已创建 `v2-sys-api.ts` 备用
  - **D-04 组织**：原 `console/system/organizations/page.tsx` 已拆分为 `page.tsx` + `page.hooks.ts` + `_components/*`，接入 `/v2/sys-org/tree` 真实 API，组织树与新增组织链路已落地
  - **D-05 材料**：`teacher/materials` 已通过 `teacher-materials-api.ts` + `callNewCoreApi` 接入真实后端；`v2-material-api.ts` 客户端已就绪，`/v2/material` 可用，并具备 `sys_media_*` 后续扩展空间
  - **E-01/E-02**：新建 `docs/iam/08-data-migration-rules-E01-E02.md`，含清洗规则（通用字段/脏数据/枚举映射）+ 5 张核心表字段映射（sys_org/sys_user/exp_msg/material_msg/data_file）
  - **E-03**：新建 `database/migrations/0026_e03_migration_trial_run.sql`，含辅助表创建（migration_id_map/error_log）+ sys_org/sys_user 试跑迁移（LIMIT 50）+ 验证查询
  - **E-04**：`0028_e05_edu_to_v2_migration.sql` 已落地并执行验证，edu_* → V2 业务数据迁移完成；旧库 exp_* / material_* 为空表，采用直接复制的备用脚本未实际执行
- **风险点**：
  - `0026_e03_migration_trial_run.sql` 仍依赖旧库表名与字段命名一致性，后续若旧库结构调整需同步修正
  - `0028_e05_edu_to_v2_migration.sql` 采用 `edu_*` 作为正式迁移来源，验证时需关注 `material_msg` 数量与历史试跑记录的差异
  - F-01～F-03 仍需在正式上线切换后补充人工验收记录
- **是否需要人工验收**：是
- **人工验收结论**：待验收

---

### D-02 + D-03 作业与题库模块页面重构

- **说明**：该记录已包含在当前 `P-04` / `P-05` 重构主线中，保留为历史完成项与已实现能力说明。

- **任务编号**：D-02 / D-03
- **任务名称**：作业模块页面重构 / 题库模块页面重构
- **执行日期**：2026-04-20
- **执行人**：AI（辅助执行）
- **输入内容**：
  - `docs/iam/01-数据库最终开发前设计文档.md`（V2 schema）
  - `frontend/src/app/(dashboard)/teacher/assignments/page.tsx`（旧 mock 实现）
  - `frontend/src/app/(dashboard)/teacher/question-bank/page.tsx`（旧 mock 实现）
- **执行过程**：
  1. 新建 `backend/src/infrastructure/repositories/v2-homework-repository.ts`（作业仓库，JOIN exp_msg 聚合学生统计）
  2. 新建 `backend/src/infrastructure/repositories/v2-question-repository.ts`（题库仓库，含选项批量 JOIN）
  3. 新建 `backend/src/http/routes/v2-homework.ts`（/v2/homework 路由，支持列表/创建/学生子列表/批改）
  4. 新建 `backend/src/http/routes/v2-question.ts`（/v2/question 路由，支持列表/创建/状态更新）
  5. 更新 `backend/src/http/server.ts`，注册两条新路由
  6. 新建 `frontend/src/lib/v2/v2-homework-api.ts`（作业 API 客户端）
  7. 新建 `frontend/src/lib/v2/v2-question-api.ts`（题库 API 客户端）
  8. 新建 `assignments/page.hooks.ts`（作业状态 hook，对接 V2）
  9. 提取 `assignments/_components/CreateHomeworkDialog.tsx`（布置作业对话框）
  10. 提取 `assignments/_components/HomeworkCard.tsx`（作业卡片）
  11. 重写 `assignments/page.tsx`（完全对接 V2，移除 mock 依赖）
  12. 新建 `question-bank/page.hooks.ts`（题库状态 hook，对接 V2）
  13. 提取 `question-bank/_components/QuestionCard.tsx`（题目卡片，支持入库/驳回/撤回）
  14. 重写 `question-bank/page.tsx`（完全对接 V2，移除 mock 依赖）
- **输出结果**：
  - 后端：`exp_homework`/`exp_question` 全套 CRUD 路由上线（/v2/homework, /v2/question），并在 `backend/src/http/server.ts` 注册
  - 前端：assignments、question-bank 两页从 mock 完全切换至真实 V2 数据，单文件均满足 300 行约束
  - 相关状态字段：`exp_question.reject_reason` 已通过迁移脚本补齐，可用于驳回原因持久化
- **关联文件**：
  - `backend/src/infrastructure/repositories/v2-homework-repository.ts`
  - `backend/src/infrastructure/repositories/v2-question-repository.ts`
  - `backend/src/http/routes/v2-homework.ts`
  - `backend/src/http/routes/v2-question.ts`
  - `frontend/src/lib/v2/v2-homework-api.ts`
  - `frontend/src/lib/v2/v2-question-api.ts`
  - `frontend/src/app/(dashboard)/teacher/assignments/`（page.tsx, page.hooks.ts, _components/）
  - `frontend/src/app/(dashboard)/teacher/question-bank/`（page.tsx, page.hooks.ts, _components/）
- **风险点**：
  - assignments 页面原有"班级/实验小组"选择使用 TEACHER_MOCK_CLASSES，当前简化为输入框（class_id 字段）；后续 D-04（组织用户）完成后需联动 sys_org 真实班级数据
  - question-bank 页面题目驳回原因（rejectNote）已通过 `exp_question.reject_reason` 落库，驳回原因链路已闭环
- **是否需要人工验收**：是
- **人工验收结论**：待验收
- **备注**：同步完成 C-01 基础组件抽离（HomeworkCard、QuestionCard、CreateHomeworkDialog），为后续 C-02～C-04 奠定抽离模式。

---

### A-02 历史数据盘点

- **说明**：该结论用于说明当前开发基线已切换为 `bs_exp_data`，不再以原库空表作为迁移失败依据。

- **任务编号**：A-02
- **任务名称**：历史数据盘点
- **执行日期**：2026-04-21
- **执行人**：AI（辅助执行）+ 人工确认
- **输入内容**：
  - 原库：`bs_lab_data`
  - 新库：`bs_exp_data`
  - 迁移与分析文档：`docs/iam/09-old-schema-analysis.md`
- **执行过程**：
  1. 对原库与新库关键表执行行数核对（data_*/sys_*/exp_*/material_*）
  2. 结合迁移脚本执行结果核对已落库数据范围
  3. 与业务方确认历史库定位与后续策略
- **输出结果**：
  - 核对到原库 `bs_lab_data` 与新库 `bs_exp_data` 的 62 张公共表中，原库关键业务表均为 0 条记录
  - 新库已存在基础字典、组织用户、标准试验库与材料库数据；其中 `data_school_level=3`、`data_school_subject=6`、`data_school_grade=12`、`data_role=7`、`sys_org=1`、`sys_user=1`、`exp_library=118`、`exp_library_grade=263`、`material_msg=139`
  - 确认老库不作为完整迁移基线，当前以 `bs_exp_data` 作为新的开发基线
  - 对于新库中暂无数据覆盖的业务域，定义为“功能尚未落地开发”，不视为迁移异常
- **关联文件**：
  - `docs/iam/09-old-schema-analysis.md`
  - `database/migrations/0026_e03_migration_trial_run.sql`
  - `database/migrations/0028_e05_edu_to_v2_migration.sql`
- **风险点**：
  - 后续若补充历史数据回灌，需先补齐字段映射与幂等导入策略
  - 未落地功能上线前需补最小可用数据与验收用例
- **是否需要人工验收**：是
- **人工验收结论**：通过（以新库为开发基线）
- **备注**：本任务结论用于解释当前部分业务表为空的合理性：属于功能未落地阶段，不属于迁移失败；后续如补充历史回灌，需先做字段映射与幂等策略评审。

---

### A-03 文档基线确认

- **任务编号**：A-03
- **任务名称**：文档基线确认
- **执行日期**：2026-04-20
- **执行人**：AI（辅助执行）
- **输入内容**：
  - `docs/iam/00-数据库开发前规范与字段设计审核稿-正式提交版.md`（V2.0，架构审核/开发前冻结版）
  - `docs/iam/01-数据库最终开发前设计文档.md`（V1.0，架构定稿版）
  - `database/baseline/`（Navicat 等导出快照，结构对照真源；原 `docs/iam/01-iam-schema.final.sql` 已删除）
- **执行过程**：
  1. 核查三份设计文档内容的一致性与完整性
  2. 确认 8 个业务模块（基础字典、系统主数据、素材资源、标准试验库、作业仲裁、社交互动、题库答题、积分激励）覆盖完整
  3. 确认以下冻结项全部已落实到设计文档：
     - 时间字段统一为 DATETIME
     - 明显拼写错误已纠正
     - 核心主表审计字段已补齐
     - 作业快照机制（teacher_exp_id）已冻结
     - data_file.file_size / file_ext 已纳入
     - sys_org.org_path 已纳入
     - exp_question_select.question_id 已补齐
     - exp_arbitration_notlike 保留并限定展示场景
  4. 基于文档基线，生成 V2 完整数据库迁移文件
- **输出结果**：
  - 新建：`database/migrations/0024_v2_full_schema_init.sql`（完整 V2 数据库结构，全部 8 模块，共 57 张表）
  - 更新：`database/schema.sql`（改为指向 `database/baseline/` 的索引说明，非全量 DDL）
- **关联文件**：
  - `database/migrations/0024_v2_full_schema_init.sql`
  - `database/schema.sql`
  - `docs/iam/00-数据库开发前规范与字段设计审核稿-正式提交版.md`
  - `docs/iam/01-数据库最终开发前设计文档.md`
- **风险点**：
  - 数据库迁移文件仅创建新表，不含初始化数据，需另行准备种子数据脚本
  - 现有迁移 0001-0023 中的 IAM 表（iam_tenants/iam_org_nodes/iam_users）与新 V2 结构（sys_org/sys_user）存在业务语义重叠，切换时需人工确认数据迁移策略
  - 迁移文件尚未在真实数据库上执行验证，需人工试跑
- **是否需要人工验收**：是
- **人工验收结论**：待验收
- **备注**：本次执行完成了数据库结构基线冻结。后续 B 阶段开发可依据 `0024_v2_full_schema_init.sql` 开始 ORM 模型层搭建。

---

## 四、人工验收记录

### A-03 待验收事项

- **验收任务编号**：A-03
- **验收任务名称**：文档基线确认
- **验收人**：（待填写）
- **验收时间**：（待填写）
- **验收范围**：
  - [ ] 确认 `0024_v2_full_schema_init.sql` 在目标数据库可正常执行（无外键冲突、无语法错误）
  - [ ] 确认全部 57 张表均已创建成功
  - [ ] 确认枚举值设计与规范文档一致（status y/n/t，choose_type y/n 等）
  - [ ] 确认核心主表（sys_org, sys_user, exp_library, exp_msg, material_msg, exp_homework, exp_question）的审计字段已补齐
  - [ ] 确认 exp_homework_student.teacher_exp_id 字段已存在（快照机制）
  - [ ] 确认 exp_arbitration_notlike 表已创建
  - [ ] 确认 data_file.file_size 和 data_file.file_ext 已存在
  - [ ] 确认 sys_org.org_path 已存在
  - [ ] 确认 exp_question_select.question_id 已存在
- **验收结论**：（待填写）通过 / 不通过 / 需修改
- **验收问题**：（待填写）
- **处理意见**：（待填写）
- **复验结果**：（待填写）
- **备注**：验收通过后即可启动 B-01（后端目录结构建立）和 B-03（类型定义与模型层建立）任务。

---

### D-02 / D-03 待验收事项

- **验收任务编号**：D-02 / D-03
- **验收任务名称**：作业模块页面重构 / 题库模块页面重构
- **验收人**：（待填写）
- **验收时间**：（待填写）
- **验收范围**：
  - [ ] 启动后端，访问 `GET /v2/homework` 接口返回正常（200 或空列表）
  - [ ] 访问 `GET /v2/question` 接口返回正常
  - [ ] 前端 `/teacher/assignments` 页面加载无控制台错误，列表区呈现正常（空态或数据）
  - [ ] 点击「布置作业」弹框，实验库下拉从 `/v2/exp-library` 正常加载
  - [ ] 前端 `/teacher/question-bank` 页面三个 Tab（待处理/已入库/已驳回）均正常渲染
  - [ ] 题目入库/驳回/撤回操作后状态即时刷新（对接 PATCH /v2/question/:id/status）
  - [x] `exp_question.reject_reason` 字段已在 `bs_exp_data` 执行 `0025_exp_question_add_reject_reason.sql` 后确认存在（2026-04-20 人工验收）
  - [ ] 所有页面单文件行数均在 300 行以内（已由 AI 验证，人工可抽查）
- **验收结论**：（待填写）通过 / 不通过 / 需修改
- **验收问题**：（待填写）
- **处理意见**：（待填写）
- **复验结果**：（待填写）
- **备注**：assignments 班级字段后续联动 sys_org（D-04 完成后处理）；`reject_reason` 字段已落库，驳回原因持久化链路完整。

---

### C-02～C-04 / D-04 / D-05 / E-01～E-04 验收事项

- **验收范围**：
  - [ ] `V2StatusBadge`：在已重构页面中引入，验证 y/n/t 各状态中文 label 与颜色正确
  - [ ] `V2Pagination`：在 assignments 或 experiment-manage 页替换内联分页，验证翻页正常
  - [ ] `V2SubjectLevelFilter`：接入 experiment-manage 筛选区，验证学科/学段/年级联动正常
  - [ ] `console/system/organizations` 页：启动后端，访问 `/v2/sys-org/tree` 接口返回正常；前端左侧机构树正常展开
  - [ ] 新建组织节点：填写名称+类型后提交，POST `/v2/sys-org` 成功并在树中刷新
  - [ ] `teacher/materials` 页：素材列表正常加载（已接旧版 API，无回归）
  - [x] E-03：`iam_org_nodes` → `sys_org` 1条，`iam_users` → `sys_user` 1条，error_log 为空（2026-04-21 验收通过）
  - [x] E-04：`09-old-schema-analysis.md` 已确认旧库 `sys_* / exp_* / material_* / social_* / scale_*` 与 V2 基本一致，正式迁移采用直接复制策略；`0027_e04_full_migration.sql` 作为备用未实际执行
  - [x] E-05：`edu_*` → V2 迁移完成（2026-04-21 验收通过）
    - data_school_level 3/3，data_school_subject 6/6，data_school_grade 12/12，data_role 7/7
    - exp_library 118/118，exp_library_grade 263/263，material_msg 139（≈138，多1条为历史试跑记录）
- **验收结论**：数据库迁移阶段（E-03 / E-04 / E-05）**人工验收通过**，bs_exp_data 已完成基础数据初始化
- **迁移脚本清单**：
  - `0026_e03_migration_trial_run.sql`：iam_* → sys_* UUID 映射迁移试跑
  - `0027_e04_full_migration.sql`：备用直接复制脚本（未实际执行）
  - `0028_e05_edu_to_v2_migration.sql`：edu_* → V2 正式迁移脚本（已执行并验收）
  - `docs/iam/09-old-schema-analysis.md`：旧库结构分析与迁移策略说明

---
## 五、任务记录模板
- 任务编号：
- 任务名称：
- 执行日期：
- 执行人：
- 输入内容：
- 执行过程：
- 输出结果：
- 关联文件：
- 风险点：
- 是否需要人工验收：
- 人工验收结论：
- 备注：
---
## 六、验收记录模板
- 验收任务编号：
- 验收任务名称：
- 验收人：
- 验收时间：
- 验收范围：
- 验收结论：通过 / 不通过 / 需修改
- 验收问题：
- 处理意见：
- 复验结果：
- 备注：