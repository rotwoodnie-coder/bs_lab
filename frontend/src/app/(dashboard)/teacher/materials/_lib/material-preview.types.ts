export type MaterialPreviewKind = "image" | "video" | "pdf" | "office" | "none";

export type MaterialPreviewStatus = "ready" | "processing" | "failed";

export type MaterialPreviewPayload = {
  kind: MaterialPreviewKind;
  status: MaterialPreviewStatus;
  previewUrl?: string;
  sourceUrl?: string;
  note?: string;
};

