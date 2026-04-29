import { cookies } from "next/headers";

import { DEMO_USER_ROLE_COOKIE_NAME, isKnownUserRole } from "@/lib/demo-role-cookie";
import { UserRole } from "@/types/auth";

/** 与环境 Cookie 对齐；正式环境应改为会话解析。 */
export async function resolveDemoRoleCookie(): Promise<UserRole> {
  const jar = await cookies();
  const raw = jar.get(DEMO_USER_ROLE_COOKIE_NAME)?.value;
  const decoded = raw ? decodeURIComponent(raw) : undefined;
  return isKnownUserRole(decoded) ? decoded : UserRole.STUDENT;
}
