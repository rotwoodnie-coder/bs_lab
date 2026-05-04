"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  Grid3X3,
  Play,
  User,
} from "@bs-lab/ui/icons";
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, Card, CardContent, CardHeader, CardTitle, Spinner } from "@bs-lab/ui";
import { sonnerToast } from "@bs-lab/ui";

import { useSessionActor } from "@/hooks/use-session-actor";
import type { ApiActor } from "@/lib/new-core-api";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { fetchV2MaterialDetail, type V2MaterialDetail } from "@/lib/v2/v2-material-api";
import { fetchV2FileById, type V2DataFileRecord } from "@/lib/v2/v2-file-api";
import {
  listTeacherMaterialsApi,
  type TeacherMaterialItem,
} from "@/lib/teacher-materials-api";
import { fetchV2ExpDetail, type V2ExpMsgDetail } from "@/lib/v2/v2-exp-api";
import { materialStorageBrowserHref } from "@/lib/material-asset-url";
import { kindLabel } from "@/app/(dashboard)/teacher/materials/_lib/material-preview.utils";
import { formatZhDateTime } from "@/lib/datetime/format-zh";

/* ── 解析 material_msg.comments 中的 eid ── */
function parseExperimentIdFromComments(comments: string | null | undefined): string | null {
  if (!comments?.trim()) return null;
  try {
    const o = JSON.parse(comments) as Record<string, unknown>;
    const eid = o.eid;
    if (typeof eid === "string" && eid.trim()) return eid.trim();
    return null;
  } catch {
    return null;
  }
}

/* ── data_file 到 TeacherMaterialItem 转换（简化版，仅详情用）── */
function dataFileToTeacherItem(f: V2DataFileRecord): TeacherMaterialItem {
  return {
    materialId: f.fileId,
    rowSource: "data_file",
    title: f.fileName?.trim() || "未命名文件",
    kind: "video",
    experimentId: null,
    linkedExperimentTitle: null,
    dataFileIdMr: null,
    dataFileIdMa: f.fileId,
    originalFilename: f.fileName?.trim() || null,
    directFileUrl: materialStorageBrowserHref(f.fileUrl),
    updatedAt: f.updateTime?.trim() || f.createTime?.trim() || "—",
    materialStatus: f.status?.trim() || null,
    materialMainPicUrl: null,
    expPurpose: null,
    additionalComments: null,
    materialNum: null,
    ownerUserId: f.ownerUserId?.trim() || null,
    ownerUserName: f.ownerUserName?.trim() || null,
    ownerAvatarUrl: null,
    ownerTitleName: null,
    ownerOrgName: null,
    logoUrlRaw: null,
    dataFileContentSha256: f.contentSha256?.trim() || null,
    dataFileTypeId: f.fileTypeId?.trim() || null,
    coverFileId: f.coverFileId?.trim() || null,
    coverFileUrl: null,
  };
}

/* ── V2MaterialDetail 到 TeacherMaterialItem 转换 ── */
function materialDetailToTeacherItem(d: V2MaterialDetail): TeacherMaterialItem {
  const comments = d.comments?.trim() ? (() => {
    try { return JSON.parse(d.comments) as Record<string, unknown>; } catch { return null; }
  })() : null;
  const eid = comments && typeof comments.eid === "string" ? (comments.eid as string).trim() : null;
  const lt = comments && typeof comments.lt === "string" ? (comments.lt as string).trim() : null;
  const main = d.mainPicUrl?.trim() || d.logoUrl?.trim() || "";
  return {
    materialId: d.materialId,
    rowSource: "material_msg",
    title: d.materialName?.trim() || "未命名素材",
    kind: "video",
    experimentId: eid,
    linkedExperimentTitle: lt,
    dataFileIdMr: null,
    dataFileIdMa: null,
    originalFilename: null,
    directFileUrl: main || null,
    updatedAt: d.updateTime?.trim() || d.createTime?.trim() || "—",
    materialStatus: d.status?.trim() || null,
    materialMainPicUrl: main || null,
    expPurpose: d.expPurpose?.trim() || null,
    additionalComments: d.additionalComments?.trim() || null,
    materialNum: d.materialNum != null ? Number(d.materialNum) : null,
    ownerUserId: d.createUserId?.trim() || null,
    ownerUserName: d.displayOwnerName?.trim() || null,
    ownerAvatarUrl: null,
    ownerTitleName: null,
    ownerOrgName: null,
    logoUrlRaw: null,
  };
}

export function useResourceDetailPage(resourceId: string) {
  const session = useSessionActor();
  const { hydrated } = session;

  const actor = React.useMemo<CoreApiActor>(
    () => ({
      role: session.role,
      orgId: session.orgId,
      userId: session.actor.userId,
      userName: session.actor.userName,
    }),
    [session.role, session.orgId, session.actor.userId, session.actor.userName],
  );

  const [item, setItem] = React.useState<TeacherMaterialItem | null>(null);
  const [expDetail, setExpDetail] = React.useState<V2ExpMsgDetail | null>(null);
  const [relatedItems, setRelatedItems] = React.useState<TeacherMaterialItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAll = React.useCallback(() => {
    if (!hydrated || !resourceId) return;
    setLoading(true);
    setError(null);

    const actorApi: ApiActor = {
      role: actor.role,
      orgId: actor.orgId,
      userId: actor.userId,
      userName: actor.userName,
    };

    let resolved: { item: TeacherMaterialItem; experimentId: string | null } | null = null;

    // 1. 先尝试按 material_msg 拉取
    void fetchV2MaterialDetail(actor, resourceId)
      .then((detail) => {
        const it = materialDetailToTeacherItem(detail);
        resolved = { item: it, experimentId: it.experimentId };
        setItem(it);
      })
      .catch(() => {
        // 2. material_msg 未命中 → 尝试 data_file
        return fetchV2FileById(actor, resourceId)
          .then((file) => {
            const it = dataFileToTeacherItem(file);
            resolved = { item: it, experimentId: null };
            setItem(it);
          })
          .catch(() => {
            throw new Error("素材不存在或无权访问");
          });
      })
      .then(() => {
        // 3. 有关联实验 → 拉取实验详情 + 同课程素材
        if (!resolved) return;
        const eid = resolved.experimentId;
        if (!eid) return;

        // 拉取实验详情
        void fetchV2ExpDetail(actor, eid)
          .then((exp) => setExpDetail(exp))
          .catch(() => { /* 非关键路径，静默 */ });

        // 拉取全量素材列表，前端按 experimentId 过滤同课程素材
        void listTeacherMaterialsApi(actorApi)
          .then((all) => {
            const sameCourse = all
              .filter((it) => it.experimentId === eid && it.materialId !== resolved!.item.materialId)
              .slice(0, 6);
            setRelatedItems(sameCourse);
          })
          .catch(() => { /* 非关键路径，静默 */ });
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "加载失败";
        setError(msg);
        sonnerToast.error(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [actor, hydrated, resourceId]);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const retry = React.useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  return { item, expDetail, relatedItems, loading, error, retry, actor, hydrated };
}
