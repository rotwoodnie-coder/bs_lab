"use client";

import * as React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  TabSwitcher,
  sonnerToast,
} from "@bs-lab/ui";
import { ArrowLeft, ListVideo, Search, Upload } from "@bs-lab/ui/icons";
import type { ApiActor } from "@/lib/new-core-api";
import { useCurriculumVideo } from "@/hooks/useCurriculumVideo";
import { MediaUploadButton } from "@/components/business/media/MediaUploadButton";
import { MediaAssetGridPicker } from "@/components/business/media/MediaAssetGridPicker";
import { readExperimentMgmtRows } from "@/lib/experiment-mgmt-mock-store";
import { patchVideoMeta, readVideoMeta, videoMetaKey } from "./video-manager/video-meta-store";
import { VideoManagerBoundWorkbench } from "./video-manager/VideoManagerBoundWorkbench";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actor: ApiActor;
  rowId?: string | null;
  rowTitle?: string;
  defaultVideoId?: string;
  onDefaultVideoChange?: (videoId: string | null) => void;
  /** 列表来自 `/v2/exp` 等非 mock 源时，用于写入视频元数据的学科/年级展示（与 `exp_msg.subject_id` / `grade_id` 字典一致）。 */
  videoMetaHard?: { subjectLabel: string; gradeLabels: string[] } | null;
};

export function VideoManagerDialog(props: Props) {
  const { videos, saving, busyIds, objectUrls, bindUploadAsset, removeVideo } = useCurriculumVideo(props.actor, props.rowId);
  const [view, setView] = React.useState<"bound" | "pick" | "upload">("bound");
  const [metaVersion, setMetaVersion] = React.useState(0);

  const experimentRow = React.useMemo(() => {
    if (!props.rowId) return null;
    const rows = readExperimentMgmtRows();
    const fromMock = rows.find((r) => r.id === props.rowId) ?? null;
    if (fromMock) return fromMock;
    if (props.videoMetaHard) {
      return {
        id: props.rowId,
        subjectLabel: props.videoMetaHard.subjectLabel,
        gradeLabels: [...props.videoMetaHard.gradeLabels],
      };
    }
    return null;
  }, [props.rowId, props.videoMetaHard]);

  React.useEffect(() => {
    if (!props.open) return;
    if (!props.rowId) return;
    if (!experimentRow) return;
    for (const v of videos) {
      const key = videoMetaKey({ rowId: props.rowId, videoId: v.id });
      const existing = readVideoMeta(key);
      const hardNext = { subjectLabel: experimentRow.subjectLabel, gradeLabels: experimentRow.gradeLabels };
      if (existing?.hard?.subjectLabel === hardNext.subjectLabel && (existing?.hard?.gradeLabels ?? []).join("|") === hardNext.gradeLabels.join("|")) {
        if (existing?.experimentId === props.rowId) continue;
      }
      patchVideoMeta(key, {
        experimentId: props.rowId,
        hard: hardNext,
        ops: {
          reviewStatus: existing?.ops?.reviewStatus ?? "pending",
          quality: existing?.ops?.quality ?? "unknown",
        },
      });
    }
    setMetaVersion((v) => v + 1);
  }, [experimentRow, props.open, props.rowId, videos]);

  const metaByVideoId = React.useMemo(() => {
    const out: Record<string, ReturnType<typeof readVideoMeta>> = {};
    for (const v of videos) {
      const key = videoMetaKey({ rowId: props.rowId, videoId: v.id });
      out[v.id] = readVideoMeta(key);
    }
    return out;
  }, [metaVersion, props.rowId, videos]);

  const onBindPlatformVideo = React.useCallback(
    async (registryId: string) => {
      if (!registryId.trim()) return;
      try {
        await bindUploadAsset(registryId.trim(), "平台视频");
        sonnerToast.success("已绑定媒体中台视频");
        setView("bound");
      } catch (error) {
        sonnerToast.error("绑定失败", { description: error instanceof Error ? error.message : "未知错误" });
      }
    },
    [bindUploadAsset],
  );

  React.useEffect(() => {
    if (!props.open) return;
    setView("bound");
  }, [props.open]);

  const tabs = React.useMemo(
    () => [
      { id: "bound", label: "已绑定", icon: <ListVideo className="size-4" />, badge: videos.length },
      { id: "pick", label: "平台视频", icon: <Search className="size-4" /> },
      { id: "upload", label: "上传", icon: <Upload className="size-4" /> },
    ],
    [videos.length],
  );

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="flex h-screen w-screen max-w-none flex-col overflow-hidden rounded-none p-4 sm:h-[96vh] sm:w-[96vw] sm:max-w-[96vw] sm:rounded-2xl sm:p-5">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="flex items-center gap-2">
                {view !== "bound" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="-ml-2 size-8"
                    onClick={() => setView("bound")}
                    disabled={saving}
                    aria-label="返回已绑定"
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                ) : null}
                视频管理
              </DialogTitle>
              <DialogDescription>{props.rowTitle ?? "当前课标条目"} · 管理视频</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <TabSwitcher
          items={tabs}
          activeId={view}
          onChange={(id) => setView(id as typeof view)}
          variant="segmented"
          layoutIdPrefix="video-manager"
        />

        <div className="min-h-0 flex-1 overflow-hidden">
          {view === "bound" ? (
            <div className="grid h-full gap-3 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-sm">操作</Label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => setView("pick")}>
                    选择平台视频（预览）
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => setView("upload")}>
                    上传视频
                  </Button>
                </div>
              </div>
              <VideoManagerBoundWorkbench
                videos={videos}
                saving={saving}
                busyIds={busyIds}
                objectUrls={objectUrls}
                defaultVideoId={props.defaultVideoId}
                metaByVideoId={metaByVideoId}
                onDefaultVideoChange={props.onDefaultVideoChange}
                onRemoveVideo={removeVideo}
                onPatchVideoKeywords={(videoId, keywords) => {
                  const key = videoMetaKey({ rowId: props.rowId, videoId });
                  const prev = readVideoMeta(key) ?? {};
                  patchVideoMeta(key, {
                    content: {
                      ...prev.content,
                      keywords,
                    },
                  });
                  setMetaVersion((v) => v + 1);
                }}
              />
            </div>
          ) : null}

          {view === "pick" ? (
            <div className="grid h-full gap-2 overflow-y-auto">
              <Label className="text-sm">从媒体中台选择（已登记素材）</Label>
              <MediaAssetGridPicker kind="video" actor={props.actor} onPick={onBindPlatformVideo} onPicked={() => setView("bound")} />
            </div>
          ) : null}

          {view === "upload" ? (
            <div className="grid h-full content-start gap-3 overflow-y-auto">
              <Label className="text-sm">上传视频（媒体中台）</Label>
              <div className="rounded-md border border-border bg-muted/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-muted-foreground">选择视频文件后将登记到媒体中台并绑定到当前课标条目。</div>
                  <MediaUploadButton
                    kind="video"
                    actor={props.actor}
                    disabled={saving}
                    variant="default"
                    size="sm"
                    onUploaded={async (registryId) => {
                      await bindUploadAsset(registryId, "上传视频");
                      setView("bound");
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)} disabled={saving}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
