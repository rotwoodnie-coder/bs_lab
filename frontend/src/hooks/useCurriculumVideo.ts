"use client";

import * as React from "react";
import type { ApiActor } from "@/lib/new-core-api";
import {
  createCurriculumRowVideoApi,
  deleteCurriculumRowVideoApi,
  listCurriculumRowVideos,
  reorderCurriculumRowVideosApi,
  updateCurriculumRowVideoApi,
  type CurriculumRowVideo,
} from "@/lib/curriculum-row-videos-api";
import { formatMediaPlatformRegistryRef, mediaRegistryStreamUrl, parseMediaPlatformRegistryRef } from "@/lib/media-platform/registry-ref";
import { uploadMediaFileToPlatform } from "@/lib/media-platform/upload-client";
import { fetchV2FileById } from "@/lib/v2/v2-file-api";

type BusyMap = Record<string, boolean>;

export function useVideoPagination(total: number) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (total <= 0) {
      setCurrentIndex(0);
      return;
    }
    setCurrentIndex((prev) => Math.min(prev, total - 1));
  }, [total]);

  const next = React.useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prev = React.useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + total) % total);
  }, [total]);

  const goTo = React.useCallback(
    (index: number) => {
      if (total <= 0) return;
      const nextIndex = Math.max(0, Math.min(index, total - 1));
      setCurrentIndex(nextIndex);
    },
    [total],
  );

  return { currentIndex, next, prev, goTo };
}

export function useCurriculumVideo(actor: ApiActor, rowId?: string | null) {
  const [videos, setVideos] = React.useState<CurriculumRowVideo[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [busyIds, setBusyIds] = React.useState<BusyMap>({});
  const [objectUrls, setObjectUrls] = React.useState<Record<string, string>>({});

  const refresh = React.useCallback(async () => {
    if (!rowId) return [];
    setLoading(true);
    try {
      const items = await listCurriculumRowVideos(actor, rowId);
      setVideos(items);
      setObjectUrls((prev) => {
        const next = { ...prev };
        for (const v of items) {
          const regId = parseMediaPlatformRegistryRef(v.sourceUrl);
          if (regId) next[v.id] = mediaRegistryStreamUrl(regId, "view", actor);
        }
        return next;
      });
      for (const video of items) {
        const registryId = parseMediaPlatformRegistryRef(video.sourceUrl);
        if (!registryId) continue;
        void fetchV2FileById(actor, registryId).catch(() => null);
      }
      return items;
    } finally {
      setLoading(false);
    }
  }, [actor, rowId]);

  React.useEffect(() => {
    setVideos([]);
    void refresh();
  }, [refresh]);

  const addUpload = React.useCallback(
    async (file: File) => {
      if (!rowId) return null;
      setSaving(true);
      try {
        const result = await uploadMediaFileToPlatform(actor, file, { kind: "video", title: file.name });
        const created = await createCurriculumRowVideoApi(actor, rowId, {
          title: file.name,
          sourceUrl: formatMediaPlatformRegistryRef(result.registryId),
        });
        const fileRow = await fetchV2FileById(actor, result.assetId);
        const posterUrl = fileRow.logoUrl?.trim() || result.fileUrl || result.viewUrl;
        setObjectUrls((prev) => ({ ...prev, [created.id]: posterUrl }));
        await refresh();
        return created;
      } finally {
        setSaving(false);
      }
    },
    [actor, refresh, rowId],
  );

  const bindUploadAsset = React.useCallback(
    async (registryId: string, title?: string) => {
      if (!rowId) return null;
      const normalized = registryId.trim();
      if (!normalized) return null;
      setSaving(true);
      try {
        const viewUrl = mediaRegistryStreamUrl(normalized, "view", actor);
        const created = await createCurriculumRowVideoApi(actor, rowId, {
          title: title?.trim() || "平台视频",
          sourceUrl: formatMediaPlatformRegistryRef(normalized),
        });
        setObjectUrls((prev) => ({ ...prev, [created.id]: viewUrl }));
        await refresh();
        return created;
      } finally {
        setSaving(false);
      }
    },
    [actor, refresh, rowId],
  );

  const removeVideo = React.useCallback(
    async (videoId: string) => {
      if (!rowId) return;
      setBusyIds((prev) => ({ ...prev, [videoId]: true }));
      try {
        await deleteCurriculumRowVideoApi(actor, rowId, videoId);
        await refresh();
      } finally {
        setBusyIds((prev) => {
          const next = { ...prev };
          delete next[videoId];
          return next;
        });
      }
    },
    [actor, refresh, rowId],
  );

  const updateVideo = React.useCallback(
    async (videoId: string, patch: { title?: string; sourceUrl?: string }) => {
      if (!rowId) return null;
      const updated = await updateCurriculumRowVideoApi(actor, rowId, videoId, patch);
      await refresh();
      return updated;
    },
    [actor, refresh, rowId],
  );

  const reorderVideos = React.useCallback(
    async (idsInOrder: string[]) => {
      if (!rowId) return [];
      const next = await reorderCurriculumRowVideosApi(actor, rowId, idsInOrder);
      setVideos(next);
      return next;
    },
    [actor, rowId],
  );

  return { videos, loading, saving, busyIds, objectUrls, refresh, addUpload, bindUploadAsset, removeVideo, updateVideo, reorderVideos };
}
