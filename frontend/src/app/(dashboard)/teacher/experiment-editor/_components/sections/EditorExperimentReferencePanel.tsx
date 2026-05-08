"use client";

import * as React from "react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  type RichMediaEmbed,
  type RichMediaValue,
} from "@bs-lab/ui";

import { MediaAssetPickerDialog } from "@/components/business/media/MediaAssetPickerDialog";
import { RichHtmlEditor } from "@bs-lab/ui";
import type { ApiActor } from "@/lib/new-core-api";
import { mediaRegistryStreamUrl } from "@/lib/media-platform/registry-ref";
import { uploadMediaFileToPlatform } from "@/lib/media-platform/upload-client";

import type { ExperimentReferenceCitationDraft } from "../../types";
import { StepContentRichEditor } from "../StepContentRichEditor";

export function EditorExperimentReferencePanel(props: {
  fieldDisabled: boolean;
  mediaActor: ApiActor;
  referenceCitations: ExperimentReferenceCitationDraft[];
  addReferenceCitation: () => void;
  removeReferenceCitation: (id: string) => void;
  updateReferenceCitation: (
    id: string,
    field: keyof Pick<ExperimentReferenceCitationDraft, "citedExperimentTitle" | "sourceOrLink" | "note">,
    value: string,
  ) => void;
  referenceVideo: string;
  setReferenceVideo: (v: string) => void;
  referenceVideos: Array<{ id: string; videoUrl: string; fileId: string | null; sortOrder: number }>;
  addReferenceVideo: () => void;
  removeReferenceVideo: (id: string) => void;
  setReferenceVideos: (v: Array<{ id: string; videoUrl: string; fileId: string | null; sortOrder: number }>) => void;
  referenceRichText: string;
  referenceRichEmbeds: RichMediaEmbed[];
  onReferenceRichChange: (next: RichMediaValue) => void;
}) {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickingIndex, setPickingIndex] = React.useState<number | null>(null);

  const openPickerForIndex = React.useCallback((idx: number) => {
    setPickingIndex(idx);
    setPickerOpen(true);
  }, []);

  const handlePick = React.useCallback(
    async (registryId: string) => {
      const url = mediaRegistryStreamUrl(registryId, "view", props.mediaActor);
      if (pickingIndex != null && pickingIndex < props.referenceVideos.length) {
        const next = [...props.referenceVideos];
        next[pickingIndex] = {
          ...next[pickingIndex],
          videoUrl: url,
          fileId: registryId,
          sortOrder: pickingIndex,
        };
        props.setReferenceVideos(next);
      }
      setPickerOpen(false);
      setPickingIndex(null);
    },
    [pickingIndex, props],
  );

  const handleAddFromLibrary = React.useCallback(() => {
    props.addReferenceVideo();
    const newIdx = props.referenceVideos.length;
    openPickerForIndex(newIdx);
  }, [openPickerForIndex, props]);

  const removeVideo = React.useCallback(
    (idx: number) => {
      const vid = props.referenceVideos[idx];
      if (vid) props.removeReferenceVideo(vid.id);
    },
    [props],
  );

  return (
    <div id="experimentReference" className="scroll-mt-24">
      <Card className="rounded-[28px] border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <CardHeader>
          <CardTitle className="text-base">实验参考</CardTitle>
          <CardDescription>
            填写本实验借鉴或引用的实验案例、教材内容或公开资料，便于后续追溯与复用。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">建议优先补充实验名称与来源信息。</p>
            <Button type="button" variant="secondary" size="sm" onClick={props.addReferenceCitation} disabled={props.fieldDisabled}>
              新增参考条目
            </Button>
          </div>
          {props.referenceCitations.length === 0 ? null : (
            <ul className="grid gap-4">
              {props.referenceCitations.map((row, index) => (
                <li key={row.id} className="rounded-lg border border-border bg-muted/20 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">引用 {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => props.removeReferenceCitation(row.id)}
                      disabled={props.fieldDisabled}
                    >
                      删除本条
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor={`cit-title-${row.id}`}>被引用实验名称</Label>
                      <Input
                        id={`cit-title-${row.id}`}
                        value={row.citedExperimentTitle}
                        onChange={(e) => props.updateReferenceCitation(row.id, "citedExperimentTitle", e.target.value)}
                        disabled={props.fieldDisabled}
                        placeholder="请输入被引用实验名称"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`cit-src-${row.id}`}>出处或链接</Label>
                      <Input
                        id={`cit-src-${row.id}`}
                        value={row.sourceOrLink ?? ""}
                        onChange={(e) => props.updateReferenceCitation(row.id, "sourceOrLink", e.target.value)}
                        disabled={props.fieldDisabled}
                        placeholder="请输入来源或链接"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`cit-note-${row.id}`}>与本实验的关联说明</Label>
                      <RichHtmlEditor
                        value={row.note ?? ""}
                        onChange={(html) => props.updateReferenceCitation(row.id, "note", html)}
                        disabled={props.fieldDisabled}
                        title={`关联说明 · 引用 ${index + 1}`}
                        placeholder="请输入关联说明"
                        onUploadImage={async (file) => {
                          const result = await uploadMediaFileToPlatform(props.mediaActor, file, { kind: "image", title: file.name });
                          return result?.viewUrl?.trim() ? { src: result.viewUrl } : null;
                        }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {/* 引用视频列表（多视频） */}
          <div className="grid gap-3 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <Label>引用视频</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={props.fieldDisabled}
                onClick={handleAddFromLibrary}
              >
                新增引用视频
              </Button>
            </div>
            {props.referenceVideos.length === 0 ? (
              <p className="text-xs text-muted-foreground">暂未添加引用视频。</p>
            ) : (
              <ul className="grid gap-3">
                {props.referenceVideos.map((rv, idx) => (
                  <li key={`refvid-${idx}`} className="flex items-center gap-3 rounded-lg border border-border bg-muted/10 p-3">
                    <div className="h-16 w-28 shrink-0 overflow-hidden rounded-md border border-border bg-muted/20">
                      {rv.videoUrl ? (
                        <div className="flex h-full w-full items-center justify-center bg-black/5 text-xs text-muted-foreground">
                          视频 {idx + 1}
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          待选择
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">
                        {rv.videoUrl ? `视频 ${idx + 1}` : "未选择视频"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {rv.videoUrl ? rv.videoUrl.slice(0, 60) : "请从媒体库选择视频"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={props.fieldDisabled}
                        onClick={() => openPickerForIndex(idx)}
                      >
                        选择
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={props.fieldDisabled}
                        onClick={() => removeVideo(idx)}
                      >
                        删除
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <MediaAssetPickerDialog
              open={pickerOpen}
              onOpenChange={(open) => {
                setPickerOpen(open);
                if (!open) setPickingIndex(null);
              }}
              kind="video"
              actor={props.mediaActor}
              title="选择引用视频"
              description="从媒体中台已登记素材中选择引用视频。"
              onPick={handlePick}
            />
          </div>
          <div className="grid gap-2 border-t border-border pt-4">
            <StepContentRichEditor
              mediaActor={props.mediaActor}
              disabled={props.fieldDisabled}
              content={props.referenceRichText}
              contentEmbeds={props.referenceRichEmbeds}
              onChange={props.onReferenceRichChange}
              editorTitle="参考补充说明（富文本）"
              contentPlaceholder="可补充引用依据、图表来源、关键参数对照等（支持插入图片/视频）。"
              textRows={6}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
