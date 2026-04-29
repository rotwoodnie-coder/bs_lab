"use client";

import * as React from "react";

import { MediaRegistryImageField } from "@/components/business/media/MediaRegistryImageField";
import { MediaRegistryVideoField } from "@/components/business/media/MediaRegistryVideoField";
import type { ApiActor } from "@/lib/new-core-api";
import { mediaRegistryStreamUrl } from "@/lib/media-platform/registry-ref";

export function EditorVideoManagerField(props: {
  actor: ApiActor;
  value: string;
  onChange: (nextUrl: string) => void;
  disabled: boolean;
}) {
  const registryId = React.useMemo(() => {
    const raw = props.value.trim();
    if (!raw) return "";
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
      const u = raw.startsWith("http") ? new URL(raw) : new URL(raw, base);
      return u.searchParams.get("registryId")?.trim() ?? "";
    } catch {
      return "";
    }
  }, [props.value]);

  return (
    <MediaRegistryVideoField
      actor={props.actor}
      registryId={registryId}
      onRegistryIdChange={(nextRegistryId) => props.onChange(mediaRegistryStreamUrl(nextRegistryId, "view", props.actor))}
      disabled={props.disabled}
      emptyText="暂无视频"
    />
  );
}

export function EditorImageManagerField(props: {
  actor: ApiActor;
  value: string;
  onChange: (nextUrl: string) => void;
  disabled: boolean;
}) {
  return <MediaRegistryImageField actor={props.actor} value={props.value} onChange={props.onChange} disabled={props.disabled} />;
}
