import type { Permission } from "@/lib/auth/role-permissions";

export type PermissionItem = { code: string; label: string };
export type PermissionGroup = { groupName: string; items: PermissionItem[] };

const PERMISSION_LABELS: Record<string, string> = {
  exp_view: "查看实验",
  exp_create: "创建实验",
  exp_edit: "编辑实验",
  exp_delete: "删除实验",
  exp_publish: "发布/下架实验",

  task_grade: "批改/评分",

  question_create: "创建题目",
  question_audit: "审核题目",

  user_manage: "用户管理",
  role_manage: "角色管理",
  org_manage: "组织管理",
  system_dict_write: "维护万能字典",

  ai_gen_question: "AI 生成题目",
};

function inferGroupName(code: string): string {
  if (code.startsWith("exp_")) return "实验管理";
  if (code.startsWith("task_")) return "任务与作业";
  if (code.startsWith("question_")) return "题库管理";
  if (code === "ai_gen_question" || code.startsWith("ai_")) return "AI 能力";
  if (code === "system_dict_write" || code.startsWith("system_dict_")) return "系统字典";
  if (code.endsWith("_manage")) return "系统管理";
  return "其它";
}

export function presentPermission(code: string): PermissionItem {
  return { code, label: PERMISSION_LABELS[code] ?? code };
}

export function groupPermissions(codes: readonly (Permission | string)[] | null | undefined): PermissionGroup[] {
  const uniq = Array.from(new Set((codes ?? []).filter(Boolean).map(String))).sort((a, b) => a.localeCompare(b));
  const map = new Map<string, PermissionItem[]>();
  uniq.forEach((code) => {
    const groupName = inferGroupName(code);
    const items = map.get(groupName) ?? [];
    items.push(presentPermission(code));
    map.set(groupName, items);
  });
  return Array.from(map.entries()).map(([groupName, items]) => ({ groupName, items }));
}

