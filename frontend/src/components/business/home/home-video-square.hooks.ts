"use client";

import * as React from "react";

import { useSessionActor } from "@/hooks/use-session-actor";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import { teacherMaterialFromDataFileRecord, type TeacherMaterialItem } from "@/lib/teacher-materials-api";
import { fetchV2FileListPage } from "@/lib/v2/v2-file-api";
import type { ApiActor } from "@/lib/new-core-api";

export type HomeVideoSquareState = {
  items: TeacherMaterialItem[];
  loading: boolean;
  actor: ApiActor;
};

/**
 * 首页视频广场数据 hooks。
 * 从 `GET /v2/file` 拉取已验证文件，按推断的视频类型筛选，按时间倒序排列。
 */
export function useHomeVideoSquare(): HomeVideoSquareState {
  const { role, orgId, hydrated } = useSessionActor();
  const [items, setItems] = React.useState<TeacherMaterialItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  const actor = React.useMemo(
    () => buildMaterialsApiActor(role, orgId, "materials-page"),
    [role, orgId],
  );

  React.useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const page = await fetchV2FileListPage(actor, {
          status: "y",
          page: 1,
          pageSize: 50,
        });
        if (cancelled) return;
        const videoItems = page.items
          .map(teacherMaterialFromDataFileRecord)
          .filter((it) => it.kind === "video")
          .sort((a, b) => {
            const ta = a.updatedAt || "";
            const tb = b.updatedAt || "";
            return tb.localeCompare(ta);
          });
        setItems(videoItems);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, actor]);

  return { items, loading, actor };
}
