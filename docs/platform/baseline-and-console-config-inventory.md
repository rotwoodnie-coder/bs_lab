# 基线冻结与后台配置：全库清单与归类方案

> **结构真源**：`database/migrations/bs_exp_data.sql`（与 `database/baseline/README.md` 约定一致）。  
> **API 真源**：`backend/src/http/server.ts` 挂载的 `routeV2*`。  
> **控制台真源**：`frontend/src/app/(dashboard)/console/**/page.tsx`。  
> 本文用于：**整理基础配置数据、决定哪些冻结进种子、哪些需要控制台 CRUD、导航如何归类**。

---

## 1. 治理分层（建议统一口径）

| 层级 | 含义 | 典型载体 | 交付形态 |
|------|------|----------|----------|
| **L0 基线冻结** | 新环境必须一致、极少变更；变更走迁移与评审 | 大部分 `data_*` 字典、`data_role` 种子 | **编号迁移 SQL** + 可选 **只读** 控制台 |
| **L1 可配置主数据** | 实施期常改，但有 FK 约束需校验 | `sys_org`、`data_org_type`（已支持）、`scale_title`、`data_coursebook*` 树 | **控制台 CRUD** + `/v2/*` 写接口 |
| **L2 运行时数据** | 随业务增长、可审计、一般不做「基线包」 | `scale_log`、`sys_msg`、`exp_homework*`、社交表等 | **控制台查询/导出**；修正走专用运维接口 |
| **L3 运维与联调** | 环境、追踪、迁移 | `sys_log`、`migration_*`（若库内存在） | **审计页、部署页**；**不放入「配置管理」**，见第 2.3 节 |

下文「需要后台配置」包含 **L0 展示 + L1 维护**；**L2** 标为「运维视图」；**L3** 单列。

---

## 2. 推荐「配置管理」导航大类（整合方案）

将控制台中分散的 **系统 / 资源 / 字典 / 实验** 入口，收敛为 **「配置管理」** 一级菜单，下挂 **二级分组**（避免单列表过长）：

| 二级分组 | 覆盖域 | 建议纳入的现有路由（示例） |
|----------|--------|------------------------------|
| **A. 系统与权限** | `sys_*`、`data_role`、`data_org_type` | `/console/system/organizations`、`/console/system/users`、`/console/system/roles` |
| **B. 教学与学段** | `data_school_*` 含矩阵 | `/console/resources/subject-grades` |
| **C. 主数据字典** | 其余单行 `data_*`（含已单独实现的 `data_org_type`） | **推荐**：见 **第 7 节「万能字典模块」**；过渡期仍可用 `/v2/dict/*` 只读 |
| **D. 教材与课程结构** | `data_coursebook*` 三层 | `/console/resources/textbooks`、`/console/resources/config/textbook-reference` |
| **E. 实验目录与标准库** | `exp_library*`、`exp_msg` 目录侧 | `/console/resources/experiments`、`/console/resources/config/experiment-catalog` |
| **F. 实验资源与素材** | `material_*`、教师素材类型、文件 | `/console/resources/config/experimental-materials`、`/console/resources/config/teacher-materials`、`/console/resources/media` |
| **G. 积分与激励** | `scale_title`、`scale_log`、`sys_user.per_score`；**不含** `data_rating_scale`（见下） | 称号规则 CRUD + 与 **`data_role` 联动展示**；流水只读/导出；**`data_rating_scale` 归入 C（评分档字典）**，避免与积分流水混名 |

**不归入「配置管理」、保留运营中心**：评审、实验圈、法庭、报告模板、数据分析、题库「运营」侧（与 **L2** 强绑定）。

### 2.1 与「平台运维」分离（避坑）

| 原表记 **H** | 调整 |
|--------------|------|
| `sys_log`、部署、AI 策略、`sys_msg` 的**运维级**操作 | **不要**挂在「配置管理」下，避免业务管理员误触 **L3** 能力。建议单独一级：**「运维中心」** / **「系统监控」**（仅更高权限角色可见），保留现有 `/console/platform/*`、`/console/ai/strategies` 等路径或整体搬迁至 `console/operations/`（命名可再定）。 |

### 2.2 前端目录结构对齐（重构时建议）

与「配置管理」对应的路由根目录建议（**物理目录便于 Cursor 分域重构**；与当前 `system`、`resources` 可渐进迁移或做 re-export）：

```text
frontend/src/app/(dashboard)/console/settings/   # 「配置管理」壳与布局
  ├── system/        # A. 系统与权限（可由 console/system 迁入或代理）
  ├── education/     # B. 教学与学段（subject-grades）
  ├── dictionaries/  # C. 主数据字典（万能字典 + 特例页如 org-type 若保留）
  ├── textbooks/     # D. 教材结构
  ├── experiments/   # E. 实验标准库与目录配置
  ├── materials/     # F. 材料与素材、媒体
  └── incentives/    # G. 积分与激励（scale_title、流水只读等）
```

