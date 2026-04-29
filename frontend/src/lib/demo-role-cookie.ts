import type { UserRole } from "@/types/auth";
import { USER_ROLE_ORDER } from "@/types/auth";

/** 供 Route Handler 读取的角色 Cookie（非 HttpOnly，仅用于本地/环境）。 */
export const DEMO_USER_ROLE_COOKIE_NAME = "bs_lab_demo_user_role";

export function isKnownUserRole(value: string | undefined): value is UserRole {
  return Boolean(value && (USER_ROLE_ORDER as readonly string[]).includes(value));
}

/** 在浏览器写入 Cookie，使同域 API 能进行服务端角色解析。 */
export function syncDemoUserRoleCookie(role: UserRole): void {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${DEMO_USER_ROLE_COOKIE_NAME}=${encodeURIComponent(role)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}
