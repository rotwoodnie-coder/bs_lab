"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { fetchV2ExpList } from "@/lib/v2/v2-exp-api";

/**
 * 新建实验页面检测当前用户是否存在未发布的草稿实验。
 * 如果存在且用户确认继续编辑，则跳转到该草稿。
 */
export function useExistingDraftCheck() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const expIdFromUrl = searchParams.get("id");

  const actor = React.useMemo<CoreApiActor>(
    () => ({
      role: user.role,
      orgId: user.orgId,
      userId: user.userId,
      userName: user.userName,
      tenantId: user.tenantId,
      appId: user.appId,
    }),
    [user.appId, user.orgId, user.role, user.tenantId, user.userId, user.userName],
  );

  React.useEffect(() => {
    // 已有实验 ID（编辑现有实验），不检测
    if (expIdFromUrl) return;
    if (!actor.userId) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetchV2ExpList(actor, {
          status: "t",
          page: 1,
          pageSize: 1,
        });
        if (cancelled) return;
        const draft = res.items?.[0];
        if (
          draft &&
          confirm(`您有一个未完成的草稿实验"${draft.expName}"，是否继续编辑？`)
        ) {
          router.push(`/teacher/experiment-editor?id=${draft.expId}`);
        }
      } catch {
        // 静默处理：无法检测不影响用户使用
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [expIdFromUrl, actor, router]);
}
