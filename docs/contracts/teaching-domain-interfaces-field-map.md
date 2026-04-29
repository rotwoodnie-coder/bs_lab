# 教学域四接口 · 与 Mock 仓字段对照（冻结候选）

> **文档性质**：若产品要冻结 **`OrganizationNode` / `StandardExperiment` / `TeachingTask` / `ExperimentSession`** 四类接口，本文档将 **目标语义字段** 与当前前端实现中的 **`unified-mock-store`（统一仓）**、**`experiment-mgmt`（实验管理 Mock）** 及 **组织/花名册旁路** 做一一对照，便于归并与缺口标注。  
> **非代码真源**：类型以仓库内 TypeScript 为准；本文仅作契约对齐索引。  
> **关联**：[`unified-mock-store.ts`](../../frontend/src/lib/unified-mock-store.ts)、[`mock-experiment-management.ts`](../../frontend/src/data/mock-experiment-management.ts)、[`experiment-mgmt-mock-store.ts`](../../frontend/src/lib/experiment-mgmt-mock-store.ts)、[`console-org-tree.ts`](../../frontend/src/lib/console-org-tree.ts)、[`teacher-mock.ts`](../../frontend/src/data/teacher-mock.ts)、[`promote-experiment-standard.ts`](../../frontend/src/lib/promote-experiment-standard.ts)。

---

## 1. 目标接口草图（产品冻结候选）

以下为 **建议** 的最小可读形状；与下节对照表合并时，以 **是否已有同名字段 / 是否需改名** 为准。

```ts
/** 行政与教学组织中的可挂载节点（含班级、小组等） */
type OrganizationNode = {
  id: string;
  parentId: string | null;
  kind: string; // e.g. school | grade | class | lab_group | ...
  name: string;
  /** 人与节点的绑定（角色 × 用户） */
  roleBindings?: Array<{ userId: string; role: string }>;
};

/** 实验方案在「区本标准 / 评审」维度的投影 */
type StandardExperiment = {
  experimentId: string;
  creatorId?: string;
  isStandard: boolean;
  curriculumTags: string[];
  /** 待办或评审队列中的条目 id（若与列表同源可省略独立数组） */
  approvalQueue?: string[];
};

/** 教师下发到班级/小组的教学任务 */
type TeachingTask = {
  taskId: string;
  experimentId: string;
  /** 任务级默认 AI 风格（若与会话级并存，需约定优先级） */
  aiStyle?: "gentle" | "rigorous" | "playful" | string;
  classIds: string[];
  groupIds?: string[];
  studentUserIds?: string[];
  status: string;
  dueAt?: string;
};

/** 学生一次探究会话（与任务、作品关联） */
type ExperimentSession = {
  sessionId: string;
  taskId?: string;
  experimentId: string;
  /** 设计草图常见：会话级预审状态；当前实现多在「作品」上 */
  aiPreAuditStatus?: "pass" | "warning" | "error" | string;
};
```

---

## 2. `OrganizationNode` ↔ 代码现状

| 目标字段 | 语义 | 现状落点 | 对齐说明 |
|----------|------|----------|----------|
| `id` | 节点唯一标识 | **`OrgTreeNode.id`**（`console-org-tree.ts`）；班级侧 **`MockStudentUser.orgClassNodeId`** / **`adminClassId`**（`unified-mock-store.ts` + `class-cohort-mock` 映射）；实验小组 **`LabGroupMock.groupId`** | **多真源**：组织树节点 id 与教师侧 `TEACHER_MOCK_CLASSES.id`、小组 id 命名空间不同，需映射表或统一前缀策略。 |
| `parentId` | 父节点 | **`OrgTreeNode`** 为 **嵌套树**（`children`），无扁平 `parentId`；导入导出 schema 见 `ORG_EXPORT_SCHEMA` | **结构不同**：产品若冻结 `parentId`，需由树拍平或单独维护邻接表。 |
| `kind` | 节点类型 | **`OrgTreeNode.kind`: `OrgKind`**（district / school / grade / class / students / …） | 概念对齐；**实验小组**在统一仓为 **`LabGroupMock`**，不在 `ORG_TREE` 同一棵树。 |
| `name` | 显示名 | **`OrgTreeNode.name`**；班级名册见 **`teacher-mock`** `TEACHER_MOCK_CLASSES` | 对齐。 |
| `roleBindings` | 用户与节点角色绑定 | **无单一结构**：**`MockStudentUser`** 含 `adminClassId` / `orgClassNodeId` / `groupId`；教师花名册 **`TEACHER_MOCK_CLASS_ROSTERS`**；控制台用户 Mock 见 `lib/console/users/*` | **分散**：冻结 `roleBindings` 需合并或引用多表。 |

**小结**：组织 **「树」** 在 `ORG_TREE`；**师生与班级/小组** 在 **`MockStudentUser` + `teacher-mock` + `LabGroupMock`**。不存在名为 `OrganizationNode` 的单一类型。

---

## 3. `StandardExperiment` ↔ `ExperimentMgmtRow`（experiment-mgmt）

