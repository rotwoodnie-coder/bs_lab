"use client";

import * as React from "react";
import { Badge, Button, MediaPreview, Progress, sonnerToast } from "@bs-lab/ui";
import { FileUp, Trash2, X } from "@bs-lab/ui/icons";
import type { TeacherMaterialKind } from "@/lib/teacher-materials-api";
import { cn } from "@/lib/utils";
import { collectFilesFromDrop } from "../_lib/collect-drop-files";
import { inferKindFromFile } from "../_lib/teacher-material-file-kind";

export function acceptByKind(kind: TeacherMaterialKind): string {
  const k = kind.toLowerCase();
  if (k === "image" || k.includes("image") || k.includes("photo")) return "image/*";
  if (k === "video" || k.includes("video")) return "video/*";
  if (k === "audio" || k.includes("audio") || k.includes("sound") || k.includes("music")) return "audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac";
  if (k === "word" || k.includes("doc")) return ".doc,.docx";
  if (k === "ppt" || k.includes("ppt")) return ".ppt,.pptx";
  if (k === "pdf" || k.includes("pdf")) return ".pdf";
  return ".xls,.xlsx,.csv";
}

function acceptAllSupportedKinds(): string {
  return "image/*,video/*,audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.doc,.docx,.ppt,.pptx,.pdf,.xls,.xlsx,.csv";
}

function splitSupportedFiles(files: File[]): { supported: File[]; unsupportedCount: number } {
  const supported: File[] = [];
  let unsupportedCount = 0;
  for (const file of files) {
    if (inferKindFromFile(file)) {
      supported.push(file);
    } else {
      unsupportedCount += 1;
    }
  }
  return { supported, unsupportedCount };
}

function kindLabel(kind: TeacherMaterialKind | null): string {
  switch (kind) {
    case "video":
      return "视频";
    case "audio":
      return "音频";
    case "image":
      return "图片";
    case "word":
      return "Word";
    case "ppt":
      return "PPT";
    case "pdf":
      return "PDF";
    case "spreadsheet":
      return "Excel";
    default:
      return "未识别";
  }
}

type Props = {
  kind: TeacherMaterialKind;
  kindOptions: { value: string; label: string }[];
  selectedFiles: File[];
  onPickFiles: (files: File[]) => void;
  onRemoveAt: (index: number) => void;
  previewUrl: string;
  previewTitle: string;
  dragging: boolean;
  onDraggingChange: (v: boolean) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  getFileKey?: (file: File) => string;
  uploadStates?: Record<string, { status: "pending" | "uploading" | "success" | "failed"; progress: number; message?: string }>;
  recoveredEntries?: Array<{
    key: string;
    name: string;
    size: number;
    type: string;
    state: { status: "pending" | "uploading" | "success" | "failed"; progress: number; message?: string };
  }>;
  /** 从会话恢复队列中移除一条（不写库，仅清本地快照状态） */
  onRemoveRecovered?: (key: string) => void;
};

