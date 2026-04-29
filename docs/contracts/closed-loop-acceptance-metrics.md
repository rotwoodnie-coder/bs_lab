# 三环闭环 · 可测验收指标与数据来源（Mock 阶段）

> **文档性质**：将 **闭环 A（教学）**、**闭环 B（教研）**、**闭环 C（行政）** 从概念落实为 **可判定** 的验收指标；每条指标注明 **数据来源** 为 **`unified-mock-store` / `experiment-mgmt-mock-store` / 其它 localStorage**、**页面静态 Mock**，或 **尚未接通**（仅叙事）。  
> **用途**：联调与脚本、后续接 API 时的断言清单。  
> **关联**：[`unified-mock-store.ts`](../../frontend/src/lib/unified-mock-store.ts)、[`experiment-mgmt-mock-store.ts`](../../frontend/src/lib/experiment-mgmt-mock-store.ts)、[`district/overview/page.tsx`](../../frontend/src/app/(dashboard)/district/overview/page.tsx)。

**存储键速查（浏览器）**

| Store | `localStorage` key |
|-------|---------------------|
| 统一仓（任务 / 会话 / 作品 / 小组 / 学生） | `bs-lab:unified-mock-v1` |
| 实验管理行 | `bs-lab:experiment-mgmt-mock-v1` |

---

## 闭环 A（教学）：提交 → 家长背书 → 教师批改/发布 → 亲子侧反馈

**目标**：一次完整「任务—会话—作品」链在 **同一统一仓** 内可追踪、可计数。

| # | 验收指标 | 可接受判定（Mock） | 数据来源 |
|---|----------|-------------------|----------|
| A1 | **作品已创建并与会话绑定** | `UnifiedWorkMock` 存在；`work.sessionId` 指向存在的 `UnifiedSessionMock` | **Store**：`listUnifiedWorks` / `getUnifiedSession` / `subscribeUnifiedMock`（`unified-mock-store`） |
| A2 | **家长背书已完成** | `UnifiedSessionMock.parent_attested_at != null` | **Store**：同上 |
| A3 | **教师侧发布（或待审→发布）可观测** | `UnifiedWorkMock.teacherReviewStatus === "published"`（或流水线聚合为已发布） | **Store**：同上；教师视图可能经 `getUnifiedWorksAsStudentWorkItems` 等投影 |
| A4 | **规则预审结果可观测** | `getEffectiveWorkSuggestion(session, work)` 或 `work.ai_suggestion` 为 `pass` \| `warning` \| `error` 之一 | **Store**：统一仓；**非**会话字段 `aiPreAuditStatus`（见 [`teaching-domain-interfaces-field-map.md`](./teaching-domain-interfaces-field-map.md)） |
| A5 | **亲子报告 / 成就卡与学业链路一致** | 路径上，报告或成就卡引用的 `sessionId` / `workId` 与统一仓一致（若页面使用独立 Mock，则 **显式标注不同步**） | **混合**：统一仓 **或** `parent-sessions-mock-store` 等；需人工核对 **是否同一持久化键** |

**静态页说明**：若仅打开 **未写入统一仓** 的占位页，A1–A4 **不得**记为通过。

---

## 闭环 B（教研）：方案迭代 → 评审队列 → 区本标准 → 「全区使用」叙事

**目标**：实验管理行状态与提拔动作可验证；**「全员自动同步任务」** 在 Mock 中默认 **不承诺**。