`ExperimentMgmtRow` 定义于 [`mock-experiment-management.ts`](../../frontend/src/data/mock-experiment-management.ts)，持久化由 [`experiment-mgmt-mock-store.ts`](../../frontend/src/lib/experiment-mgmt-mock-store.ts) 读写 `localStorage` key `bs-lab:experiment-mgmt-mock-v1`。

| 目标字段 | 现状字段（`ExperimentMgmtRow`） | 对齐说明 |
|----------|----------------------------------|----------|
| `experimentId` | `id` | 同名语义。 |
| `creatorId` | **无**；有 `authorName`（展示名） | 若冻结 `creatorId`，需新增或与用户表外键对齐。 |
| `isStandard` | `isStandard?: boolean` | 对齐；提拔见 `promoteExperimentToDistrictStandard`。 |
| `curriculumTags` | `tags: string[]` + `curriculumRefShort` | **部分对齐**：课标相关拆在标签与短引用两处。 |
| `approvalQueue` | **无独立字段** | 评审待办由 **`workflowStatus`**（如 `submitted` / `in_review`）+ UI 筛选表达；无 `approvalQueue: string[]`。 |

**相关扩展字段（非目标最小集，但影响「标准」叙事）**：`workflowStatus`、`contentVersion`、`sourceExperimentId`、`lastReviewComment` / `lastReviewAt` / `lastReviewScore`、`rejectReason`、`mandatory`、`gradeLabels`、`subjectLabel` 等。

**与统一仓**：任务/会话 **`experimentId`** 与 **`BAOSHAN_100_EXPERIMENT_IDS`** 等引用实验目录，与 **`isStandard`** **未在代码层强制同一真源**（需产品声明是否仅叙事对齐）。

---

## 4. `TeachingTask` ↔ `UnifiedTaskMock`（unified-mock-store）

| 目标字段 | 现状字段（`UnifiedTaskMock`） | 对齐说明 |
|----------|-------------------------------|----------|
| `taskId` | `taskId` | 对齐。 |
| `experimentId` | `experimentId` | 对齐。 |
| `aiStyle` | **无** | **缺口**：当前 **AI 风格**在 **`UnifiedSessionMock.guideStyle`**（`gentle` \| `rigorous` \| `playful`），会话创建时写入，**非任务级默认值**。 |
| `classIds` | `classIds: string[]` | 对齐。 |
| `groupIds` | `groupIds?: string[]` | 对齐。 |
| `studentUserIds` | `studentUserIds: string[]` | 对齐（可见性）。 |
| `status` | `status: UnifiedTaskStatus`（`draft` \| `published` \| `closed`） | 对齐。 |
| `dueAt` | `dueAt: string` | 对齐。 |
| — | `title`, `experimentTitle`, `gradeLabel`, `createdByTeacherId` | 目标草图未列；实现中有。 |

---

## 5. `ExperimentSession` ↔ `UnifiedSessionMock` + `UnifiedWorkMock`（预审归属）

| 目标字段 | 现状字段 | 对齐说明 |
|----------|----------|----------|
| `sessionId` | `UnifiedSessionMock.sessionId` | 对齐。 |
| `taskId` | `taskId?` | 对齐。 |
| `experimentId` | `experimentId` | 对齐。 |
| `aiPreAuditStatus` | **会话上无**；预审在 **`UnifiedWorkMock.ai_suggestion`**（及规则函数 **`calculateWorkSuggestion(session, work)`**） | **语义错位**：设计草图若在 **session** 上冻结预审态，当前实现为 **作品级** `pass` \| `warning` \| `error`，且 **`error`** 为实现的第三态。 |
| — | `guideStyle`（会话） | 对应目标 **`TeachingTask.aiStyle`** 的潜在来源冲突，需优先级规则。 |
| — | `parent_attested_at`, `completion_status`, `errorCount`, `materialShortageReported` | 会话级治理与学情；目标草图未列，闭环文档见 [`closed-loop-acceptance-metrics.md`](./closed-loop-acceptance-metrics.md)。 |

---

## 6. 跨接口依赖（冻结时需一并声明）

| 依赖 | 说明 |
|------|------|
| 任务 `experimentId` ↔ 实验管理 `id` | 两处 Mock 并存时，建议固定 **同一字符串枚举** 或显式同步策略。 |
| 组织 id ↔ `classIds` | `UnifiedTaskMock.classIds` 与教师 **`TEACHER_MOCK_CLASSES.id`** 应对齐；与 **`OrgTreeNode`** 班级节点通过 `class-cohort-mock` 映射。 |
| 标准提拔 | **`promoteExperimentToDistrictStandard`** 只更新 **experiment-mgmt** 行，**不**自动更新统一仓任务列表。 |

---

## 7. 参考文档

- [Product Requirements Document (PRD)](../plans/Product%20Requirements%20Document%20(PRD).md)  
- [science-community-console-mock-spec.md](./science-community-console-mock-spec.md)  
- [integration-baseline.md](./integration-baseline.md)
