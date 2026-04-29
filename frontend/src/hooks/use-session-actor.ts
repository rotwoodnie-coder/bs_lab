"use client";

import * as React from "react";

import { useAuth, authRoleToUserRole } from "@/hooks/use-auth";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { UserRole } from "@/types/auth";

/**
 * 正式会话身份真源：来自后端 Cookie Session + /v2/auth/profile。
 * 用于替代 DemoRole（身份），确保“切换身份”与后端鉴权一致。
 */
export function useSessionActor(): {
  hydrated: boolean;
  role: UserRole;
  orgId: string;
  actor: CoreApiActor;
} {
  const auth = useAuth();
  const hydrated = !auth.loading && Boolean(auth.user.userId);
  const role = authRoleToUserRole(auth.user.role);
  const orgId = auth.user.orgId || "";
  const actor = React.useMemo<CoreApiActor>(
    () => ({
      role,
      orgId,
      userId: auth.user.userId || "anonymous",
      userName: auth.user.userName || auth.user.userId || "anonymous",
      orgName: auth.user.orgName || undefined,
      tenantId: auth.user.tenantId,
      appId: auth.user.appId,
    }),
    [auth.user.appId, auth.user.tenantId, auth.user.userId, auth.user.userName, auth.user.orgName, orgId, role],
  );

  // role 为空时兜底 student，避免下游类型炸裂
  void UserRole;
  return { hydrated, role, orgId, actor };
}

