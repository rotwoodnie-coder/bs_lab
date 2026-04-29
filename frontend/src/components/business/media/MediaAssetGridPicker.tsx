"use client";

import * as React from "react";
import { Button, Input, sonnerToast } from "@bs-lab/ui";
import { Search } from "@bs-lab/ui/icons";

import type { ApiActor } from "@/lib/new-core-api";
import { searchMediaRegistry } from "@/lib/media-platform/media-api";
import type { MediaKind, MediaRegistryHit } from "@/lib/media-platform/types";

import { MediaRegistryStreamPreview } from "./MediaRegistryStreamPreview";

type PickerItem = MediaRegistryHit & {
  assetMediaType: string;
  resourceName?: string;
  materialName?: string;
  assetTitle?: string;
};

export type MediaAssetGridPickerProps = {
  kind: MediaKind;
  actor: ApiActor;
  onPick: (registryId: string) => void | Promise<void>;
  onPicked?: () => void;
  className?: string;
};

function fmtSizePlaceholder(hit: MediaRegistryHit) {
  void hit;
  return "媒体中台";
}

function hitMatchesKind(hit: PickerItem, kind: MediaKind): boolean {
  const t = (hit.assetMediaType ?? "UNKNOWN").toUpperCase();
  if (kind === "image") return t === "IMAGE";
  if (kind === "video") return t === "VIDEO";
  return false;
}

function getAssetDisplayName(item: PickerItem): string {
  return (
    item.resourceName?.trim() ||
    item.materialName?.trim() ||
    item.assetTitle?.trim() ||
    item.title?.trim() ||
    `登记 ${item.id.slice(0, 8)}…`
  );
}

function AssetCard({
  kind,
  item,
  actor,
  onPick,
  disabled,
}: {
  kind: MediaKind;
  item: PickerItem;
  actor: ApiActor;
  onPick: (registryId: string) => void | Promise<void>;
  disabled: boolean;
}) {
  const displayName = getAssetDisplayName(item);
  const previewClassName = kind === "image" ? "mx-auto my-2 h-[100px] w-[200px] min-h-0 rounded-sm" : "size-full min-h-0";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void onPick(item.id)}
      className="group flex w-full flex-col overflow-hidden rounded-md border border-border bg-background text-left transition hover:bg-muted/20 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className={kind === "image" ? "relative h-[116px] w-full bg-muted/10" : "relative aspect-video w-full bg-muted/10"}>
        <MediaRegistryStreamPreview
          fileId={item.id}
          actor={actor}
          title={displayName || item.title || "预览"}
          fileExt={item.fileExt}
          assetMediaType={item.assetMediaType}
          logoUrl={item.logoUrl}
          className={previewClassName}
        />
      </div>
      <div className="space-y-1 p-3">
        <div className="truncate text-sm font-medium text-foreground">{displayName}</div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{fmtSizePlaceholder(item)}</span>
          <span>{item.reviewStatus}</span>
        </div>
      </div>
    </button>
  );
}

export function MediaAssetGridPicker({ kind, actor, onPick, onPicked, className }: MediaAssetGridPickerProps) {
  const [loading, setLoading] = React.useState(false);
  const [picking, setPicking] = React.useState(false);
  const [items, setItems] = React.useState<PickerItem[]>([]);
  const [q, setQ] = React.useState("");

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const baseHits = await searchMediaRegistry(actor, "", undefined);
      let mergedHits = baseHits;

      // 兜底：兼容历史 tenant/app 口径差异，空结果时尝试多通道查询。
      const orgIdAsTenant = actor.orgId?.trim();
      const actorTenantId = actor.tenantId?.trim();
      const actorAppId = actor.appId?.trim() || "console";
      const appCandidates = actorAppId === "lab" ? ["lab", "console"] : ["console", "lab"];

      if (mergedHits.length === 0) {
        const headerCandidates: Record<string, string>[] = [];

        for (const appId of appCandidates) {
          if (appId !== actorAppId) {
            headerCandidates.push({ "x-app-id": appId });
          }
        }

        if (orgIdAsTenant && orgIdAsTenant !== actorTenantId) {
          headerCandidates.push({ "x-tenant-id": orgIdAsTenant });
          for (const appId of appCandidates) {
            headerCandidates.push({ "x-tenant-id": orgIdAsTenant, "x-app-id": appId });
          }
        }

        const dedup = new Map<string, MediaRegistryHit>();
        for (const hit of baseHits) dedup.set(hit.id, hit);

        for (const headers of headerCandidates) {
          const hits = await searchMediaRegistry(actor, "", undefined, headers);
          for (const hit of hits) dedup.set(hit.id, hit);
        }

        mergedHits = [...dedup.values()];
      }

      const normalized: PickerItem[] = mergedHits.map((h) => ({
        ...h,
        assetMediaType: h.assetMediaType ?? "UNKNOWN",
      }));
      setItems(normalized.filter((h) => hitMatchesKind(h, kind)));
    } catch (e) {
      sonnerToast.error("加载失败", { description: e instanceof Error ? e.message : "未知错误" });
    } finally {
      setLoading(false);
    }
  }, [actor, kind]);

  React.useEffect(() => {
    setQ("");
    void refresh();
  }, [refresh]);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (it) =>
        getAssetDisplayName(it).toLowerCase().includes(needle) ||
        it.id.toLowerCase().includes(needle) ||
        (it.matchSnippet ?? "").toLowerCase().includes(needle),
    );
  }, [items, q]);

  const onPickSafe = React.useCallback(
    async (registryId: string) => {
      if (picking) return;
      setPicking(true);
      try {
        await onPick(registryId);
        onPicked?.();
      } finally {
        setPicking(false);
      }
    },
    [onPick, onPicked, picking],
  );

  const disabled = loading || picking;

  return (
    <div className={`grid gap-4 ${className ?? ""}`}>
      <div className="flex items-center gap-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索素材资源名称或登记 ID" className="pl-9" />
        </div>
        <Button type="button" variant="outline" disabled={disabled} onClick={() => void refresh()}>
          {loading ? "刷新中..." : "刷新"}
        </Button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-muted-foreground">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          暂无可选素材：请先上传并登记到媒体中台，或调整搜索关键词。
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((it) => (
            <AssetCard key={it.id} kind={kind} item={it} actor={actor} onPick={onPickSafe} disabled={disabled} />
          ))}
        </div>
      )}
    </div>
  );
}
