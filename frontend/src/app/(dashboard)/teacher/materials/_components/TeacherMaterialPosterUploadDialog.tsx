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
  sonnerToast,
} from "@bs-lab/ui";
import { UploadCloud } from "@bs-lab/ui/icons";
import { postV2FilePosterUpload } from "@/lib/v2/v2-file-api";
import { resolvedTeacherMaterialDataFileId, type TeacherMaterialItem } from "@/lib/teacher-materials-api";
import type { ApiActor } from "@/lib/new-core-api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 要上传封面的素材 */
  target: TeacherMaterialItem | null;
  /** 上传封面成功后更新列表行 */
  onPosterPersisted?: (fileId: string, displayHref: string) => void;
  actor: ApiActor;
};

/** 手动上传封面弹窗：接受 JPEG/PNG，≤500KB，通过 POST /v2/file/:fileId/poster 上传 */
export function TeacherMaterialPosterUploadDialog({ open, onOpenChange, target, onPosterPersisted, actor }: Props) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const fileId = React.useMemo(() => {
    if (!target) return null;
    const fid =
      resolvedTeacherMaterialDataFileId(target) ??
      (target.rowSource === "data_file" ? target.materialId.trim() : "");
    return fid || null;
  }, [target]);

  // 重置状态
  React.useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploading(false);
    }
  }, [open]);

  const handleFileChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    // 校验：仅 JPEG/PNG
    const validTypes: string[] = ["image/jpeg", "image/png"];
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!validTypes.includes(file.type) && !["jpg", "jpeg", "png"].includes(ext)) {
      sonnerToast.error("仅支持 JPEG/PNG 格式的封面图片");
      return;
    }

    // 校验：≤500KB
    if (file.size > 500 * 1024) {
      sonnerToast.error("封面文件大小不能超过 500KB");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  const handleUpload = React.useCallback(async () => {
    if (!selectedFile || !fileId || !target) return;
    setUploading(true);
    try {
      const result = await postV2FilePosterUpload(
        actor,
        fileId,
        selectedFile,
      );
      onPosterPersisted?.(fileId, result.coverFileUrl);
      sonnerToast.success("封面上传成功", {
        description: target.title,
      });
      onOpenChange(false);
    } catch (error) {
      sonnerToast.error(error instanceof Error ? error.message : "封面上传失败");
    } finally {
      setUploading(false);
    }
  }, [selectedFile, fileId, target, onPosterPersisted, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>上传封面</DialogTitle>
          <DialogDescription>
            {target ? `为「${target.title}」上传自定义封面图片` : "选择封面图片"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 文件选择区 */}
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 p-6 transition-colors hover:bg-muted/40"
            onClick={() => inputRef.current?.click()}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="封面预览"
                className="max-h-48 max-w-full rounded object-contain"
              />
            ) : (
              <>
                <UploadCloud className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">点击选择封面图片</p>
                <p className="mt-1 text-xs text-muted-foreground">仅支持 JPEG/PNG，不超过 500KB</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {selectedFile && (
            <p className="text-xs text-muted-foreground">
              已选择：{selectedFile.name}（{(selectedFile.size / 1024).toFixed(1)}KB）
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            取消
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || uploading || !fileId}>
            {uploading ? "上传中..." : "上传封面"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
