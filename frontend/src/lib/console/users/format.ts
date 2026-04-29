import { USER_ROLE_OPTIONS, type RoleId } from "./types";
import { formatZhDate, formatZhDateTime } from "@/lib/datetime/format-zh";

/** 格式化 expire_date：NULL 表示永久有效 */
export function formatExpireDate(date: string | null): string {
  if (!date) return "永久有效";
  return formatZhDate(date);
}

export function roleLabel(id: string) {
  return USER_ROLE_OPTIONS.find((r) => r.id === id)?.label ?? id;
}

export function initials(name: string) {
  const t = name.replace(/\s/g, "");
  return t.length <= 2 ? t : t.slice(0, 2);
}

export function formatLastActive(iso: string) {
  return formatZhDateTime(iso);
}