export function TeacherMaterialsCreateFilePicker(props: Props) {
  const keyOf = React.useCallback((file: File) => props.getFileKey?.(file) ?? file.name, [props]);
  const directoryInputRef = React.useRef<HTMLInputElement | null>(null);
  const k = props.kind.toLowerCase();
  const mediaKind = k === "video" || k.includes("video") ? "video" : "image";
  const first = props.selectedFiles[0];
  const showMediaPreview =
    Boolean(props.previewUrl) &&
    (k === "video" || k === "image" || k.includes("video") || k.includes("image") || k.includes("photo")) &&
    props.selectedFiles.length <= 1;

  React.useEffect(() => {
    const el = directoryInputRef.current;
    if (!el) return;
    el.setAttribute("webkitdirectory", "");
    el.setAttribute("directory", "");
  }, []);

  const onPickFiles = React.useCallback(
    (files: File[]) => {
      const { supported, unsupportedCount } = splitSupportedFiles(files);
      if (unsupportedCount > 0) {
        sonnerToast.warning("已忽略不支持的文件类型", {
          description: `目录中有 ${unsupportedCount} 个文件不在支持范围内`,
        });
      }
      if (supported.length === 0) {
        sonnerToast.error("未找到可上传文件", {
          description: "请确认目录内包含图片、视频、音频、Word、PPT、PDF 或 Excel 文件",
        });
        return;
      }
      props.onPickFiles(supported);
    },
    [props],
  );

  return (
    <div className="space-y-3">
      <input
        ref={props.inputRef}
        type="file"
        className="hidden"
        multiple
        accept={acceptAllSupportedKinds()}
        onChange={(e) => {
          const list = Array.from(e.currentTarget.files ?? []);
          onPickFiles(list);
          e.currentTarget.value = "";
        }}
      />
      <input
        ref={directoryInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={(e) => {
          const list = Array.from(e.currentTarget.files ?? []);
          onPickFiles(list);
          e.currentTarget.value = "";
        }}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => props.inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          props.inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          props.onDraggingChange(true);
        }}
        onDragLeave={() => props.onDraggingChange(false)}
        onDrop={(e) => {
          e.preventDefault();
          props.onDraggingChange(false);
          void (async () => {
            const droppedFiles = await collectFilesFromDrop(e.dataTransfer);
            onPickFiles(droppedFiles);
          })();
        }}
        className={`relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition ${
          props.dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <div className="relative aspect-video w-full bg-muted/20">
          {showMediaPreview ? (
            <MediaPreview
              kind={mediaKind}
              variant={mediaKind === "video" ? "default" : undefined}
              src={props.previewUrl}
              alt={props.previewTitle || "素材预览"}
              className="size-full"
              videoProps={{ playsInline: true, preload: "metadata" }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
              <div className="rounded-full bg-muted p-3">
                <FileUp className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{props.dragging ? "释放文件以上传" : "拖拽文件到此处"}</p>
                <p className="text-xs text-muted-foreground">
                  或点击选择，支持多选{props.kindOptions.find((v) => v.value === props.kind)?.label ?? props.kind}文件
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => directoryInputRef.current?.click()}>
          选择目录
        </Button>
      </div>
      {props.selectedFiles.length > 0 || (props.recoveredEntries?.length ?? 0) > 0 ? (
        <div className="max-h-36 space-y-2 overflow-auto rounded-md border border-border bg-muted/20 p-2 text-xs">
          {props.selectedFiles.length > 0 ? (
            <ul className="space-y-1">
              {props.selectedFiles.map((file, index) => (
                <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-foreground">{file.name}</span>
                      <Badge variant={inferKindFromFile(file) ? "outline" : "destructive"}>
                        {kindLabel(inferKindFromFile(file))}
                      </Badge>
                      {(() => {
                        const state = props.uploadStates?.[keyOf(file)];
                        if (!state) return null;
                        const tone =
                          state.status === "success"
                            ? "secondary"
                            : state.status === "failed"
                              ? "destructive"
                              : state.status === "uploading"
                                ? "outline"
                                : "outline";
                        const label =
                          state.status === "success"
                            ? "成功"
                            : state.status === "failed"
                              ? "失败"
                              : state.status === "uploading"
                                ? `上传中 ${state.progress}%`
                                : "待上传";
                        return <Badge variant={tone}>{label}</Badge>;
                      })()}
                    </div>
                    {props.uploadStates?.[keyOf(file)]?.status === "uploading" ? (
                      <Progress value={props.uploadStates[keyOf(file)]!.progress} className="mt-1 h-1.5" />
                    ) : null}
                    {props.uploadStates?.[keyOf(file)]?.message ? (
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{props.uploadStates[keyOf(file)]!.message}</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0"
                    onClick={() => props.onRemoveAt(index)}
                    aria-label="移除文件"
                    disabled={props.uploadStates?.[keyOf(file)]?.status === "uploading"}
                  >
                    <X className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}

          {(props.recoveredEntries?.length ?? 0) > 0 ? (
            <div
              className={cn(
                "space-y-1",
                props.selectedFiles.length > 0 ? "border-t border-border/60 pt-2" : "",
              )}
            >
              <div className="px-0.5 text-[11px] font-medium text-muted-foreground">恢复队列</div>
              <ul className="space-y-1">
                {(props.recoveredEntries ?? []).map((entry) => {
                  const tone =
                    entry.state.status === "success"
                      ? "secondary"
                      : entry.state.status === "failed"
                        ? "destructive"
                        : entry.state.status === "uploading"
                          ? "outline"
                          : "outline";
                  const label =
                    entry.state.status === "success"
                      ? "成功"
                      : entry.state.status === "failed"
                        ? "失败"
                        : entry.state.status === "uploading"
                          ? `上传中断于 ${entry.state.progress}%`
                          : "待上传";
                  return (
                    <li key={`recovered-${entry.key}`} className="flex items-center justify-between gap-2 opacity-90">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-foreground">{entry.name}</span>
                          <Badge variant="outline">已恢复</Badge>
                          <Badge variant={tone}>{label}</Badge>
                        </div>
                        {entry.state.message ? (
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{entry.state.message}</p>
                        ) : null}
                      </div>
                      {props.onRemoveRecovered ? (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => props.onRemoveRecovered?.(entry.key)}
                          aria-label="从恢复队列移除"
                          disabled={entry.state.status === "uploading"}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">请选择文件：将上传至 V2 文件库并绑定课件素材记录；可选多个文件批量创建。</div>
      )}
      {first && props.selectedFiles.length > 1 ? (
        <div className="text-xs text-muted-foreground">已选 {props.selectedFiles.length} 个文件，将按文件名分别生成素材名称。</div>
      ) : null}
    </div>
  );
}
