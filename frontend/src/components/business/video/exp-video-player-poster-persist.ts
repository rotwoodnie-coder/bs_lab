"use client";

import * as React from "react";

import type { CoreApiActor } from "@/lib/core-api-shared";
import { getDataFileLogoCoverDisplayHref } from "@/lib/teacher-materials-api";
import { fetchV2FileById, postV2FilePosterUpload } from "@/lib/v2/v2-file-api";

import type { PosterPersistConfig } from "./exp-video-player.types";
import { writeRasterPosterToSession } from "./video-frame-capture";

const posterPersistLocks = new Set<string>();

function actorKey(a: PosterPersistConfig["actor"] | undefined): string {
  if (!a) return "";
  return `${a.userId}|${a.orgId}|${a.role}`;
}

export function useExpVideoPosterPersist(
  posterPersist: PosterPersistConfig | null | undefined,
  livePoster: string | null,
  propPoster: string,
  trimmedSrc: string,
  setLivePoster: (v: string | null) => void,
): void {
  const attemptKeyRef = React.useRef<string>("");
  const onPersistedRef = React.useRef(posterPersist?.onPersisted);
  onPersistedRef.current = posterPersist?.onPersisted;

  const fileId = posterPersist?.fileId?.trim() ?? "";
  const actor = posterPersist?.actor;
  const aKey = actorKey(actor);

  React.useEffect(() => {
    if (propPoster) attemptKeyRef.current = "";
  }, [propPoster]);

  React.useEffect(() => {
    if (!fileId || !actor) return;
    if (propPoster) return;
    if (!livePoster || !livePoster.startsWith("data:image/")) return;
    const attemptKey = `${trimmedSrc}|${fileId}`;
    if (attemptKeyRef.current === attemptKey) return;

    const run = async (): Promise<void> => {
      if (posterPersistLocks.has(fileId)) return;
      const core = actor as CoreApiActor;
      try {
        const row = await fetchV2FileById(core, fileId);
        const serverHref = getDataFileLogoCoverDisplayHref(row.logoUrl);
        if (serverHref) {
          attemptKeyRef.current = attemptKey;
          setLivePoster(serverHref);
          writeRasterPosterToSession(trimmedSrc, serverHref);
          onPersistedRef.current?.(fileId, serverHref);
          console.info(`[PosterPersist] Material / data_file ${fileId}, logo_url synced from server.`);
          return;
        }
      } catch {
        /* 继续尝试上传 */
      }
      posterPersistLocks.add(fileId);
      try {
        const blob = await fetch(livePoster).then((r) => r.blob());
        if (blob.size > 500 * 1024) return;
        const out = await postV2FilePosterUpload(core, fileId, blob);
        const href = getDataFileLogoCoverDisplayHref(out.logoUrl) ?? out.logoUrl.trim();
        attemptKeyRef.current = attemptKey;
        setLivePoster(href);
        writeRasterPosterToSession(trimmedSrc, href);
        onPersistedRef.current?.(fileId, href);
        console.info(`[PosterPersist] Material / data_file ${fileId}, logo_url persisted from client capture.`);
      } catch {
        attemptKeyRef.current = "";
      } finally {
        posterPersistLocks.delete(fileId);
      }
    };

    void run();
  }, [livePoster, propPoster, fileId, aKey, trimmedSrc, actor, setLivePoster]);
}