**运维类** 建议平行存在，例如：

```text
frontend/src/app/(dashboard)/console/operations/  # 或沿用 console/platform/
  ├── audit-log/
  ├── deployments/
  ├── notifications/   # 若偏运维视角
  └── ...
```

### 2.3 `data_rating_scale` 与「积分」的 UI 隔离

- **`data_rating_scale`**：字典「评分档」，放在 **C 主数据字典**（万能字典或独立小页）。  
- **`scale_log` / `scale_title` / `per_score`**：放在 **G 积分与激励**。  
- 产品文案与菜单上 **禁止** 共用「积分」一词指代 `data_rating_scale`，减少运营误操作。

---

## 3. 全表罗列（0024 全部 `CREATE TABLE`）

### 3.1 基础字典 `data_*`（单行字典为主）

| 表名 | 父表 / 说明 | 建议治理层 | 控制台 / API |
|------|----------------|------------|----------------|
| `data_msg_type` | — | L0/L1 | `GET /v2/dict/msg-types`；**优先** 万能字典写能力 |
| `data_school_level` | — | L0/L1 | dict + subject-grades 写接口 |
| `data_school_grade` | 逻辑上挂学段 | L0/L1 | dict + subject-grades |
| `data_school_subject` | — | L0/L1 | dict + subject-grades |
| `data_school_grade_subject` | **子关系**：年级×学科 | L0/L1 | subject-grades 矩阵 |
| `data_material_security` | — | L0/L1 | dict；材料配置页间接使用 |
| `data_material_type` | — | L0/L1 | dict |
| `data_material_prop` | — | L0/L1 | dict |
| `data_material_unit` | — | L0/L1 | dict |
| `data_file_type` | — | L0/L1 | dict |
| `data_org_type` | — | L1 | dict + **`/v2/sys-org-types`**（特例）；也可后续并入万能字典白名单 |
| `data_role` | — | L0/L1 | dict + 角色页 `/v2/sys-role` |
| `data_pref_title` | — | L0/L1 | dict |
| `data_rating_scale` | — | L0/L1 | dict；**语义：评分档**，非 `scale_log` 积分流水 |
| `data_exp_difficulty` | — | L0/L1 | dict |
| `data_difficulty_type` | — | L0/L1 | dict |
| `data_question_type` | — | L0/L1 | dict |
| `data_question_capacity` | — | L0/L1 | dict |
| `data_coursebook` | 教材根 | L1 | `/v2/coursebook` + textbooks |
| `data_coursebook_chapter` | **子**：`coursebook_id` | L1 | 同上 |
| `data_coursebook_unit` | **孙**：`chapter_id` | L1 | 同上 |

### 3.2 系统主数据 `sys_*` 与文件登记

| 表名 | 父表 / 说明 | 建议治理层 | 控制台 / API |
|------|----------------|------------|----------------|
| `sys_org` | 树 `parent_org_id`、`org_type_id`→`data_org_type` 等见 `database/migrations/bs_exp_data.sql`；教师授课选班 UI 遍历规则见 `docs/platform/sys-org-tree-teacher-class.md`（不替代 SQL） | L1 | `/v2/sys-org*` + 组织管理 |
| `sys_user` | 含 `per_score` 积分汇总列 | L1/L2 | `/v2/sys-user*` + users；积分汇总展示可并入 **G** |
| `sys_user_role` | **子**：用户×角色×组织 | L1 | **推荐**：**不做独立「表管理」页**；在 **用户管理详情 Sheet/Dialog** 内以 **「勾选角色 + 可选组织范围」** 维护，符合操作习惯；底层仍写 `sys_user_role` |
| `sys_msg` | 消息实例 | L2 | `/v2/sys-msg` + notifications |
| `sys_log` | 审计 | L3 | audit-log → **运维中心** |
| `data_file` | 文件元数据 | L1/L2 | `/v2/file` + media；**上传链路**见 **第 8 节** |

### 3.3 材料主数据 `material_*`

| 表名 | 父表 | 建议治理层 | 控制台 / API |
|------|------|------------|----------------|
| `material_msg` | 材料主行 | L1/L2 | experimental-materials + `/v2/material` |
| `material_pic` | **子**：材料图 | L1/L2 | 同上；**应引用 `data_file`/file_id**，见第 8 节 |
| `material_security` | **子**：材料安全 | L1/L2 | 同上 |

### 3.4 标准试验库 `exp_library*`

| 表名 | 父表 | 建议治理层 | 控制台 / API |
|------|------|------------|----------------|
| `exp_library` | 根 | L1 | `/v2/exp-library` + experiments 域 |
| `exp_library_grade` | **子**：`lib_exp_id` | L1 | 同上 |
| `exp_library_video` | **子**：`lib_exp_id` | L1 | 同上 |

