# 教研课题组（Teaching Research Project Group）· Mock 契约

> **文档性质**：与 PRD「教研员对课题组的校验与管理」对齐的 **实体、状态与接口叙事**；当前阶段以 Mock / `localStorage` 为主，后端接入时替换数据层即可。  
> **关联**：[`role-stage-capability-matrix-mock.md`](./role-stage-capability-matrix-mock.md) §3.4 教研员；[`management-sidebar-ia-closed-loop-mock.md`](./management-sidebar-ia-closed-loop-mock.md) §3.1 / §4.1。  
> **路由**：教研校验 **`/console/review/project-groups`**（运营中心子项）；教师侧 **创建与维护课题组** **`/teacher/research-project-groups`**（主导航「课题组管理」）。

---

## 1. 业务定义

**教研课题组**是区域教研组织下的协作单元：教师在平台上 **创建课题组**、维护 **基本信息与成员**，并可在审核通过后以课题组名义开展 **实验课程发布与共建**（与「实验管理 / 探究方案」等模块可建立引用关系，具体绑定在后端设计阶段细化）。

**教研员**对本域的职责是 **专业校验与管理**（非人事编制管理）：

| 能力 | 说明 |
|------|------|
| **校验（审核）** | 对「待审核」课题组进行通过、驳回或要求修改；关注学科归属、目标与区本方向是否一致、成员构成是否合理（产品规则可配置）。 |
| **管理** | 在课题组 **生效后**：抽检、暂停协作、归档或撤销（与实验/内容治理联动时需遵守统一状态机）；**不**承担区教育局人事系统中的编制管理。 |

与 **实验评审**（`/console/review/experiments`）区分：前者审 **课题组组织实体**，后者审 **探究方案 / 实验实例**；二者可并行存在于同一教师工作流（先建组再共建实验等）。

---

## 2. 数据模型（建议字段）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` (UUID) | 课题组主键 |
| `name` | `string` | 课题组名称 |
| `introduction` | `string` | 课题组介绍 |
| `subject_id` / `subject_label` | `string` | 所属学科（与目录/领域词表对齐） |
| `creator_id` | `string` | 课题组创建人（通常为教师） |
| `member_ids` | `string[]` | 课题组成员（教师），可含创建人 |
| `reviewer_ids` | `string[]` | 负责该校验的教研员用户 ID（可多对一区域） |
| `status` | 见 §3 | 生命周期状态 |
| `submitted_at` | `ISO8601` \| `null` | 提交审核时间 |
| `reviewed_at` | `ISO8601` \| `null` | 最近审核时间 |
| `review_note` | `string` \| `null` | 教研员意见（通过/驳回/修改说明） |
| `tenant_scope` | `string` | 区/校数据范围键（全栈阶段与组织树对齐） |

---

## 3. 状态机（最小集）

| `status` | 含义 | 可见操作（摘要） |
|----------|------|------------------|
| `draft` | 草稿 | 创建人编辑、提交审核 |
| `pending_review` | 待教研员审核 | 教研员通过 / 驳回 / 要求修改 |
| `active` | 已生效 | 成员协作；教研员可抽检、暂停、归档 |
| `rejected` | 已驳回 | 创建人可修改后再次提交（或关闭） |
| `suspended` | 已暂停 | 教研员或区管解除暂停后恢复为 `active`（规则可配） |
| `archived` | 已归档 | 只读；可另建副本 |

---

## 4. API 叙事（与冻结风格一致）

前缀建议与现有契约一致：`/api/v1/...` 或网关等价路径。

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/teaching-research-project-groups` | 列表；教研员默认 **待办优先**（`pending_review`） |
| `POST` | `/api/v1/teaching-research-project-groups` | 创建（教师） |
| `PATCH` | `/api/v1/teaching-research-project-groups/:id` | 更新草稿、成员等（权限：创建人 / 组长策略） |
| `POST` | `/api/v1/teaching-research-project-groups/:id/submit` | 提交审核 |
| `POST` | `/api/v1/teaching-research-project-groups/:id/review` | 教研员审核 body：`{ decision, note }` |
| `POST` | `/api/v1/teaching-research-project-groups/:id/suspend` | 暂停（教研员/区管） |
| `POST` | `/api/v1/teaching-research-project-groups/:id/archive` | 归档 |

审计日志建议写入与 `console-audit-log` 同一叙事（操作者、对象 id、决策）。

---

## 5. RBAC（与 `management-access.ts` 一致）

| 角色 | 课题组创建/编辑 | 提交审核 | 校验与暂停/归档 |
|------|-----------------|----------|-------------------|
| `TEACHER` | 有（本区策略内） | 有 | 无 |
| `RESEARCHER` | 无（或只读） | 无 | **有** |
| `DISTRICT_ADMIN` / `SUPER_ADMIN` | 视策略 | 视策略 | 有（与教研员同壳时可全量） |
| `SCHOOL_ADMIN` | 无 | 无 | 无（与 `/console/review/*` 互斥一致） |

---

## 6. 前端真源（对齐用）

| 项 | 位置 |
|----|------|
| 运营中心入口 | `frontend/src/config/console-nav.ts` → `governance` → **课题组校验** → `/console/review/project-groups` |
| 教师主导航 | `frontend/src/config/nav-config.ts` → **课题组管理** → `/teacher/research-project-groups` |
| Mock 数据 | `frontend/src/data/mock-research-project-groups.ts` |
| Mock 页 | `console/review/project-groups/page.tsx`（校验视角）；`teacher/research-project-groups/page.tsx`（教师视角） |

---

## 7. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-04-12 | 初版：响应 PRD 增补「教研员对课题组的校验与管理」；与 IA、能力矩阵、PRD 索引对齐。 |
