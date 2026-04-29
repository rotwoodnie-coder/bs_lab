"use client";

import * as React from "react";
import { ImageManagerField, sonnerToast } from "@bs-lab/ui";

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

export function MediaRegistryImageField(props: {
  actor: ApiActor;
  value: string;
  onChange: (nextUrl: string) => void;
  disabled?: boolean;
  resolveUploadTitle?: (file: File) => string;
}) {
  const [open, setOpen] = React.useState(false);

  const applyRegistryId = React.useCallback(
    async (registryId: string) => {
      const url = mediaRegistryStreamUrl(registryId, "view", props.actor);
      props.onChange(url);
      setOpen(false);
    },
    [props],
  );

  const uploadImage = React.useCallback(
    async (file: File) => {
      let result;
      try {
        result = await uploadMediaFileToPlatform(props.actor, file, {
          kind: "image",
          title: props.resolveUploadTitle?.(file) || file.name,
        });
      } catch {
        return;
      }
      try {
        await applyRegistryId(result.registryId);
      } catch (error) {
        sonnerToast.error("上传已成功但图片绑定失败", {
          description: error instanceof Error ? error.message : "未知错误",
        });
      }
    },
    [applyRegistryId, props.actor, props.resolveUploadTitle],
  );

  return (
    <ImageManagerField
      value={props.value}
      onChange={(next) => {
        const parsed = parseRegistryIdFromStreamUrl(next);
        if (parsed) {
          props.onChange(mediaRegistryStreamUrl(parsed, "view", props.actor));
          return;
        }
        props.onChange(next);
      }}
      disabled={props.disabled}
      onUploadFile={props.disabled ? undefined : uploadImage}
      onOpenLibrary={props.disabled ? undefined : () => setOpen(true)}
      libraryPicker={
        props.disabled ? undefined : (
          <MediaAssetPickerDialog open={open} onOpenChange={setOpen} kind="image" actor={props.actor} onPick={applyRegistryId} />
        )
      }
    />
  );
}