### 3.5 区校本实验与内容族 `exp_*`（以 `exp_msg` 为业务根）

| 表名 | 父表 | 建议治理层 | 说明 |
|------|------|------------|------|
| `exp_msg` | 实验/目录根 | L1/L2 | 目录元数据偏 L1；正文与资源偏 L2 |
| `exp_grade` | `exp_id` | L1/L2 | 子表 |
| `exp_video` / `exp_pic` | `exp_id` | L1/L2 | 子表 |
| `exp_material` | `exp_id` | L1/L2 | 子表 |
| `exp_material_pic` / `exp_material_security` | `exp_material` | L1/L2 | 孙级 |
| `exp_step` / `exp_result` / `exp_security` | `exp_id` | L1/L2 | 子表 |
| `exp_reference` / `exp_reference_video` | `exp_id` | L1/L2 | 子表 |
| `exp_scientist` | `exp_id` | L1/L2 | 子表 |
| `exp_simulation_record` | 模拟记录 | L2 | 运行数据 |
| `exp_homework` | 作业头 | L2 | `/v2/homework` |
| `exp_homework_student` | **子**：`work_id` | L2 | 子表 |

### 3.6 仲裁与社交 `exp_arbitration*`、`social_*`

| 表名 | 父表 | 建议治理层 | 控制台 |
|------|------|------------|--------|
| `exp_arbitration` | 根 | L2 | review / court |
| `exp_arbitration_like` / `exp_arbitration_notlike` | **子** | L2 | 同上 |
| `social_like` / `social_notlike` / `social_collection` / `social_evaluate` | 多根 | L2 | dynamics 等 |

### 3.7 题库 `exp_question*`

| 表名 | 父表 | 建议治理层 | 控制台 / API |
|------|------|------------|----------------|
| `exp_question` | 根 | L1/L2 | `/v2/question` + assessment/questions |
| `exp_question_select` | **子** | L1/L2 | 子表 |
| `exp_question_answer` | **子** | L1/L2 | 子表 |
| `exp_question_answer_select` | **孙** | L1/L2 | 子表 |

### 3.8 积分与激励 `scale_*`

| 表名 | 父表 | 建议治理层 | 控制台 / API |
|------|------|------------|----------------|
| `scale_title` | 规则行，`role_id`→`data_role` | **L1** | **G 类亮点页**：列表/表单中 **显式展示角色名称 + 达标积分下限 + 称号**；与 `data_role` 强联动 |
| `scale_log` | 流水，`user_id`→`sys_user` | **L2** | `POST/GET /v2/scale/log*`；**只读列表 + 导出** 进 **G** |
| （列）`sys_user.per_score` | 用户汇总 | L2 | 由流水驱动；管理员校准需单独策略 |

---

## 4. 分阶段「冻结 / 配置」实施建议

### 阶段 1：基线包（L0）

- 输出 **单库初始化顺序**：`data_role` → `data_org_type` → 其余 `data_*`（注意 FK 顺序）→ `scale_title`（依赖 `data_role`）→ `sys_org` 根节点种子（若有）→ 教材树空壳或样例。
- **首次在「重构完成后」部署到新环境时**：按环境策略 **清空或隔离旧的字典测试数据**，再执行 **0024 及后续编号迁移**，避免与旧 IAM/旧字典混用（与 `database/baseline/README.md` 流程一致）。

### 阶段 2：控制台「配置管理」收敛（L1）

- 导航按 **第 2 节** 大类落地；物理目录参考 **第 2.2 节**。
- **C**：落地 **万能字典模块**（第 7 节），替代「每个 `data_*` 一套 CRUD」。
- **G**：落地 **`scale_title` 管理 UI**（角色联动）；`scale_log` 只读/导出。

### 阶段 3：运行时与运维（L2/L3）

- `scale_log`、`sys_msg`、大表 `exp_*` 正文：提供 **筛选 + 导出 + 只读详情**；人工改分/改流水走 **工单 + 专用 PATCH**（若产品需要）。
- **L3** 全部归 **运维中心**，与配置管理 **权限隔离**。

---

## 5. 迁移纪律与「基线冻结」（避坑）

| 规则 | 说明 |
|------|------|
| **基线 SQL 不可回头乱改** | 结构真源为 **`database/migrations/bs_exp_data.sql`**（与 `database/baseline/README.md` 一致）；已发布环境的结构演进须走 **编号迁移 / 合并回基线** 流程，**禁止**在未评审情况下手改已发布基线后假装多环境一致。 |
| **种子与迁移同源** | L0 数据优先由 **迁移文件** 写入；控制台修改 L1 数据后，若需回灌新环境，应 **导出为迁移补丁** 或受控 seed，而不是手改基线 SQL。 |
| **环境首次对齐** | 文档化：哪些表允许控制台写、哪些 **仅迁移**；与「万能字典」白名单对齐，防止未审计表被开放写接口。 |

