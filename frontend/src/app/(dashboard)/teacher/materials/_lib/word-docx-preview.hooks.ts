"use client";

import * as React from "react";

import { resolvedTeacherMaterialDataFileId, type TeacherMaterialItem } from "@/lib/teacher-materials-api";
import { mediaRegistryStreamUrl } from "@/lib/media-platform/registry-ref";

type PreviewState = {
  html: string;
  loading: boolean;
  error: string | null;
};

export function useWordDocxPreviewHtml(item: TeacherMaterialItem | null, active: boolean): PreviewState {
  const [html, setHtml] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const streamId = item ? resolvedTeacherMaterialDataFileId(item) : null;
    const direct = item?.directFileUrl?.trim() ?? "";
    if (!active || item?.kind !== "word" || (!streamId && !direct)) {
      setHtml("");
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setHtml("");
    const url = streamId ? mediaRegistryStreamUrl(streamId, "view") : direct;
    fetch(url, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`读取文件失败（${res.status}）`);
        return res.arrayBuffer();
      })
      .then(async (buf) => {
        const mammoth = await import("mammoth");
        return mammoth.convertToHtml({ arrayBuffer: buf });
      })
      .then((result) => {
        if (!cancelled) setHtml(result.value);
      })
      .catch((e) => {
        const msg =
          e instanceof Error
            ? e.message.includes("zip") || e.message.includes("central directory")
              ? "当前预览仅支持 docx 格式，旧版 doc 请下载后本地查看"
              : e.message
            : "预览失败";
        if (!cancelled) setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active, item]);

  return { html, loading, error };
}
