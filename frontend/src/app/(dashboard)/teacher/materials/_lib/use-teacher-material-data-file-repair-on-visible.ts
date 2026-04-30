"use client";

import * as React from "react";

import type { ApiActor } from "@/lib/new-core-api";
import {
  inferKindFromFileNameOrUrlHints,
  resolvedTeacherMaterialDataFileId,
  type TeacherMaterialItem,
} from "@/lib/teacher-materials-api";
import { postV2FileDataRepair, postV2FileThumbnailEnsure } from "@/lib/v2/v2-file-api";

const touchedRepairKeys = new Set<string>();
const touchedThumbKeys = new Set<string>();

function repairFileIdForItem(item: TeacherMaterialItem): string | null {
  const r = resolvedTeacherMaterialDataFileId(item)?.trim();
  if (r) return r;
  if (item.rowSource === "data_file") return item.materialId?.trim() || null;
  return null;
}

function itemNeedsDataFileRepair(item: TeacherMaterialItem): boolean {
  const sha = (item.dataFileContentSha256 ?? "").trim();
  const tid = (item.dataFileTypeId ?? "").trim();
  return !sha || !tid;
}

function itemLooksLikeVideo(item: TeacherMaterialItem): boolean {
  if (item.kind === "video") return true;
  const u = item.directFileUrl?.trim() ?? "";
  return inferKindFromFileNameOrUrlHints(item.originalFilename, u) === "video";
}

/** 列表无栅格封面时，由服务端从对象存储抽帧写 `logo_url`（不依赖浏览器 canvas/CORS） */
function itemWantsServerThumbnail(item: TeacherMaterialItem): boolean {
  if (!itemLooksLikeVideo(item)) return false;
  if ((item.materialMainPicUrl ?? "").trim()) return false;
  return !!repairFileIdForItem(item);
}

/**
 * 素材卡片进入视口时静默维护 `data_file`：
 * - 缺 hash / file_type_id → `POST …/data-repair`
 * - 视频且无主图 → `POST …/thumbnail/ensure`（服务端写 `logo_url`；滚动即可触发，无需客户端截帧成功）
 */
function traceIdFromActor(actor: ApiActor): string {
  return [actor.orgId, actor.userId, actor.role].filter(Boolean).join("/");
}

function logRepairError(stage: string, actor: ApiActor, item: TeacherMaterialItem, error: unknown): void {
  console.error(`[teacher-materials] ${stage}`, {
    traceId: traceIdFromActor(actor),
    materialId: item.materialId,
    fileId: resolvedTeacherMaterialDataFileId(item) ?? item.materialId,
    kind: item.kind,
    error,
  });
}

export function useTeacherMaterialDataFileRepairOnVisible(
  actor: ApiActor | null | undefined,
  item: TeacherMaterialItem | null | undefined,
): React.RefObject<HTMLDivElement | null> {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const itemRef = React.useRef(item);
  itemRef.current = item;

  const materialId = item?.materialId ?? "";
  const sha = item?.dataFileContentSha256 ?? "";
  const tid = item?.dataFileTypeId ?? "";
  const rowSource = item?.rowSource ?? "";
  const ma = item?.dataFileIdMa ?? "";
  const mr = item?.dataFileIdMr ?? "";
  const kind = item?.kind ?? "";
  const mainPic = item?.materialMainPicUrl ?? "";

  /** 固定长度依赖：避免 HMR/水合前后 `useEffect` 依赖项个数变化触发 React 报错 */
  const itemMaintenanceDepsKey = React.useMemo(
    () => [materialId, sha, tid, rowSource, ma, mr, kind, mainPic].join("\x1f"),
    [materialId, sha, tid, rowSource, ma, mr, kind, mainPic],
  );

  React.useEffect(() => {
    const cur = itemRef.current;
    if (!actor || !cur || !materialId) return;
    const fid = repairFileIdForItem(cur);
    if (!fid) return;
    if (!itemNeedsDataFileRepair(cur) && !itemWantsServerThumbnail(cur)) return;
    const el = ref.current;
    if (!el) return;

    const trigger = (): void => {
      const live = itemRef.current;
      if (!live) return;
      const id = repairFileIdForItem(live);
      if (!id) return;

      if (itemNeedsDataFileRepair(live) && !touchedRepairKeys.has(id)) {
        touchedRepairKeys.add(id);
        void postV2FileDataRepair(actor, id)
          .then((r) => {
            if (r.skipped === "forbidden" || r.skipped === "not_found") {
              touchedRepairKeys.delete(id);
              return;
            }
            if (r.contentSha256Updated || r.fileTypeIdUpdated) {
              console.info(`[DataRepair] Material ID: ${itemRef.current?.materialId ?? id}, Hash/TypeID Updated.`);
            }
          })
          .catch((error) => {
            touchedRepairKeys.delete(id);
            logRepairError("teacher-materials:data-repair:failed", actor, live, error);
          });
      }

      if (itemWantsServerThumbnail(live) && !touchedThumbKeys.has(id)) {
        touchedThumbKeys.add(id);
        void postV2FileThumbnailEnsure(actor, id, {})
          .then((r) => {
            if (r.scheduled || r.alreadyHasLogo) {
              console.info(
                `[ThumbnailEnsure] data_file ${id} server thumbnail ${r.alreadyHasLogo ? "already present" : "scheduled"}.`,
              );
            }
          })
          .catch((error) => {
            touchedThumbKeys.delete(id);
            logRepairError("teacher-materials:thumbnail:ensure:failed", actor, live, error);
          });
      }
    };

    const ob = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          trigger();
          ob.disconnect();
          break;
        }
      },
      { root: null, rootMargin: "96px 0px", threshold: 0.04 },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [actor, itemMaintenanceDepsKey]);

  return ref;
}
