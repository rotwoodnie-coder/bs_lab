"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  sonnerToast,
} from "@bs-lab/ui";

import type { DictOption } from "@/lib/v2/v2-dict-adapter";
import type { ApiActor } from "@/lib/new-core-api";
import type { MediaUploadInput } from "../page.types";
import { uploadFileViaMultipart } from "@/lib/media-platform/multipart-upload";

type Props = {
  actor: ApiActor;
  fileTypeOptions: DictOption[];
  onCompleted: () => Promise<void>;
};

function MediaTypeSelect({
  value,
  onChange,
}: {
  value: MediaUploadInput["mediaType"];
  onChange: (value: MediaUploadInput["mediaType"]) => void;
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as MediaUploadInput["mediaType"])}>
      <SelectTrigger id="media-type">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="IMAGE">图片</SelectItem>
        <SelectItem value="VIDEO">视频</SelectItem>
        <SelectItem value="DOC">文档</SelectItem>
        <SelectItem value="AUDIO">音频</SelectItem>
        <SelectItem value="PPT">PPT</SelectItem>
        <SelectItem value="PDF">PDF</SelectItem>
        <SelectItem value="EXCEL">Excel</SelectItem>
      </SelectContent>
    </Select>
  );
}

function mediaTypeToUploadFormFields(mediaType: MediaUploadInput["mediaType"]): { teacherMaterialKind: string } {
  switch (mediaType) {
    case "IMAGE":
      return { teacherMaterialKind: "image" };
    case "VIDEO":
      return { teacherMaterialKind: "video" };
    case "DOC":
      return { teacherMaterialKind: "word" };
    case "AUDIO":
      return { teacherMaterialKind: "audio" };
    case "PPT":
      return { teacherMaterialKind: "ppt" };
    case "PDF":
      return { teacherMaterialKind: "pdf" };
    case "EXCEL":
      return { teacherMaterialKind: "spreadsheet" };
    default:
      return { teacherMaterialKind: "image" };
  }
}

function UploadForm({ actor, fileTypeOptions, onCompleted }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [title, setTitle] = React.useState("未命名素材");
  const [mediaType, setMediaType] = React.useState<MediaUploadInput["mediaType"]>("IMAGE");
  const [fileTypeId, setFileTypeId] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);

  const [uploadProgress, setUploadProgress] = React.useState(0);

  const submit = async () => {
    if (!file) {
      sonnerToast.error("请先选择要上传的文件");
      return;
    }
    setLoading(true);
    setUploadProgress(0);
    try {
      const kind = mediaTypeToUploadFormFields(mediaType);
      const { reused, fileRecord } = await uploadFileViaMultipart(actor, file, {
        fileName: file.name,
        title: title.trim() || file.name.trim() || "未命名素材",
        teacherMaterialKind: kind.teacherMaterialKind,
        onProgress: (e) => setUploadProgress(e.percent),
      });

      const id = fileRecord.fileId;
      if (reused) {
        sonnerToast.message("已存在相同内容的文件", {
          description: `已复用已有登记：${id.slice(0, 8)}…，未重复占用存储。`,
        });
      } else {
        sonnerToast.success(`已写入 data_file：${id.slice(0, 8)}…`);
      }
      setFile(null);
      await onCompleted();
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "上传建档失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <div className="text-sm font-medium text-foreground">上传（data_file）</div>
      <p className="text-muted-foreground text-xs">
        通过 <code className="rounded bg-muted px-1">POST /v2/file/multipart/*</code> 分片直连后端，支持最大 2GB 文件。
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="console-media-file">文件</Label>
          <Input
            id="console-media-file"
            type="file"
            className="cursor-pointer"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="media-title">显示名称</Label>
          <Input id="media-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="media-type">MIME 路由（上传管道）</Label>
          <MediaTypeSelect value={mediaType} onChange={setMediaType} />
        </div>
        <div className="space-y-1 md:col-span-2">
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="data-file-type">字典类型（data_file_type）</Label>
          <select
            id="data-file-type"
            className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
            value={fileTypeId}
            onChange={(e) => setFileTypeId(e.target.value)}
          >
            <option value="">不指定（由后端默认）</option>
            {fileTypeOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button type="button" size="sm" onClick={() => void submit()} disabled={loading}>
        {loading ? `上传中（${Math.round(uploadProgress)}%）…` : "上传并登记"}
      </Button>
    </div>
  );
}

export function ConsoleMediaWorkbench(props: Props) {
  return (
    <Card className="border-border shadow-none">
      <CardContent className="p-4">
        <UploadForm {...props} />
      </CardContent>
    </Card>
  );
}
