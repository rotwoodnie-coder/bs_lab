"use client";

import * as React from "react";

import { useAuth } from "@/hooks/use-auth";
import type { ApiActor } from "@/lib/new-core-api";
import { useSessionActor } from "@/hooks/use-session-actor";

/** 将角色与当前用户快照合并为媒体中台请求身份（开发期与 Cookie 角色对齐）。 */
export function useMediaActor(): ApiActor {
  const { role, orgId } = useSessionActor();
  const { user } = useAuth();
  return React.useMemo(
    () => ({
      role,
      orgId,
      userId: user.userId,
      userName: user.userName,
    }),
    [role, orgId, user.userId, user.userName],
  );
}
