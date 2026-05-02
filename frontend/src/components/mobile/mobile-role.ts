export type MobileRole = "student" | "parent" | "teacher" | "unknown";
export type MobileAudience = "primary" | "middle" | "parent" | "teacher";

export function resolveMobileAudience(input: { schoolLevelId?: string | null; role?: string | null }): MobileAudience {
  const role = String(input.role ?? "").trim().toLowerCase();
  const level = String(input.schoolLevelId ?? "").trim().toLowerCase();

  if (role.includes("parent") || role === "role_parent") return "parent";
  if (role.includes("teacher") || role.includes("role_teacher") || role.includes("researcher")) return "teacher";

  if (!level) return "primary";
  if (level.includes("middle") || level.includes("junior") || level.includes("初中")) return "middle";
  if (level.includes("high") || level.includes("senior") || level.includes("高中")) return "middle";
  return "primary";
}
