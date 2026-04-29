"use client";

import * as React from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@bs-lab/ui";

import type { ApiActor } from "@/lib/new-core-api";
import type { MediaKind } from "@/lib/media-platform/types";

import { MediaAssetGridPicker } from "./MediaAssetGridPicker";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: MediaKind;
  actor: ApiActor;
  title?: string;
  description?: string;
  onPick: (registryId: string) => void | Promise<void>;
};

export function MediaAssetPickerDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{props.title ?? `选择${props.kind === "video" ? "视频" : "图片"}`}</DialogTitle>
          <DialogDescription>
            {props.description ?? "从媒体中台已登记素材中搜索并选择；点击卡片即可绑定到当前内容。"}
          </DialogDescription>
        </DialogHeader>

        <MediaAssetGridPicker kind={props.kind} actor={props.actor} onPick={props.onPick} />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