---

## 6. 缺口摘要与补齐策略（第一版上线风险）

| 领域 | 原缺口 | **补齐策略（落地）** |
|------|--------|----------------------|
| 字典 | 多数 `data_*` 无 CRUD | **万能字典**：后端统一 **`/v2/admin/dict/{tableName}`**（或等价路径）+ 元数据（列类型、必填、白名单表）；前端 **单套 Table + 动态表单**；**特例**（强业务校验）保留独立路由（如已实现的 `sys-org-types`）。 |
| 权限 | `sys_user_role` 无专门页 | **集成在用户详情**：Sheet 内 **勾选角色 / 组织范围**，避免独立矩阵页导致心智分裂。 |
| 积分 | `scale_title` / `scale_log` 无管理端 | **G**：`scale_title` 全 CRUD + **角色联动文案**；`scale_log` 只读 + 导出。 |
| 导航 | 入口分散 | **settings/** 收敛 + **operations/** 运维分离（第 2 节）。 |

---

## 7. 「万能字典」模块设计要点（后端 + 前端）

- **白名单**：仅允许列入 **`data_*`**（及评审通过的少量视图）中的表名；**禁止** 任意表名拼接 SQL。  
- **行级元数据**：可从 INFORMATION_SCHEMA 或手写 JSON 映射（列标签、是否可编辑、枚举、`status` 约定）。  
- **FK 删除**：与现有一致——删除前检查引用或仅允许 **停用**（`status=n`）。  
- **审计**：写操作记 `sys_log`（若已有字段）或独立审计表（后续）。  
- **与 `/v2/dict/*` 关系**：GET 可继续走 dict 只读；写统一走 admin dict，减少分叉。

---

## 8. 数据分离与上传链路巡检（`data_file` ↔ `material_*`）

**目标**：业务表不直接「吞 URL」替代文件主数据；**先文件登记、再业务引用**。

| 层级 | 要求 |
|------|------|
| **后端** | 上传完成后 **先写入 `data_file`**（及对象存储），拿到 **`file_id`**；再写 **`material_pic`**（或其它子表）中的 **外键/引用字段**。禁止在未建 `data_file` 行时把临时 URL 写入业务表作为主关联。 |
| **前端** | 上传组件返回值应为 **`file_id`（+ 可选预览 URL）**；业务表单提交 **传 file_id**，由后端组装或校验；**不把** 裸 URL 当作 `material_pic` 的唯一关联写入。 |
| **巡检（Code Review / CI）** | 全局搜 `material_pic`、`material_msg`、`exp_material_pic` 等写入路径；确认均经过 **file 服务** 或统一 repository。 |

### 8.1 教师端「实验素材库」列表范围（`/teacher/materials`）

| 环境变量 | 含义 |
|----------|------|
| `NEXT_PUBLIC_TEACHER_MATERIALS_SCOPE=platform` | **不按** `material_msg.create_user_id` 拉列表（组织/平台素材库：全员可见库内全部未删素材）。未设置或其它值时：教师/学生等仅看本人；教研员、区管、超管仍看全库。 |

侧栏「类型」依赖 **`/v2/teacher-material-types`** 与库表 `edu_teacher_material_types` / `teacher_material_type`（见迁移 **0019** / **0033**）。若接口为空或当前角色被 `visible_roles` 全部筛掉，前端会回退到内置 `word` / `ppt` / … 选项，避免只剩「全部」。

---

## 9. AI 辅助重构（Cursor）提示

1. **先迁壳后迁页**：新增 `console/settings/layout.tsx` 与侧栏配置，再把旧 `console/system/*`、`resources/config/*` **逐页搬迁或 re-export**，避免 Big Bang。  
2. **每迁一页更新导航矩阵**：`admin-nav.ts`、`dashboard-nav.ts`、`to-app-shell-nav.ts` 与本文 **第 2 节** 同步。  
3. **万能字典最后接白名单**：先迁 UI 壳与 **只读** 字典列表，再开放写；避免半套开放导致误写 `data_role` 等敏感表。  
4. **让 AI 对照本文第 3 节表格** 生成迁移检查清单（checkbox），而不是让 AI 猜表名。

---

## 10. 维护说明

- 新增表或路由后：在本文件 **第 3 节** 增补一行，并更新 **第 2、4、6、7、8 节** 归类与缺口（若涉及文件与材料边界）。  
- 与 IAM 文档冲突时，以 **`database/baseline/README.md`** 与 **0024** 为准；**结构变更只通过新编号迁移**。