| # | 验收指标 | 可接受判定（Mock） | 数据来源 |
|---|----------|-------------------|----------|
| B1 | **评审队列可筛选** | 至少一条 `ExperimentMgmtRow` 的 `workflowStatus` 为 `submitted` 或 `in_review`（与 `isPendingReviewStatus` 一致） | **Store**：`readExperimentMgmtRows` / `experiment-mgmt-mock-store` |
| B2 | **提拔为区本标准可观测** | 对某 `id` 调用 `promoteExperimentToDistrictStandard` 后，该行 `isStandard === true` 且 `contentVersion` 递增 | **Store**：`experiment-mgmt` |
| B3 | **区本标签/谱系可追溯** | 提拔后 `tags` 含「采纳范例」或产品约定标签；可选 `sourceExperimentId` 非空（若种子数据有） | **Store**：`ExperimentMgmtRow` |
| B4 | **教师任务引用同一 experimentId（弱）** | 存在 `UnifiedTaskMock.experimentId` 与某 `ExperimentMgmtRow.id` **字符串相同** | **Store**：统一仓 + experiment-mgmt（**跨 store 人工对齐**） |
| B5 | **「全区使用」自动同步** | 产品若要求：experiment-mgmt 变更后 **自动** 生成/更新 `UnifiedTaskMock` — **当前实现无** | **缺口**：无监听器；验收标为 **不适用** 或 **未来 API** |

**静态页说明**：`/console/review/experiments` 等若仅展示 `readExperimentMgmtRows` 的投影，仍属 **Store**；若写死列表则标 **静态**，与 B1–B3 冲突时 **以 Store 为准**。

---

## 闭环 C（行政）：组织与人、物料预警、区管看板

**目标**：组织与名册 **可**；**集采账本** 与 **区管大盘真实聚合** 在 Mock 阶段 **分档验收**。

| # | 验收指标 | 可接受判定（Mock） | 数据来源 |
|---|----------|-------------------|----------|
| C1 | **组织树可加载** | `ORG_TREE`（`console-org-tree.ts`）在控制台组织页可展示；导入导出 schema 与一致 | **静态种子**（代码内嵌树）；非 localStorage |
| C2 | **学生分班/入组与统一仓一致** | `MockStudentUser` 中 `adminClassId` / `orgClassNodeId` / `groupId` 与 `teacher-mock` 花名册、**`LabGroupMock`** 无矛盾 | **Store**：统一仓 + **`teacher-mock` 种子**（分班） |
| C3 | **材料短缺可聚合** | `listMaterialShortageByExperiment`（或等价）能列出 `materialShortageReported` 为真的会话所涉实验 | **Store**：统一仓（会话字段） |
| C4 | **区管看板单项真实聚合（建议最小一条）** | 至少 **一项** 指标来自统一仓聚合（如按 `errorCount`、缺料条数），而非全文硬编码 | **混合**：若 `district/overview` 仍为 **静态 Mock**，则本项 **不通过**，直至接一条聚合 |
| C5 | **采购/经费台账** | 独立「钱投准」账本 | **缺口**：当前无独立 store；标 **未实现** |

**静态页说明**：**区管 overview** 若错题 TOP、大盘数字为 **硬编码**，C4 明确为 **静态**，与统一仓 **未联动**（与产品计划一致）。

---

## 汇总：Store vs 静态 · 快速对照

| 闭环 | 优先信任数据来源 | 常见静态/缺口 |
|------|------------------|----------------|
| A | `bs-lab:unified-mock-v1` | 亲子报告独立 Mock 可能与统一仓分裂 |
| B | `bs-lab:experiment-mgmt-mock-v1` + 与统一仓人工对齐的 `experimentId` | 「标准→全员任务」自动同步 |
| C | 统一仓（分班/缺料）+ 嵌套 `ORG_TREE` | 区管大盘、采购账 |

---

## 参考文档

- [`teaching-domain-interfaces-field-map.md`](./teaching-domain-interfaces-field-map.md)  
- [Product Requirements Document (PRD)](../plans/Product%20Requirements%20Document%20(PRD).md)  
- [science-community-console-mock-spec.md](./science-community-console-mock-spec.md)

---

## 开发者自检工具

在 Dev 环境下可通过 `window.__BS_LAB__.checkLoopA()` 获取实时闭环审计报告，该报告作为系统交付的逻辑准则。
