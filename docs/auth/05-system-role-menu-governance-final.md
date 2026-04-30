# 系统角色功能菜单治理与权限配置方案

- 文档版本：3.0（整合全部审计意见与 PRD 补充）
- 生效日期：2026-05-01
- 适用范围：7 大角色（系统管理员、区管、校管、教研员、教师、学生、家长）
- 技术前提：`sys_menu` + `sys_role_menu_perm` 权限模型；前端动态菜单 + 路由守卫；后端权限校验与审核闭环
- 相关文档索引：`docs/auth/03-permission-console-first-version-design.md`、`docs/contracts/`、PRD 需求文档

---

## 0. 总体结论

本方案是角色定位、菜单治理、权限初始化、审核闭环、PRD 能力对齐的最终整合版。

### 关键原则

- 菜单数量 ≠ 权限高低，最终以授权数据为准。
- 角色分层：3 层治理 + 2 层业务 + 2 层使用。
- 审核闭环：教师实验 → 教研员审核；学生作品 → 校管理员审核；教研课题组 → 教研员审核。
- 默认权限按 `menu_code` 白名单逐条落库，避免全量误授。
- 权限配置台直接承载，不改核心模型。

---

## 1. 角色分层与职责（最终版）

| 层级 | 角色代码 | 角色名称 | 职责边界 | 典型菜单 |
|---|---|---|---|---|
| 治理层 | `Role_Sys_Admin` | 系统管理员 | 系统配置、运维、权限分配、全局数据修复（不参与业务审核） | 用户管理、角色管理、组织管理、运维中心、家长绑定审核 |
| 治理层 | `Role_District_Admin` | 区级管理员 | 管辖全区学校、用户、基础组织，查看区级统计 | 区组织管理、学校管理、用户管理、班级管理（全区）、区级审批 |
| 治理层 | `Role_School_Admin` | 校级管理员 | 管理本校班级、教师、学生，分配教学班级；审核学生实验作品 | 本校班级管理、本校教师管理、学生管理、教学班级分配、学校统计、作品审核 |
| 业务层 | `Role_Researcher` | 教研员 | 管理实验/题库/教材/教研组资源；审核教师实验课程；审核教研课题组 | 实验管理、题库管理、教材管理、教研组管理、实验审核、课题组审核 |
| 业务层 | `Role_Teacher` | 教师 | 管理个人教学班级、课堂、作业、实验；提交实验审核；布置/批阅作业；创建教研课题组 | 我的教学班级、我的课堂/作业、实验管理、资源中心、我的课题组 |
| 使用层 | `Role_Student` | 学生 | 完成实验、任务，查看成长记录；上传实验作品 | 实验广场、任务中心、成长足迹、个人中心 |
| 使用层 | `Role_Parent` | 家长 | 查看孩子进度，协助家庭实验，查看实验报告 | 任务中心、家庭实验室、孩子进度、实验报告 |

---

## 2. 最终页面清单与治理状态（含 PRD 补充）

### 2.1 保留页面（功能完整，必须上线）

| 路径 | 页面名称 | 菜单显示名称 | 归属层级 | 默认读角色 | 默认写角色 |
|---|---|---|---|---|---|
| `/dashboard` | 工作台 | 工作台 | 通用 | 所有角色 | 无 |
| `/profile` | 个人中心 | 个人中心 | 通用 | 所有角色 | 所有角色 |
| `/user-management` | 用户管理 | 用户管理 | 治理层 | 系统、区、校管 | 系统、区、校管（按范围） |
| `/org-management` | 组织管理 | 组织管理 | 治理层 | 系统、区、校管 | 系统、区、校管（按范围） |
| `/parent-bindings` | 家长绑定审核 | 家长绑定审核 | 治理层 | 系统、区、校管 | 系统、区、校管 |
| `/class-management` | 班级管理 | 班级管理（含教师分配） | 治理层 | 区管、校管 | 区管、校管（校管仅本校） |
| `/teacher-experiment-manager` | 实验管理（教师） | 实验管理 | 业务层 | 教研员、教师 | 教研员、教师（教师可提交审核） |
| `/textbook-management` | 教材管理 | 教材管理 | 业务层 | 教研员、教师 | 教研员 |
| `/teacher-classroom` | 教师课堂 | 我的教学班级 | 业务层 | 教师 | 教师（发布任务等） |
| `/teacher-tasks` | 教师任务中心 | 我的课堂 / 作业 | 业务层 | 教师 | 教师（布置/批阅） |
| `/student-tasks` | 学生任务中心 | 任务中心 | 使用层 | 学生 | 学生（提交作业/作品） |
| `/student-growth` | 成长足迹 | 成长足迹 | 使用层 | 学生、家长（只读） | 无 |
| `/family-lab` | 家庭实验室 | 家庭实验室 | 使用层 | 家长 | 家长（提交结果） |
| `/ops/dashboard` | 运维中心 | 运维中心 | 治理层 | 系统管理员 | 系统管理员 |
| `/school-statistics` | 学校统计 | 学校统计 | 治理层 | 校管 | 校管（只读） |
| `/district-statistics` | 区域统计 | 区域统计 | 治理层 | 区管 | 区管（只读） |
| `/review/experiments` | 实验审核 | 实验审核 | 业务层 | 教研员 | 教研员 |
| `/review/student-works` | 作品审核 | 作品审核 | 治理层 | 校管理员 | 校管理员 |
| `/review/research-groups` | 课题组审核 | 课题组审核 | 业务层 | 教研员 | 教研员 |
| `/resource-center` | 资源中心 | 宝山 100 / 资源中心 | 业务层 | 教师、教研员 | 无（系统管理员可维护） |
| `/parent/reports` | 实验报告 | 实验报告 | 使用层 | 家长 | 无 |
| `/experiment-square` | 实验广场 | 实验广场 | 通用/使用层 | 学生、家长、教师、教研员 | 无 |
| `/my-research-groups` | 我的课题组 | 我的课题组 | 业务层 | 教师 | 教师（创建/编辑/提交） |

