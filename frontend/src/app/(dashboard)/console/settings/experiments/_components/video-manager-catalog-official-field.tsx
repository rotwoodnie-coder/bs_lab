"use client";

import * as React from "react";
import { Label } from "@bs-lab/ui";

import { MediaRegistryVideoField } from "@/components/business/media/MediaRegistryVideoField";
import type { ApiActor } from "@/lib/new-core-api";

export type VideoManagerCatalogOfficialFieldProps = {
  registryId: string;
  onRegistryIdChange: (next: string) => void;
  disabled?: boolean;
  actor: ApiActor;
  officialVideoReachable?: boolean | null;
  videoFieldRef?: React.Ref<HTMLDivElement>;
  /** 为 true 时不展示内置「官方视频」标题，由外层分区标题承接 */
  hideFieldTitle?: boolean;
};

/** 控制台标准实验：官方视频绑定（预览 / 上传 / 媒体库） */
export function VideoManagerCatalogOfficialField(props: VideoManagerCatalogOfficialFieldProps) {
  const rid = props.registryId.trim();
  const unreachable = props.officialVideoReachable === false && Boolean(rid);

  return (
    <div ref={props.videoFieldRef} className="space-y-2 rounded-md border border-border p-3">
      {props.hideFieldTitle ? null : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>官方视频</Label>
        </div>
      )}
      {unreachable ? (
        <p className="text-xs text-destructive">
          已绑定登记标识，但媒体库中暂无法解析对应素材。请重新从媒体库选择或上传视频。
        </p>
      ) : null}
      <MediaRegistryVideoField
        actor={props.actor}
        registryId={props.registryId}
        onRegistryIdChange={props.onRegistryIdChange}
        disabled={props.disabled}
        emptyText="暂无官方视频"
      />
    </div>
  );
}
