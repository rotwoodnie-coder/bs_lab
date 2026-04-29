export type ResourceKind = "video" | "pdf" | "package";

export type ResourceItem = {
  id: string;
  title: string;
  kind: ResourceKind;
  stage: string;
  subject: string;
  fileBadge?: string;
  downloads?: number;
  views?: number;
  /** 仅 UI 预览占位用 */
  pdfPageCount?: number;
  coverClassName?: string;
};

