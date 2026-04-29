"use client";

import * as React from "react";
import { buildApiUrl, buildCoreApiJsonHeaders } from "@/lib/core-api-shared";
import type { ApiActor } from "@/lib/new-core-api";
import { fetchV2FileById, type V2DataFileRecord } from "@/lib/v2/v2-file-api";

export type MediaPreviewState = "idle" | "checking" | "scheduled" | "ready" | "failed";

export function useMediaPreview(actor: ApiActor, fileId?: string | null, autoEnsure = true) {
  const [file, setFile] = React.useState<V2DataFileRecord | null>(null);
  const [state, setState] = React.useState<MediaPreviewState>("idle");
  const ensuredRef = React.useRef(new Set<string>());

  const reload = React.useCallback(async () => {
    if (!fileId) return null;
    const next = await fetchV2FileById(actor, fileId);
    setFile(next);
    return next;
  }, [actor, fileId]);

  React.useEffect(() => {
    let alive = true;
    void (async () => {
      if (!fileId) return;
      setState("checking");
      const next = await fetchV2FileById(actor, fileId).catch(() => null);
      if (!alive || !next) {
        setState("failed");
        return;
      }
      setFile(next);
      if (next.logoUrl?.trim()) {
        setState("ready");
        return;
      }
      if (!autoEnsure) {
        setState("idle");
        return;
      }
      if (ensuredRef.current.has(fileId)) {
        setState("scheduled");
        return;
      }
      ensuredRef.current.add(fileId);
      const res = await fetch(buildApiUrl(`/v2/file/${encodeURIComponent(fileId)}/thumbnail/ensure`), {
        method: "POST",
        headers: buildCoreApiJsonHeaders(actor),
        body: JSON.stringify({ force: false }),
      }).catch(() => null);
      setState(res?.ok ? "scheduled" : "failed");
    })();
    return () => {
      alive = false;
    };
  }, [actor, autoEnsure, fileId]);

  return {
    file,
    thumbnailUrl: file?.logoUrl?.trim() || null,
    state,
    reload,
    hasThumbnail: Boolean(file?.logoUrl?.trim()),
  };
}