### 2.2 暂不展示（开发中，保留路由）

- `/role-management`
- `/question-bank`
- `/research-group`（原教研组管理，部分功能移到课题组审核）
- `/experiment-library`（旧学生端）
- `/system/config`

### 2.3 完全隐藏（删除或拦截）

- `/mock-page`
- `/deprecated/*`

### 2.4 合并与重命名

- 教师端：`/teacher-classroom` 和 `/teacher-tasks` 归为“我的教学中心”分组。
- 学生端：`/student-tasks` 和 `/student-growth` 归为“学习中心”分组。

---

## 3. 审核闭环与业务规则（最终整合）

### 3.1 教师实验课程审核

- 教师在 `/teacher-experiment-manager` 创建实验。
- 点击“提交审核”后，状态变更为“待审核”。
- 教研员在 `/review/experiments` 通过/驳回，并填写驳回理由。
- 通过后进入 `/experiment-square`，对学生/家长可见。

### 3.2 学生实验作品审核

- 学生在 `/student-tasks` 上传作品，状态为“待审核”。
- 校管理员在 `/review/student-works` 通过/驳回。
- 通过后作品进入 `/experiment-square` 展示。

### 3.3 教研课题组审核

- 教师在 `/my-research-groups` 创建课题组（名称、成员、简介）。
- 提交后教研员在 `/review/research-groups` 审核。
- 通过后课题组生效，教师可管理成员、发起活动。

### 3.4 作业布置与批阅

- 教师在 `/teacher-tasks` 选择班级（仅显示自己被分配的班级）并布置作业。
- 学生在 `/student-tasks` 查看并提交作业。
- 教师批阅并反馈到个人任务中心。
- 家长通过孩子进度只读查看。

### 3.5 家长四阶联动（PRD）

- 指导：家长在 `/family-lab` 查看视频/图解/原理。
- 记录：亲子实验自动生成记录，在 `/parent/reports` 生成个性化报告。
- 分享：支持一键分享到社区，与 `/experiment-square` 互动。

### 3.6 教师三位一体（PRD）

- 学习：`/resource-center` 提供“宝山 100”级标杆资源。
- 使用：教师可调用 AI 生成实验方案（Mock 阶段可用配置模板）。
- 建设：教师可提交自创实验到资源库，经教研员审核后上架。

---

## 4. 菜单分组与默认权限（角色视图）

| 角色 | 可见菜单（读） | 可写菜单 |
|---|---|---|
| 系统管理员 | 所有治理类 + 业务类（只读） + 审核菜单（只读） | 所有治理类（用户、角色、组织、班级、运维、统计）；审核菜单不写 |
| 区管理员 | 全区治理（用户、组织、班级、统计） | 区级治理类 |
| 校管理员 | 本校治理（用户、班级、统计）、作品审核 | 本校治理、作品审核 |
| 教研员 | 业务类（实验、教材、教研组）、实验审核、课题组审核 | 业务类、实验审核、课题组审核 |
| 教师 | 我的教学班级/课堂/作业、实验管理、资源中心、我的课题组 | 个人教学相关、实验提交审核、课题组创建/编辑 |
| 学生 | 实验广场、任务中心、成长足迹 | 任务提交、作品上传 |
| 家长 | 任务中心、家庭实验室、孩子进度、实验报告 | 家庭实验室（提交结果） |

