# Phase 1 执行指令：修复审核工作流

> 打开此文件后，按 1→5 顺序依次执行。每步都标注了**精确文件路径**和**代码行号**。
> 完成一步后再进入下一步，不要并行。

---

## 前置确认（执行前必读）

### 状态枚举（数据库不变）

| `exp_msg.status` | 含义 | 前端展示 |
|------------------|------|---------|
| `'t'` | 草稿（含已提交待审） | "草稿" / "审核中" |
| `'y'` | 通过 | "已通过" |
| `'n'` | 不通过 | "未通过" |

**不新增 DB 列**，"审核中"是 `status='t'` 下的一种逻辑状态。

### 当前断点

```
教师编辑器 {approveExperiment/confirmReject}  →  纯本地 Toast + localStorage 事件  ✗
教师编辑器 {publish()}                          →  saveDraft() + 本地事件              ✗
审核工作台 console/review/experiments           →  PATCH /v2/exp/:id → DB             ✓
```

教师编辑器工具条的"通过审核"/"驳回"按钮调的是 `use-editor-actions.ts:338` 的 `approveExperiment()` 和 `confirmReject()`（L344），**两个函数完全不调后端 API**。而审核工作台 `/console/review/experiments` 已有完整后端对接。

### 后端已就绪（不要改动）

```66:71:backend/src/http/routes/v2-exp.ts
PATCH /v2/exp/:id → patchExpMsgForReview() 写入 exp_msg.{status, confirm_user_id, reject_reason, ...}
```

欢迎 schema 接受 `status: "y" | "n"`，前端已有 `patchV2ExpMsgReview()` 封装。

---

## Step 1：修复教师工具条"通过/驳回" — 调后端 API

### 文件

**编辑** `frontend/src/app/(dashboard)/teacher/experiment-editor/hooks/use-editor-actions.ts`

### 目标位置

- `approveExperiment` — 第 338–342 行
- `confirmReject` — 第 344–359 行

### 改动：先确认已导入

文件顶部检查：
```typescript
import { ... patchV2ExpMsgReview } from "@/lib/v2/v2-exp-api";
```

### 替换 approveExperiment

```typescript
const approveExperiment = React.useCallback(async () => {
  if (!a.expId) return;
  try {
    await patchV2ExpMsgReview(a.v2Actor, a.expId, {
      status: "y",
      confirm_comments: "审核通过",
    });
    sonnerToast.success("已通过审核");
    appendExperimentWorkflowEvent("experiment_approved", a.expId, { workflowStatus: "approved" });
    a.refreshV2PeerList?.();
  } catch (err) {
    sonnerToast.error("审核操作失败", {
      description: err instanceof Error ? err.message : "请稍后重试",
    });
  }
}, [a.expId, a.v2Actor, appendExperimentWorkflowEvent, a.refreshV2PeerList]);
```

### 替换 confirmReject

```typescript
const confirmReject = React.useCallback(
  async (rejectDraft: string, close: () => void) => {
    const reason = rejectDraft.trim();
    if (!a.expId || !reason) {
      sonnerToast.error("请填写驳回原因");
      return;
    }
    try {
      await patchV2ExpMsgReview(a.v2Actor, a.expId, {
        status: "n",
        reject_reason: reason,
      });
      close();
      sonnerToast.message("已驳回", { description: "请继续完善后重新提交。" });
      appendExperimentWorkflowEvent("experiment_changes_requested", a.expId, {
        workflowStatus: "changes_requested",
        rejectReason: reason,
      });
      a.refreshV2PeerList?.();
    } catch (err) {
      sonnerToast.error("驳回操作失败", {
        description: err instanceof Error ? err.message : "请稍后重试",
      });
    }
  },
  [a.expId, a.v2Actor, appendExperimentWorkflowEvent, a.refreshV2PeerList],
);
```

### 验收

- 教师工具条"通过审核" → `PATCH /v2/exp/:id { status: "y" }` → `exp_msg.status` 变为 `'y'`
- 教师工具条"驳回" → `PATCH /v2/exp/:id { status: "n", reject_reason }` → `exp_msg.status` 变为 `'n'`

---

## Step 2：检查"提交审核"按钮行为

### 文件

**编辑** `frontend/src/app/(dashboard)/teacher/experiment-editor/hooks/use-editor-actions.ts`

### 目标位置：`publish()` 函数 — 第 298–336 行

### 当前行为

`publish()` 已做：
1. 校验必填字段（L305-320）
2. `saveDraft({ silent })`（L322）
3. 本地事件（L330-335）
4. Toast（L335）

**不需要改动**。"提交审核" = 保存草稿 + 通知教研员。审核工作台通过 `GET /v2/exp?status=t` 看到所有草稿实验。

### 如需增加更强提示

在 L335 的 `sonnerToast.success("已提交审核")` 之后，可以加一句描述：

```typescript
sonnerToast.success("已提交审核", {
  description: "教研员可在「实验评审」中查看",
});
```

（不改也行，现有的 Toast 已经够用）

### 验收

- 点击"提交审核" → 保存成功 → Toast 提示
- `exp_msg.status` 保持 `'t'`（不变）
- 审核工作台刷新后可见到该实验

---

## Step 3：教师实验列表 — 状态映射对齐

### 文件

**编辑** `frontend/src/app/(dashboard)/experiment-manage/page.hooks.ts`
（或 `page.tsx` 中列渲染部分）

### 检查内容

找到状态列渲染逻辑，确保映射为：

