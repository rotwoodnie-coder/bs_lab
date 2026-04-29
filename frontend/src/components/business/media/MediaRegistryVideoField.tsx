"use client";

import * as React from "react";
import { VideoManagerField, sonnerToast } from "@bs-lab/ui";

import type { ApiActor } from "@/lib/new-core-api";
import { mediaRegistryStreamUrl } from "@/lib/media-platform/registry-ref";
import { uploadMediaFileToPlatform } from "@/lib/media-platform/upload-client";

import { MediaAssetPickerDialog } from "./MediaAssetPickerDialog";

function parseRegistryIdFromStreamUrl(url: string): string | null {
  const t = url.trim();
  if (!t) return null;
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const u = t.startsWith("http") ? new URL(t) : new URL(t, base);
    const id = u.searchParams.get("registryId");
    return id?.trim() || null;
  } catch {
    return null;
  }
}

export function MediaRegistryVideoField(props: {
  actor: ApiActor;
  registryId: string;
  onRegistryIdChange: (nextRegistryId: string) => void;
  disabled?: boolean;
  emptyText?: string;
}) {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const rid = props.registryId.trim();
  const previewUrl = rid ? mediaRegistryStreamUrl(rid, "view", props.actor) : "";

  const applyRegistryId = React.useCallback(
    async (nextRegistryId: string) => {
      props.onRegistryIdChange(nextRegistryId.trim());
      setPickerOpen(false);
    },
    [props],
  );

  const onUpload = React.useCallback(
    async (file: File) => {
      let result;
      try {
        result = await uploadMediaFileToPlatform(props.actor, file, { kind: "video", title: file.name });
      } catch {
        return;
      }
      try {
        await applyRegistryId(result.registryId);
      } catch (error) {
        sonnerToast.error("上传已成功但绑定失败", {
          description: error instanceof Error ? error.message : "未知错误",
        });
      }
    },
    [applyRegistryId, props.actor],
  );

  return (
    <VideoManagerField
      value={previewUrl}
      disabled={props.disabled}
      onChange={(next) => {
        const parsed = parseRegistryIdFromStreamUrl(next);
        props.onRegistryIdChange(parsed ?? "");
      }}
      onUploadFile={onUpload}
      onOpenLibrary={() => setPickerOpen(true)}
      emptyText={props.emptyText ?? "暂无视频"}
      libraryPicker={
        <MediaAssetPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          kind="video"
          actor={props.actor}
          onPick={(id) => void applyRegistryId(id)}
        />
      }
    />
  );
}