---

## 5. 默认授权 SQL 模板（统一命名规范）

```sql
-- 为教研员授权课题组审核
INSERT IGNORE INTO sys_role_menu_perm (seq_id, role_id, menu_id, can_read, can_write)
SELECT CONCAT('RM_', 'Role_Researcher', '_', menu_id), 'Role_Researcher', menu_id, 1, 1
FROM sys_menu WHERE menu_code = 'review_research_groups';

-- 为教师授权资源中心（只读）
INSERT IGNORE INTO sys_role_menu_perm (seq_id, role_id, menu_id, can_read, can_write)
SELECT CONCAT('RM_', 'Role_Teacher', '_', menu_id), 'Role_Teacher', menu_id, 1, 0
FROM sys_menu WHERE menu_code = 'resource_center';

-- 为家长授权实验报告（只读）
INSERT IGNORE INTO sys_role_menu_perm (seq_id, role_id, menu_id, can_read, can_write)
SELECT CONCAT('RM_', 'Role_Parent', '_', menu_id), 'Role_Parent', menu_id, 1, 0
FROM sys_menu WHERE menu_code = 'parent_reports';
```

> 注：正式脚本中需用实际 `menu_id` 替换子查询，或者直接使用 `menu_code` 关联。

---

## 6. 后端接口权限校验要点

- 所有需要权限的接口（尤其是审核类）必须调用 `assertPermission`，传入 `PAGE_{menuCode}_{READ/WRITE}`。
- 超级管理员默认通过，但审核接口应额外添加角色校验：若 `roleId = 'Role_Sys_Admin'` 且操作不是其职责范围内的写操作，应拒绝。
- 教师布置作业时，班级列表必须基于教师-班级关联表过滤。
- 学生上传作品时，后端自动填充 `student_id` 和 `class_id`。

---

## 7. 前端实现关键点

- 菜单动态渲染：从全局状态获取权限码列表（`PAGE_xxx_READ`），过滤静态菜单配置（每个菜单项预置 `menuCode`）。
- 路由守卫：在 `middleware.ts` 或 `withPermission` HOC 中，根据当前路径映射的 `menuCode` 校验 READ 权限。
- 按钮级控制：使用 `usePermission('PAGE_{menuCode}_WRITE')` 控制审核、提交、布置等按钮显隐。
- 审核页面：`/review/*` 路由需设置 `meta: { roles: ['Role_Researcher'] }` 或类似守卫。

---

## 8. 实施路线图（按优先级）

| 阶段 | 内容 | 预估工作量 |
|---|---|---|
| Phase 0（基础数据） | 执行 `sys_menu` + `sys_role_menu_perm` 建表和初始化 SQL（含新增菜单）；扩展 `resolvePermissionCodes` | 2h |
| Phase 1（前端基础） | 动态菜单过滤 + 路由守卫 + 权限配置页默认预设 | 4h |
| Phase 2（审核闭环） | 实现 `/review/experiments`、`/review/student-works`、`/review/research-groups` 页面；对接后端审核接口 | 6h |
| Phase 3（PRD 补充） | 实现 `/resource-center`、`/parent/reports`、`/my-research-groups`；完善作业班级选择教师批阅流程 | 5h |
| Phase 4（集成测试） | 7 大角色端到端验收，确保审核闭环、数据隔离、权限正确 | 3h |
| 合计 |  | 20h |

---

## 9. 验收标准

- 所有角色登录后，菜单显示与第 4 节表格一致。
- 直接访问未授权 URL 跳转 403。
- 教师提交实验后，教研员能在 `/review/experiments` 看到并操作。
- 学生提交作品后，校管理员能在 `/review/student-works` 看到并操作。
- 教师创建课题组后，教研员能在 `/review/research-groups` 审核。
- 教师布置作业时班级列表仅限于自己被分配班级。
- 家长可查看 `/parent/reports` 中的实验报告。
- 所有审核操作产生日志（`sys_log` 中记录）。

---

## 10. 风险与应对

