/**
 * 实验业务通用显示映射 — 集中管理所有 DB 状态码 → 前端文案的映射。
 *
 * 真源：`docs/core/bs_exp_data-database-design.md` 中定义的字段枚举值。
 * 目标：消除前端各文件中对同一状态码的重复中文标签硬编码。
 *
 * 当后端字典 API（如 `/v2/dict/exp-status-labels`）上线后，
 * 可将本文件改为从字典 API 动态加载，各调用方无需修改。
 *
 * 注意：本文件仅负责 exp_msg / exp_library 等实验业务模块的映射，
 * 通用状态映射（如用户/组织状态）见 `@/components/v2/V2StatusBadge`。
 */

// ─── exp_msg.status（审核状态）─────────────────────────────
// DB 定义：`t` 草稿，`y` 通过，`n` 不通过
export const EXP_MSG_STATUS_LABEL: Record<string, string> = {
  y: "已通过",
  t: "草稿",
  n: "未通过",
} as const;

export const EXP_MSG_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "y", label: "已通过" },
  { value: "t", label: "草稿" },
  { value: "n", label: "未通过" },
];

// ─── exp_library.status（标准库状态）────────────────────────
// DB 定义：`t` 草稿，`y` 发布，`n` 停用
export const EXP_LIBRARY_STATUS_LABEL: Record<string, string> = {
  y: "已上架",
  n: "已下架",
  t: "待审核",
} as const;

// ─── choose_type（必做/选做）─────────────────────────────────
// DB 定义：`y` 必做，`n` 选做
export const EXP_CHOOSE_TYPE_LABEL: Record<string, string> = {
  y: "必做",
  n: "选做",
} as const;

// ─── exp_task_type（作业类型）────────────────────────────────
// DB 定义：`hw` / `tk` / `self`
export const EXP_TASK_TYPE_LABEL: Record<string, string> = {
  hw: "作业",
  tk: "拍同款",
  self: "自主",
} as const;

// ─── create_user_type（发布人类型）───────────────────────────
// DB 定义：Teacher / Student
export const EXP_USER_TYPE_LABEL: Record<string, string> = {
  Teacher: "教师",
  Student: "学生",
} as const;

// ─── 学段编码 → 中文名 ──────────────────────────────────────
export const PHASE_LABEL: Record<string, string> = {
  primary: "小学",
  junior: "初中",
  senior: "高中",
} as const;

// ─── 工具函数 ──────────────────────────────────────────────

/** 取 exp_msg.status 显示文本，兜底返回原始值 */
export function expStatusLabel(status: string | null | undefined): string {
  return status ? EXP_MSG_STATUS_LABEL[status] ?? status : "—";
}

/** 取 exp_library.status 显示文本，兜底返回原始值 */
export function expLibraryStatusLabel(status: string | null | undefined): string {
  return status ? EXP_LIBRARY_STATUS_LABEL[status] ?? status : "—";
}

/** 取 choose_type 显示文本 */
export function chooseTypeLabel(v: string | null | undefined): string {
  return v ? EXP_CHOOSE_TYPE_LABEL[v] ?? v : "—";
}

/** 取 exp_task_type 显示文本 */
export function taskTypeLabel(v: string | null | undefined): string {
  return v ? EXP_TASK_TYPE_LABEL[v] ?? v : "—";
}

/** 取 create_user_type 显示文本 */
export function userTypeLabel(t: string | null | undefined): string {
  return t ? EXP_USER_TYPE_LABEL[t] ?? t : "";
}

/** 学段编码 → 中文名，兜底返回原始值 */
export function phaseLabel(id: string | null | undefined): string {
  return id ? PHASE_LABEL[id] ?? id : "—";
}

/**
 * DB 状态码 → 生命周期状态（前端 internal 枚举）
 * 映射规则与 `deriveEditorPeerLifecycleFromWorkflow` 一致。
 */
export function dbStatusToLifecycle(status: string | null | undefined): "DRAFT" | "PENDING" | "PUBLISHED" {
  if (status === "y") return "PUBLISHED";
  if (status === "t") return "DRAFT";
  return "PENDING";
}

/**
 * DB 状态码 → 工作流状态
 * 映射规则与 `v2StatusToWorkflow` 一致。
 */
export function dbStatusToWorkflow(status: string | null | undefined): "draft" | "published" | "changes_requested" {
  if (status === "y") return "published";
  if (status === "n") return "changes_requested";
  return "draft";
}
