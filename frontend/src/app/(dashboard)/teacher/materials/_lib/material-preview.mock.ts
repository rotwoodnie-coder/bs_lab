import type { MaterialPreviewPayload } from "./material-preview.types";

export const MATERIAL_PREVIEW_MOCK_MAP: Record<string, MaterialPreviewPayload> = {
  m1: {
    kind: "office",
    status: "ready",
    note: "Word 预览由服务端转 PDF 后展示",
  },
  m2: {
    kind: "office",
    status: "ready",
    note: "PPT 预览由服务端转图片后展示",
  },
  m3: {
    kind: "pdf",
    status: "ready",
    note: "PDF 预览可直接渲染",
  },
  m4: {
    kind: "image",
    status: "ready",
    previewUrl: "/illustrations/media-missing.svg",
  },
  m5: {
    kind: "video",
    status: "failed",
    note: "未生成封面，已回退统一占位图",
  },
  m6: {
    kind: "office",
    status: "processing",
    note: "Excel 预览生成中",
  },
};

