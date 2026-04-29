# Phase 2 执行指令：教师侧增强

> 前置条件：Phase 1（审核工作流修复）已完成并推送。
> 按 2.1 → 2.4 顺序依次执行。

---

## 2.1 离开前强制保存

### 问题

自动保存防抖 1200ms，页面关闭、导航离开或组件卸载时未强制执行最后一次保存。

### 涉及文件

- `frontend/src/app/(dashboard)/teacher/experiment-editor/page.container.tsx`

### 改动

在容器组件中增加 ref 跟踪 pending 状态，绑定 `beforeunload` 事件强制触发 `saveDraft({ silent: true })`，组件卸载时兜底。

### 验收

- 用户在编辑器中输入内容后立刻关闭标签页 → 草稿被保存
- 用户切换页面 → 草稿被保存

---

## 2.2 教研组管理对接后端 API

### 问题

`teacher/research-project-groups/page.hooks.ts` 中 `rows` 始终为空数组，`handleCreate`/`handlePatch` 为 no-op。页面完全不可用。

### 涉及文件

| 文件 | 操作 |
|------|------|
| `frontend/src/app/(dashboard)/teacher/research-project-groups/page.hooks.ts` | 替换全为空实现 |
| `frontend/src/app/(dashboard)/teacher/research-project-groups/_components/ResearchGroupDialogs.tsx` | 启用表单输入 |
| `frontend/src/app/(dashboard)/teacher/research-project-groups/page.tsx` | 对齐回调签名 |

### 改动

1. `page.hooks.ts`：接入 `fetchSubjectGroups`、`createSubjectGroup`、`patchSubjectGroup`（来自 `v2-group-api.ts`），后端使用 `subject_group` 表 + `/api/group` 路由（与 Researcher 教研组管理共用同一组 API）。
2. `ResearchGroupDialogs.tsx`：移除占位文案，启用名称输入框，添加 `useState` 状态管理。
3. `page.tsx`：编辑表单不再传递 `gradeId`（课题组不维护年级字段）。

### 验收

- 教师打开课题组管理页面 → 加载真实列表（空列表显示"暂无课题组"）
- 点击"新建课题组"→ 弹出表单 → 输入名称 → 保存 → 列表刷新
- 点击"编辑"→ 修改名称 → 保存 → 列表刷新
- 点击启用/停用 → 状态切换 → 列表刷新

---

## 2.3 驳回原因回显到编辑器

### 问题

`exp_msg.reject_reason` 已在后端读取为 `rejectReason`，但审核人员驳回后，教师重新打开实验时看不到驳回原因。

### 实际状态

已有完整链路无需改动：

```
DB reject_reason → rowToExpMsg() → GET /v2/exp/:id → 
editorPeerRowFromV2ExpMsgItem(d.rejectReason) → EditorPeerRow.rejectReason → 
showRejectBanner → 渲染横幅在 EditorCanvasSections.tsx (L194-201)
```

`showRejectBanner` 条件：`workflowStatus === "changes_requested"` 且存在 `rejectReason`。

### 验收

- 教研员驳回实验 → 教师重新打开编辑器 → 编辑器顶部显示黄色横幅"驳回说明"及原因

---

## 2.4 消除 publish() 中 pushExperimentMaterialLinks 重复调用

### 问题

`publish()` 中 `saveDraft({ silent: true })` 内部已调用 `pushExperimentMaterialLinks()`，紧接着又显式调用一次，属于冗余。

### 涉及文件

- `frontend/src/app/(dashboard)/teacher/experiment-editor/hooks/use-editor-actions.ts`

### 改动

删除 `publish()` 中的 `pushExperimentMaterialLinks(targetExpId, true)` 调用行及其依赖。

### 验收

- 提交审核时材料关联只发送一次（确认无重复网络请求）
- 功能不受影响

---

## 文件索引

| # | 操作 | 文件 | 说明 |
|---|------|------|------|
| 2.1 | 修改 | `page.container.tsx` | 离开前强制保存 |
| 2.2 | 修改 | `page.hooks.ts` | 替换空 hooks 为真实 API |
| 2.2 | 修改 | `ResearchGroupDialogs.tsx` | 启用表单 |
| 2.2 | 修改 | `page.tsx` | 对齐回调 |
| 2.3 | — | 无需改动 | 链路已完备 |
| 2.4 | 修改 | `use-editor-actions.ts` | 删除冗余调用 |

---

## 剩余待办总览

| 待办 | 状态 |
|------|------|
| 学生端全链路 | 📋 `ROLE_AUDIT_AND_ROADMAP.md` Phase 3 |
| 家长端接入后端 | 📋 `ROLE_AUDIT_AND_ROADMAP.md` Phase 4 |
| 超管运维中心 | 📋 `ROLE_AUDIT_AND_ROADMAP.md` Phase 5 |
| 技术债务清理 | 📋 `ROLE_AUDIT_AND_ROADMAP.md` Phase 6 |