| `status` | 前端显示 |
|----------|---------|
| `'t'` | "草稿" |
| `'y'` | "已通过" |
| `'n'` | "未通过" |

**重点检查**：如果列表页之前依赖 localStorage 中的 `workflowEvent` 来推导"已提交/已审核"状态，要改为完全以 `exp_msg.status` 为准。

- 去掉或降级 `persistListFields({ workflowStatus: "submitted" })` 的副作用
- 列表页状态列直接读 `row.status` 渲染，不再混用本地事件

### 验收

- 实验列表 `status='t'` → 显示"草稿"
- `status='y'` → 显示"已通过"
- `status='n'` → 显示"未通过"
- 刷新页面状态不丢

---

## Step 4：实验预览页加载真实数据

### 文件

**编辑** `frontend/src/app/(dashboard)/teacher/experiment-preview/page.tsx`（全页，约 78 行）

### 当前问题

页面是一个独立视频测试页，不从 `GET /v2/exp/:id` 加载实验数据。

### 改动要点

```typescript
// 新增导入
import { useSearchParams } from "next/navigation";
import { createV2ApiService, fetchV2ExpDetail } from "@/lib/v2/v2-exp-api";
import type { ExpMsgDetail } from "@/lib/v2/v2-exp-api";

// 组件内新增
const searchParams = useSearchParams();
const expId = searchParams.get("id");
const [detail, setDetail] = React.useState<ExpMsgDetail | null>(null);
const [loading, setLoading] = React.useState(true);

React.useEffect(() => {
  if (!expId) { setLoading(false); return; }
  const actor = createV2ApiService({ userId: "", role: "" }); // 或从 context 获取
  fetchV2ExpDetail(actor, expId)
    .then(setDetail)
    .catch(() => setDetail(null))
    .finally(() => setLoading(false));
}, [expId]);
```

渲染：实验名称、学科/年级、原理富文本、步骤列表、材料列表、视频播放器。保留现有"返回编辑器"链接。

### 验收

- `/teacher/experiment-preview?id=xxx` → 展示实验完整内容
- 不传 id → 友好提示

---

## Step 5：次要修复

### 5A：自动保存增加离开前强制保存

### 文件

**编辑** `frontend/src/app/(dashboard)/teacher/experiment-editor/page.container.tsx`

在 `return` 之前、`useEditorAutosave` 调用之后，增加：

```typescript
const hasPendingChangesRef = React.useRef(autosave.hasPendingChanges);

React.useEffect(() => {
  hasPendingChangesRef.current = autosave.hasPendingChanges;
}, [autosave.hasPendingChanges]);

React.useEffect(() => {
  const handleUnload = () => {
    if (hasPendingChangesRef.current) {
      actions.saveDraft({ silent: true });
    }
  };
  window.addEventListener("beforeunload", handleUnload);
  return () => {
    window.removeEventListener("beforeunload", handleUnload);
    // 组件卸载时兜底
    if (hasPendingChangesRef.current) {
      actions.saveDraft({ silent: true });
    }
  };
}, [actions.saveDraft]);
```

### 5B：`exp_caution`/`exp_danger` 增加字符计数提示

### 文件

**编辑** `frontend/src/app/(dashboard)/teacher/experiment-editor/_components/sections/EditorBasicSection.tsx`

找到 `safetyNotes` 和 `dangerNotes` 的编辑器区域，下方增加：

```tsx
<div className="flex items-center justify-between">
  <span className="text-xs text-muted-foreground">
    {safetyNotes.length}/200 字符
  </span>
  {safetyNotes.length > 180 && (
    <span className="text-xs text-amber-500">
      即将达到上限，超出部分不会被保存
    </span>
  )}
</div>
```

### 验收

- 切换页面时未完成的自动保存被强制触发
- 安全提示输入框显示实时字符计数

---

## 文件索引总表

| # | 操作 | 文件 | 关键行 |
|---|------|------|--------|
| S1 | 修复 approve/reject | `use-editor-actions.ts` | L338-L359 |
| S2 | 检查 publish（无须改动） | `use-editor-actions.ts` | L298-L336 |
| S3 | 列表状态映射 | `experiment-manage/page.hooks.ts` | 状态列渲染处 |
| S4 | 预览页加载数据 | `teacher/experiment-preview/page.tsx` | 全页 |
| S5A | 离开前保存 | `page.container.tsx` | L65-L110 |
| S5B | 字符计数 | `EditorBasicSection.tsx` | safety/danger 区域 |

---

## 验收标准汇总

### 审核工作流（完整链路）

```
教师创建实验 → 填写 → 点"提交审核"
  → saveDraft() 保存
  → 审核工作台 GET /v2/exp?status=t 可看到该实验
  → 教研员点"通过" → PATCH {status:"y"} → DB 更新
  → 教师实验列表显示"已通过"

教师点"驳回" → PATCH {status:"n", reject_reason} → DB 更新
  → 教师实验列表显示"未通过"
```

### 按步骤检查

| 步骤 | 操作 | 预期 |
|------|------|------|
| S1 | 工具条"通过" → 刷新 → 列表 | status='y'，显示"已通过" |
| S1 | 工具条"驳回" → 填原因 → 刷新 | status='n'，显示"未通过" |
| S2 | 点"提交审核" | 保存成功，status 保持 't' |
| S3 | 列表页刷新 | 状态列与 DB status 一致，无 localStorage 干扰 |
| S4 | `/preview?id=xxx` | 展示实验名称、原理、步骤等 |
| S5 | 编辑中切页面 | 自动保存触发 |
