import {
  inferKindFromFileNameOrUrlHints,
  resolvedTeacherMaterialDataFileId,
  type TeacherMaterialItem,
} from "@/lib/teacher-materials-api";
import { materialStorageBrowserHref } from "@/lib/material-asset-url";
import { mediaRegistryStreamUrl } from "@/lib/media-platform/registry-ref";
import { MATERIAL_PREVIEW_MOCK_MAP } from "./material-preview.mock";
import type { MaterialPreviewPayload } from "./material-preview.types";

const FALLBACK_PREVIEW_URL = "/illustrations/media-missing.svg";

/**
 * 可作为 `<img src>` 且无需 Cookie 的地址。
 * 后端现已下发预签名 URL（完整 http(s) 带 ?X-Amz-Signature），
 * 可直接作为 `<img src>`；外部资源 URL 同样可直接嵌入。
 */
export function isEmbeddableWithoutCookie(href: string): boolean {
  const t = href.trim();
  if (!t) return false;
  if (t.includes("/api/media/registry-stream")) return true;
  if (t.startsWith("http://") || t.startsWith("https://")) return true;
  if (t.startsWith("/") && !t.startsWith("//")) return true;
  return false;
}

/** 后端已预签名，直接返回原值，供后缀推断。 */
function storageUrlFromBrowserHref(href: string): string | null {
  const t = href.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return null;
}

function defaultPreviewByKind(kind: TeacherMaterialItem["kind"]): MaterialPreviewPayload {
  if (kind === "image") return { kind: "image", status: "ready", previewUrl: FALLBACK_PREVIEW_URL };
  if (kind === "video") return { kind: "video", status: "failed", previewUrl: FALLBACK_PREVIEW_URL };
  if (kind === "pdf") return { kind: "pdf", status: "ready" };
  if (kind === "word" || kind === "ppt" || kind === "spreadsheet") return { kind: "office", status: "processing" };
  return { kind: "none", status: "failed" };
}

export function kindLabel(kind: TeacherMaterialItem["kind"]) {
  switch (kind) {
    case "word":
      return "word";
    case "ppt":
      return "ppt";
    case "pdf":
      return "pdf";
    case "image":
      return "图片";
    case "video":
      return "视频";
    case "spreadsheet":
      return "excel";
    default:
      return kind;
  }
}

/** 分享文案等场景使用的中文类型名 */
export function materialKindLabelZh(kind: TeacherMaterialItem["kind"]): string {
  switch (kind) {
    case "word":
      return "Word 文档";
    case "ppt":
      return "PPT 文稿";
    case "pdf":
      return "PDF";
    case "image":
      return "图片";
    case "video":
      return "视频";
    case "spreadsheet":
      return "表格";
    default:
      return kind;
  }
}

/** Word（含 doc 提示）/ PDF / PPT / Excel：有登记 id 或可归一化直链时可打开预览入口 */
export function canPreviewTeacherMaterialDocument(item: TeacherMaterialItem): boolean {
  const id = resolvedTeacherMaterialDataFileId(item);
  if (id) {
    if (item.kind === "word" || item.kind === "pdf" || item.kind === "ppt" || item.kind === "spreadsheet") return true;
    return false;
  }
  const d = item.directFileUrl?.trim() ?? "";
  if (!d || item.kind !== "pdf") return false;
  return d.startsWith("/") || d.startsWith("http://") || d.startsWith("https://");
}

const MISSING_MEDIA_NOTE =
  "「类型」来自推断，但库中未绑定可预览地址（data_file.file_url / logo_url 或登记 id）。请上传或绑定后再预览。";

