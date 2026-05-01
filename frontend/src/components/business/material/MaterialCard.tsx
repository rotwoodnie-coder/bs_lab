"use client";

import * as React from "react";
import { Badge, Avatar, AvatarImage, AvatarFallback } from "@bs-lab/ui";
import type { ApiActor } from "@/lib/new-core-api";
import type { TeacherMaterialItem } from "@/lib/teacher-materials-api";
import { MaterialPreviewCard } from "@/app/(dashboard)/teacher/materials/_components/MaterialPreviewCard";
import { getMaterialPreviewPayload, kindLabel } from "@/app/(dashboard)/teacher/materials/_lib/material-preview.utils";
import { materialStorageBrowserHref } from "@/lib/material-asset-url";

type Props = {
  item: TeacherMaterialItem;
  actor: ApiActor;
  mode: "waterfall" | "grid";
  onClick?: (item: TeacherMaterialItem) => void;
};

/** 纯展示素材卡片，无管理按钮。单击触发 onClick 打开预览弹窗。 */
export function MaterialCard({ item, actor, mode, onClick }: Props) {
  const preview = getMaterialPreviewPayload(item);
  const isWaterfall = mode === "waterfall";

  return (
    <article
      className="group mb-0.5 flex break-inside-avoid cursor-pointer flex-col rounded-xl border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
      style={{ contentVisibility: "auto" as any, containIntrinsicSize: "auto 280px" as any }}
      onClick={() => onClick?.(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(item);
        }
      }}
    >
      <div
        className={`relative shrink-0 overflow-hidden rounded-t-xl bg-muted/30 ${isWaterfall ? "aspect-video w-full" : "h-40 w-full"}`}
      >
        <MaterialPreviewCard
          preview={preview}
          title={item.title}
          className="h-full w-full rounded-none transition duration-300 group-hover:scale-[1.02]"
          actor={actor}
          repairSourceItem={item}
        />
        <div className="absolute right-2 top-2 z-10 flex flex-wrap justify-end gap-1">
          <Badge variant="secondary" className="font-normal">
            {kindLabel(item.kind)}
          </Badge>
        </div>
      </div>
      <div className="p-2">
        <div className="flex gap-2">
          {item.ownerUserName ? (
            <Avatar className="size-9 shrink-0 border border-border">
              {item.ownerAvatarUrl ? (
                <AvatarImage src={materialStorageBrowserHref(item.ownerAvatarUrl)} alt="" />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-lg font-extrabold text-primary">
                {item.ownerUserName.trim().slice(0, 1).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
              {item.title}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {item.ownerUserName ? (
                <span>
                  {item.ownerUserName}
                  {item.ownerTitleName ? <span className="opacity-60"> {item.ownerTitleName}</span> : null}
                  <span className="mx-1.5 opacity-30">·</span>
                </span>
              ) : null}
              {item.ownerOrgName ? (
                <span className="opacity-60">{item.ownerOrgName} </span>
              ) : null}
              <span>更新 {item.updatedAt}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
