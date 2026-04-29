"use client";

import type { ReactNode } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bs-lab/ui";

import type { ApiActor } from "@/lib/new-core-api";
import {
  resolvedTeacherMaterialDataFileId,
  teacherMaterialDownloadHref,
  type TeacherMaterialItem,
} from "@/lib/teacher-materials-api";
import { mediaRegistryStreamUrl } from "@/lib/media-platform/registry-ref";
import { useWordDocxPreviewHtml } from "../_lib/word-docx-preview.hooks";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: TeacherMaterialItem | null;
  actor: ApiActor;
};

function isDocxFileName(item: TeacherMaterialItem): boolean {
  const n = (item.originalFilename ?? item.title ?? "").toLowerCase();
  return n === "" || n.endsWith(".docx");
}

export function TeacherMaterialDocumentPreviewDialog(props: Props) {
  const m = props.material;
  const docx = Boolean(m && m.kind === "word" && isDocxFileName(m));
  const { html, loading, error } = useWordDocxPreviewHtml(docx ? m : null, props.open && docx);
  const title = m?.title?.trim() || "文档预览";

  const streamId = m ? resolvedTeacherMaterialDataFileId(m) : null;
  const viewPath = streamId ? mediaRegistryStreamUrl(streamId, "view", props.actor) : "";

  const headerDescription = (() => {
    if (!m) return "";
    if (m.kind === "pdf") return "浏览器内嵌预览（经同源代理获取可读地址）。";
    if (m.kind === "word" && docx) return "使用浏览器端将 docx 转为 HTML 预览，不经过在线编辑服务。";
    if (m.kind === "word") return "当前预览仅支持 docx；旧版 .doc 请下载后本地查看。";
    if (m.kind === "ppt" || m.kind === "spreadsheet") {
      return "PPT / Excel 以内联流方式在下方区域打开（与 PDF 同源代理）；若浏览器仍提示下载，可使用「下载到本地」。";
    }
    return "";
  })();

  const body: ReactNode = (() => {
    if (!m) return null;
    if (m.kind === "pdf") {
      if (!viewPath) {
        return <p className="text-sm text-muted-foreground">缺少可预览的文件登记信息。</p>;
      }
      return <iframe title="PDF 预览" src={viewPath} className="min-h-[70vh] w-full rounded border border-border" />;
    }
    if (m.kind === "word") {
      if (docx) {
        if (loading) return <p className="text-sm text-muted-foreground">正在生成预览…</p>;
        if (error) return <p className="text-sm text-destructive">{error}</p>;
        return (
          <div
            className="word-docx-preview text-foreground [&_img]:max-w-full [&_p]:mb-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:p-1 [&_th]:border [&_th]:border-border [&_th]:p-1"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }
      return <p className="text-sm text-muted-foreground">当前预览仅支持 docx 格式，旧版 doc 请下载后本地查看。</p>;
    }
    if (m.kind === "ppt" || m.kind === "spreadsheet") {
      if (!viewPath) {
        return <p className="text-sm text-muted-foreground">缺少可预览的文件登记信息。</p>;
      }
      const downloadHref = teacherMaterialDownloadHref(m, props.actor);
      return (
        <div className="flex flex-col gap-3">
          <iframe title="文档预览" src={viewPath} className="min-h-[70vh] w-full rounded border border-border" />
          {downloadHref ? (
            <div>
              <Button type="button" variant="outline" asChild>
                <a href={downloadHref} rel="noopener noreferrer">
                  下载到本地
                </a>
              </Button>
            </div>
          ) : null}
        </div>
      );
    }
    return <p className="text-sm text-muted-foreground">不支持预览该类型。</p>;
  })();

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-[calc(100%-2rem)] flex-col gap-0 p-0 sm:max-w-[calc(100%-2rem)] md:max-w-[66.666vw]">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="line-clamp-1 pr-8">{title}</DialogTitle>
          {headerDescription ? <DialogDescription className="text-left">{headerDescription}</DialogDescription> : null}
        </DialogHeader>
        <div className="min-h-[200px] flex-1 overflow-auto px-6 py-4">{body}</div>
        <DialogFooter className="border-t border-border px-6 py-3">
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
