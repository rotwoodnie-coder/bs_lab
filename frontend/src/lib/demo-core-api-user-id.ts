import { UserRole } from "@/types/auth";

/**
 * 与后端 `material_msg.create_user_id`、历史 `edu_teacher_assets.teacher_user_id` 等对齐的用户 id。
 * 迁移数据常用 `demo-teacher-1`（参见 `HomeShell` 等旧联调示例）。
 */
export function demoCoreApiUserId(role: UserRole): string {
  const envTeacher = process.env.NEXT_PUBLIC_DEMO_TEACHER_USER_ID?.trim();
  if (role === UserRole.TEACHER && envTeacher) return envTeacher;
  if (role === UserRole.TEACHER) return "demo-teacher-1";
  return `${role.toLowerCase()}-demo`;
}