export function getMaterialPreviewPayload(material: TeacherMaterialItem): MaterialPreviewPayload {
  const direct = material.directFileUrl?.trim() ?? "";
  if (direct && (direct.startsWith("http://") || direct.startsWith("https://") || direct.startsWith("/"))) {
    const rawForHint = storageUrlFromBrowserHref(direct);
    const hinted = inferKindFromFileNameOrUrlHints(material.originalFilename, rawForHint);
    const effectiveKind = hinted ?? material.kind;
    const base = defaultPreviewByKind(effectiveKind);
    const browserDirect = direct.startsWith("/") ? direct : materialStorageBrowserHref(direct);
    const rid = resolvedTeacherMaterialDataFileId(material);
    /** 有登记 id 时播放/大图走预签名代理，避免直连不可匿名读的 MinIO */
    const playableUrl = rid ? mediaRegistryStreamUrl(rid, "view") : browserDirect;
    const thumbRaw = material.materialMainPicUrl?.trim() ?? "";
    const thumbBrowser =
      thumbRaw && (thumbRaw.startsWith("http://") || thumbRaw.startsWith("https://") || thumbRaw.startsWith("/"))
        ? thumbRaw.startsWith("/")
          ? thumbRaw
          : materialStorageBrowserHref(thumbRaw)
        : "";
    if (effectiveKind === "video") {
      /** 优先使用已登记的封面（logoUrl）；否则用代理 URL 附加 &thumbnail=true 请求实时截帧 */
      const poster =
        thumbBrowser && isEmbeddableWithoutCookie(thumbBrowser)
          ? thumbBrowser
          : playableUrl.includes("?")
            ? `${playableUrl}&thumbnail=true`
            : `${playableUrl}?thumbnail=true`;
      return {
        ...base,
        kind: "video",
        status: "ready",
        previewUrl: poster,
        sourceUrl: playableUrl,
      };
    }
    if (effectiveKind === "image") {
      const listThumb =
        rid && thumbBrowser && isEmbeddableWithoutCookie(thumbBrowser)
          ? thumbBrowser
          : rid
            ? playableUrl
            : thumbBrowser || browserDirect;
      return {
        ...base,
        kind: "image",
        status: "ready",
        /** 列表缩略：可嵌入的 logo，否则走预签名代理（与 `sourceUrl` 一致） */
        previewUrl: listThumb,
        sourceUrl: playableUrl,
      };
    }
    return {
      ...base,
      previewUrl: base.previewUrl || FALLBACK_PREVIEW_URL,
      sourceUrl: playableUrl,
    };
  }

  const rid = resolvedTeacherMaterialDataFileId(material);
  if (rid && (material.kind === "image" || material.kind === "video" || material.kind === "audio")) {
    const streamKind = material.kind === "image" ? "image" : "video";
    const streamView = mediaRegistryStreamUrl(rid, "view");
    if (streamKind === "video") {
      const thumbRaw = material.materialMainPicUrl?.trim() ?? "";
      const thumbBrowser =
        thumbRaw && (thumbRaw.startsWith("http://") || thumbRaw.startsWith("https://") || thumbRaw.startsWith("/"))
          ? thumbRaw.startsWith("/")
            ? thumbRaw
            : materialStorageBrowserHref(thumbRaw)
          : "";
      const poster =
        thumbBrowser && isEmbeddableWithoutCookie(thumbBrowser) ? thumbBrowser : "";
      return {
        kind: "video",
        status: "ready",
        previewUrl: poster,
        sourceUrl: streamView,
      };
    }
    return {
      kind: "image",
      status: "ready",
      previewUrl: streamView,
      sourceUrl: streamView,
    };
  }

  if (material.kind === "image" || material.kind === "video" || material.kind === "audio") {
    return {
      kind: material.kind === "image" ? "image" : "video",
      status: "failed",
      previewUrl: FALLBACK_PREVIEW_URL,
      note: MISSING_MEDIA_NOTE,
    };
  }

  const raw = MATERIAL_PREVIEW_MOCK_MAP[material.materialId] ?? defaultPreviewByKind(material.kind);
  return {
    ...raw,
    previewUrl: raw.previewUrl || FALLBACK_PREVIEW_URL,
  };
}

