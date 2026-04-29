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
  VideoManagerField,
  type RichMediaEmbed,
  type RichMediaValue,
  sonnerToast,
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
  referenceRichText: string;
  referenceRichEmbeds: RichMediaEmbed[];
  onReferenceRichChange: (next: RichMediaValue) => void;
}) {
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const applyVideoRegistry = React.useCallback(
    async (registryId: string) => {
      const url = mediaRegistryStreamUrl(registryId, "view", props.mediaActor);
      props.setReferenceVideo(url);
      setPickerOpen(false);
    },
    [props],
  );

  const uploadVideo = React.useCallback(
    async (file: File) => {
      let result;
      try {
        result = await uploadMediaFileToPlatform(props.mediaActor, file, { kind: "video", title: file.name });
      } catch {
        return;
      }
      try {
        await applyVideoRegistry(result.registryId);
      } catch (error) {
        sonnerToast.error("上传已成功但预览地址绑定失败", {
          description: error instanceof Error ? error.message : "未知错误",
        });
      }
    },
    [applyVideoRegistry, props.mediaActor],
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
          <div className="grid gap-2 border-t border-border pt-4">
            <Label htmlFor="ref-video">参考视频（可选）</Label>
            <VideoManagerField
              value={props.referenceVideo}
              onChange={props.setReferenceVideo}
              disabled={props.fieldDisabled}
              onUploadFile={uploadVideo}
              onOpenLibrary={() => setPickerOpen(true)}
              libraryPicker={
                <MediaAssetPickerDialog
                  open={pickerOpen}
                  onOpenChange={setPickerOpen}
                  kind="video"
                  actor={props.mediaActor}
                  onPick={applyVideoRegistry}
                />
              }
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
