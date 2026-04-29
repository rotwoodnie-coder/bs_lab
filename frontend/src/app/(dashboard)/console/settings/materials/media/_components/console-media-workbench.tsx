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

function mediaTypeToUploadFormFields(mediaType: MediaUploadInput["mediaType"]): { mediaKind?: string; teacherMaterialKind?: string } {
  switch (mediaType) {
    case "IMAGE":
      return { mediaKind: "image" };
    case "VIDEO":
      return { mediaKind: "video" };
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
      return { mediaKind: "image" };
  }
}

type ConsoleUploadJson = {
  ok?: boolean;
  data?: { assetId?: string; registryId?: string; reviewStatus?: string; fileUrl?: string | null; reused?: boolean };
  error?: string;
};

function UploadForm({ actor, fileTypeOptions, onCompleted }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [title, setTitle] = React.useState("未命名素材");
  const [mediaType, setMediaType] = React.useState<MediaUploadInput["mediaType"]>("IMAGE");
  const [fileTypeId, setFileTypeId] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);

  const submit = async () => {
    if (!file) {
      sonnerToast.error("请先选择要上传的文件");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title.trim() || file.name.trim() || "未命名素材");
      const kind = mediaTypeToUploadFormFields(mediaType);
      if (kind.teacherMaterialKind) fd.append("teacherMaterialKind", kind.teacherMaterialKind);
      else fd.append("mediaKind", kind.mediaKind ?? "image");
      fd.append("userId", actor.userId);
      fd.append("orgId", actor.orgId);
      fd.append("userName", actor.userName);
      fd.append("role", actor.role);
      if (fileTypeId.trim()) fd.append("fileTypeId", fileTypeId.trim());

      const res = await fetch("/api/media/upload", { method: "POST", body: fd });
      const payload = (await res.json()) as ConsoleUploadJson;
      if (!payload.ok || !payload.data?.assetId) {
        throw new Error(payload.error ?? "上传建档失败");
      }
      const id = payload.data.assetId;
      if (payload.data.reused) {
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
        经同源 <code className="rounded bg-muted px-1">/api/media/upload</code> 转发至{" "}
        <code className="rounded bg-muted px-1">POST /v2/file/upload</code>，字段与《数据库开发前规范》中{" "}
        <code className="rounded bg-muted px-1">data_file</code> / <code className="rounded bg-muted px-1">file_type_id</code>{" "}
        一致。
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
        {loading ? "提交中…" : "上传并登记"}
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