| 风险 | 应对 |
|---|---|
| 教研员与校管理员审核权限交叉 | 后端接口强校验角色，前端菜单隔离 |
| 超级管理员误操作业务审核 | 审核接口拒绝超管写操作，仅允许只读 |
| 教师班级分配错误导致作业错发 | 后端校验教师-班级关联，前端下拉列表由 API 返回 |
| 家长获取非自己孩子的报告 | 后端接口根据家长-学生关联过滤 |
| 新页面未注册到 `sys_menu` | 补充自动收集脚本（CI 生成 manifest）作为 Phase 5 |

---

## 11. 附录：完整的 `menu_code` 命名清单（供 SQL 参考）

| 页面 | `menu_code` |
|---|---|
| 用户管理 | `user_management` |
| 角色管理 | `role_management` |
| 组织管理 | `org_management` |
| 班级管理 | `class_management` |
| 家长绑定审核 | `parent_bindings` |
| 实验管理（教师） | `teacher_experiment_manager` |
| 教材管理 | `textbook_management` |
| 我的教学班级 | `teacher_classroom` |
| 我的课堂/作业 | `teacher_tasks` |
| 学生任务中心 | `student_tasks` |
| 成长足迹 | `student_growth` |
| 家庭实验室 | `family_lab` |
| 运维中心 | `ops_dashboard` |
| 学校统计 | `school_statistics` |
| 区域统计 | `district_statistics` |
| 实验审核 | `review_experiments` |
| 作品审核 | `review_student_works` |
| 课题组审核 | `review_research_groups` |
| 资源中心 | `resource_center` |
| 实验报告 | `parent_reports` |
| 实验广场 | `experiment_square` |
| 我的课题组 | `my_research_groups` |

---

## 12. 方案实施步骤（落地执行版）

> 本节用于开发落地与实施对齐。执行时按以下顺序推进，并在每个阶段完成后同步更新本文档中的实际状态。

### Step 0：确认执行前提

- 确认 `sys_menu`、`sys_role_menu_perm` 表已存在。
- 确认 `resolvePermissionCodes` 已合并旧权限码与 `PAGE_{menuCode}_READ/WRITE`。
- 确认前端权限配置页、路由守卫、菜单过滤已接入当前权限源。
- 确认审核接口的角色边界与白名单规则已明确。

### Step 1：生成并执行菜单初始化 SQL

1. 按附录 `menu_code` 清单生成 `sys_menu` 初始化脚本。
2. 按页面治理状态将页面分为：保留、暂隐藏、删除、合并重命名。
3. 将新增审核菜单一并写入：
   - `review_experiments`
   - `review_student_works`
   - `review_research_groups`
   - `resource_center`
   - `parent_reports`
   - `experiment_square`
   - `my_research_groups`
4. 执行后检查 `menu_code` 唯一性与 `parent_id`（如有）关系。

### Step 2：生成并执行默认权限 SQL

1. 按第 4、5、6 节的角色视图生成默认授权脚本。
2. 教研员默认授权：`review_experiments`、`review_research_groups`。
3. 校管理员默认授权：`review_student_works`。
4. 教师默认授权：`teacher_classroom`、`teacher_tasks`、`teacher_experiment_manager`、`my_research_groups`。
5. 学生默认授权：`student_tasks`、`experiment_square`、`student_growth`。
6. 家长默认授权：`family_lab`、`parent_reports`、`experiment_square`。
7. 系统管理员默认保留治理类全量权限，审核菜单默认只读或按实际策略配置。

### Step 3：前端菜单与路由治理上线

1. 菜单树改为读取 `PAGE_PERMISSIONS` 的系统级全量目录。
2. 路由守卫按 `menuCode` 与 `PAGE_{menuCode}_READ` 进行拦截。
3. 按钮显隐按 `PAGE_{menuCode}_WRITE` 进行控制。
4. 将教师页面名称统一改为“我的教学班级”“我的课堂 / 作业”等业务语义。
5. 审核页面按角色限制：
   - `/review/experiments` 仅教研员
   - `/review/student-works` 仅校管理员
   - `/review/research-groups` 仅教研员

### Step 4：后端权限与审核接口对齐

1. 所有审核接口统一增加 `assertPermission` 校验。
2. 审核操作必须写 `sys_log`。
3. 教师布置作业接口必须校验教师-班级关系。
4. 学生上传作品接口必须自动关联学生与班级。
5. 家长查看报告接口必须按孩子关联过滤。

### Step 5：文档同步与验收

1. 每完成一个阶段，更新本文档对应章节的实际状态。
2. 若发现新增页面或职责边界变化，优先在第 1 节和第 3 节修订，再回补第 4~11 节。
3. 完成整体验收后，将实施结果写回文档作为审计留痕。

---

## 13. 最终裁定

本方案为最终版，批准进入开发实施。
