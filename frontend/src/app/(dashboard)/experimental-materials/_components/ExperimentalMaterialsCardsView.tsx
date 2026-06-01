"use client";

import * as React from "react";
import { Badge, Button, MediaPreview } from "@bs-lab/ui";
import { Pencil, Star, StarOff } from "lucide-react";

import type { ExperimentalMaterialsViewMode } from "../page.types";
import { ExperimentalMaterialsViewToggle } from "./ExperimentalMaterialsViewToggle";
import {
  getExperimentalMaterialCategoryDisplayLabels,
  getExperimentalMaterialRiskLevel,
  getExperimentalMaterialRiskLabel,
  getExperimentalMaterialRiskSummary,
  getExperimentalMaterialTypeLabel,
  type ExperimentalMaterialRecord,
} from "@/data/experimental-materials";

export function ExperimentalMaterialsCardsView(props: {
  rows: ExperimentalMaterialRecord[];
  canMaintain: boolean;
  onToggleFavorite: (id: string) => void | Promise<void>;
  onCopy: (record: ExperimentalMaterialRecord) => void;
  onView: (record: ExperimentalMaterialRecord) => void;
  onEdit: (record: ExperimentalMaterialRecord) => void;
  onDelete: (record: ExperimentalMaterialRecord) => void;
  mode?: "default" | "picker";
  view?: ExperimentalMaterialsViewMode;
  onViewChange?: (view: ExperimentalMaterialsViewMode) => void;
}) {
  if (props.rows.length === 0) {
    if (props.mode === "picker") return <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">暂无材料数据。</div>;
    return <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">暂无材料数据，可新增材料或放宽筛选条件。</div>;
  }

  if (props.mode === "picker") {
    return (
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {props.rows.map((record) => (
          <div
            key={record.id}
            role="button"
            tabIndex={0}
            onClick={() => props.onView(record)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              props.onView(record);
            }}
            className="cursor-pointer overflow-hidden rounded-lg border border-border bg-background shadow-none transition-transform hover:-translate-y-0.5 hover:shadow-sm"
            aria-label={`添加材料：${record.name}`}
          >
            <div className="relative p-2">
              {record.photoUrl ? (
                <div className="mx-auto h-[100px] w-[200px] overflow-hidden rounded-md border border-border">
                  <MediaPreview kind="image" src={record.photoUrl} alt={record.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="mx-auto flex h-[100px] w-[200px] items-center justify-center rounded-md border border-border bg-muted text-sm text-muted-foreground">暂无材料图片</div>
              )}
            </div>

            <div className="border-t border-border px-3 py-2">
              <div className="line-clamp-1 text-sm font-medium text-foreground">{record.name}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const view = props.view;
  const onViewChange = props.onViewChange;
  const showViewToggle = view != null && onViewChange != null;

  return (
    <div className="space-y-4">
      {showViewToggle ? (
        <div className="flex items-center">
          <ExperimentalMaterialsViewToggle view={view} onViewChange={onViewChange} />
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
      {props.rows.map((record) => (
        <article
          key={record.id}
          className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="relative overflow-hidden rounded-t-xl bg-muted/10 p-2">
            {record.photoUrl ? (
              <div className="mx-auto aspect-video w-full max-w-[320px] overflow-hidden rounded-lg">
                <MediaPreview kind="image" src={record.photoUrl} alt={record.name} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="mx-auto flex aspect-video w-full max-w-[320px] items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">暂无材料图片</div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
              <Button type="button" size="sm" variant="secondary" onClick={() => props.onView(record)}>
                快速预览
              </Button>
            </div>
          </div>

          <div className="p-3">
            <div className="space-y-2">
              <div>
                <h3 className="line-clamp-1 text-base font-semibold text-foreground">{record.name}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {getExperimentalMaterialCategoryDisplayLabels(record).map((label) => (
                  <Badge key={label} variant="secondary" className="shrink-0">
                    {label}
                  </Badge>
                ))}
                {record.materialType.trim() ? (
                  <Badge variant="outline" className="shrink-0">
                    {getExperimentalMaterialTypeLabel(record.materialType)}
                  </Badge>
                ) : null}

              </div>
            </div>

            <div className="mt-2 space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>创建人：{record.displayOwnerName || "—"}</span>
              </div>
              <div>
                <div className="font-medium text-foreground">实验用途</div>
                <p className="line-clamp-2 text-muted-foreground">{record.usage}</p>
              </div>

              <div>
                <div className="font-medium text-foreground">建议用量</div>
                <p className="mt-0.5 line-clamp-2 text-muted-foreground">{`${record.numValue || record.suggestedAmount || "—"} ${record.unitId || ""}`.trim()}</p>
              </div>

              <div>
                <div className="font-medium text-foreground">安全提示</div>
                {(() => {
                  const riskLevel = getExperimentalMaterialRiskLevel(record);
                  const riskVariant = riskLevel === "high" ? "destructive" : riskLevel === "medium" ? "warning" : riskLevel === "low" ? "secondary" : "outline";
                  const riskLabel = getExperimentalMaterialRiskLabel(riskLevel);
                  const riskText = getExperimentalMaterialRiskSummary(record);

                  return (
                    <div className="mt-0.5 flex items-start gap-2">
                      <Badge variant={riskVariant}>{riskLabel}</Badge>
                      <div className={`text-sm ${riskLevel === "high" ? "text-destructive" : "text-muted-foreground"} leading-relaxed`}>{riskText}</div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-end gap-1.5 border-t border-border pt-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => props.onEdit(record)}
                disabled={!props.canMaintain}
                aria-label="编辑材料"
              >
                <Pencil className="size-4" />
                编辑
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={!props.canMaintain} onClick={() => props.onCopy(record)}>
                复制
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => void props.onToggleFavorite(record.id)}
                aria-label={record.favorited ? "取消收藏" : "加入收藏"}
              >
                {record.favorited ? <Star className="size-4 fill-current text-primary" /> : <StarOff className="size-4 text-muted-foreground" />}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => props.onView(record)}>
                查看
              </Button>
              <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={!props.canMaintain} onClick={() => props.onDelete(record)}>
                删除
              </Button>
            </div>
          </div>
        </article>
      ))}
      </div>
    </div>
  );
}
