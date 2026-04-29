/**
 * Word / Office 剪贴板 HTML：清洗 mso- 垃圾、保留尽量多的合法排版样式；
 * 处理 CF_HTML 片段、file:// 等浏览器无法加载的图片引用。
 */
import { uploadBlobWithContentDedup } from "@/lib/media/paste-image-upload-dedup";
import {
  promoteBoldOnlyParagraphsToHeadings,
  promoteNumberedParagraphsToOrderedLists,
  purifyPastedHtmlFragment,
  stripNonPresetInlineStyles,
} from "./word-html-paste-enhancements";

export { purifyPastedHtmlFragment };

export type SanitizeWordPasteHtmlOptions = {
  /** 为 true 时跳过末尾 DOMPurify，便于先替换 data URL 再净化。 */
  skipFinalPurify?: boolean;
};

export function stripOfficeConditionalComments(html: string): string {
  return html.replace(/<!--\[if[^\]]*]>[\s\S]*?<!\[endif]-->/gi, "");
}

export function stripVmlAndOfficeTags(html: string): string {
  return html.replace(/<\/?(?:v|o):[^>]*>/gi, "");
}

/** Word 常用空占位 `<o:p></o:p>`，会撑出空白行。 */
export function stripOfficeEmptyParagraphMarkers(html: string): string {
  return html.replace(/<o:p>\s*<\/o:p>/gi, "");
}

/**
 * 判断是否为 Word / WPS / Office 系剪贴板 HTML（需走完整清洗管线，勿交给浏览器默认粘贴）。
 */
export function isLikelyOfficeClipboardHtml(html: string): boolean {
  if (!html || html.length < 24) return false;
  return (
    /xmlns:w\s*=|urn:schemas-microsoft-com:office:word|Word\.Document|<w:WordDocument|application\/vnd\.openxmlformats-officedocument/i.test(
      html,
    ) ||
    /\bmso-/i.test(html) ||
    /\bMso(?:Normal|Title|Heading\d|ListParagraph|BodyText)\b/.test(html) ||
    /Kingsoft|W\.P\.S\.|wps-office/i.test(html)
  );
}

/** Microsoft CF_HTML：优先取 StartFragment / EndFragment 之间内容，减少整页噪声。 */
export function extractClipboardFragmentHtml(html: string): string {
  const start = html.indexOf("<!--StartFragment-->");
  const end = html.indexOf("<!--EndFragment-->");
  if (start !== -1 && end !== -1 && end > start) {
    return html.slice(start + "<!--StartFragment-->".length, end).trim();
  }
  return html.trim();
}

/** 从完整 HTML 文档中取出 body 内部。 */
export function extractBodyInnerHtml(fragment: string): string {
  const lower = fragment.toLowerCase();
  if (!lower.includes("<body")) return fragment.trim();
  const m = fragment.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return (m ? m[1] : fragment).trim();
}

/** 剪贴板 HTML 规范化：片段 → body 内部。 */
export function normalizeClipboardHtml(html: string): string {
  return extractBodyInnerHtml(extractClipboardFragmentHtml(html));
}

/**
 * 从 style 中逐条删除 mso-/Office 专用声明，保留 text-align、font-weight 等对排版有用的部分。
 */
export function stripMsoFromStyleValue(value: string): string | null {
  const parts = value
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean);
  const kept = parts.filter((p) => {
    const prop = p.split(":")[0]?.trim().toLowerCase() ?? "";
    if (prop.includes("mso")) return false;
    if (/^tab-stops:/i.test(p)) return false;
    if (/^margin-top:\s*\d+(\.\d+)?(in|cm|mm|pt)\s*$/i.test(p)) return false;
    if (/^margin-bottom:\s*\d+(\.\d+)?(in|cm|mm|pt)\s*$/i.test(p)) return false;
    if (/^margin-left:\s*\d+(\.\d+)?(in|cm|mm|pt)\s*$/i.test(p)) return false;
    if (/^text-indent:\s*-\d/i.test(p)) return false;
    if (/^page-break-before:\s*always$/i.test(p)) return false;
    if (/^line-height:\s*normal$/i.test(p) && /mso/i.test(value)) return false;
    return true;
  });
  if (kept.length === 0) return null;
  return kept.join("; ");
}

/** 仅保留可在页面中稳定展示的图片地址（http(s)、站内路径、data:image）。 */
export function isLikelyRenderableImgSrc(src: string): boolean {
  const s = src.trim();
  if (!s) return false;
  if (s.startsWith("data:image/")) return true;
  if (/^https?:\/\//i.test(s)) return true;
  if (s.startsWith("/") && !s.startsWith("//")) return true;
  return false;
}

/**
 * 移除无法展示的图片：空 src、file://、blob:、cid:、以及其它非 http/data 的地址（避免破图占位条）。
 */
export function stripUnsupportedImageSources(root: HTMLElement): number {
  let removed = 0;
  root.querySelectorAll("img").forEach((img) => {
    const src = (img.getAttribute("src") ?? "").trim();
    const w = (img.getAttribute("width") ?? "").trim();
    const h = (img.getAttribute("height") ?? "").trim();
    const st = (img.getAttribute("style") ?? "").toLowerCase();
    if (/\bvisibility:\s*hidden\b/.test(st) || /\bdisplay:\s*none\b/.test(st)) {
      img.remove();
      removed += 1;
      return;
    }
    if ((w === "0" || w === "1") && (h === "0" || h === "1")) {
      img.remove();
      removed += 1;
      return;
    }
    if (!isLikelyRenderableImgSrc(src)) {
      img.remove();
      removed += 1;
    }
  });
  return removed;
}

/**
 * Word 用段落 + Mso* class 表示标题，去掉 class 后会丢层级。在清洗前提升为语义标题。
 */
export function promoteWordHeadingParagraphs(root: HTMLElement): void {
  const doc = root.ownerDocument;
  if (!doc) return;
  const paragraphs = Array.from(root.querySelectorAll("p"));
  for (const p of paragraphs) {
    if (!p.parentNode) continue;
    const cls = p.getAttribute("class") ?? "";
    let tag: "h1" | "h2" | "h3" | null = null;
    if (/\bMsoTitle\b/i.test(cls)) tag = "h1";
    else if (/\bMsoSubtitle\b/i.test(cls)) tag = "h2";
    else if (/\bMsoHeading1\b/i.test(cls)) tag = "h2";
    else if (/\bMsoHeading2\b/i.test(cls)) tag = "h3";
    else if (/\bMsoHeading3\b/i.test(cls) || /\bMsoHeading4\b/i.test(cls)) tag = "h3";
    if (!tag) continue;
    const h = doc.createElement(tag);
    h.innerHTML = p.innerHTML;
    p.parentNode.replaceChild(h, p);
  }
}

/**
 * Word 常在 p 上写 12pt、18pt 等 margin，粘贴后出现「巨大空档」。去掉块级 margin/line-height，交给编辑器 CSS 控制间距。
 */
export function normalizeWordBlockSpacing(root: HTMLElement): void {
  const selectors = ["p", "h1", "h2", "h3", "h4", "li", "span"];
  for (const sel of selectors) {
    root.querySelectorAll(sel).forEach((el) => {
      const st = el.getAttribute("style");
      if (!st) return;
      const parts = st
        .split(";")
        .map((x) => x.trim())
        .filter(Boolean);
      const kept = parts.filter((p) => {
        if (/^mso-/i.test(p)) return false;
        if (/^margin-(top|bottom|left|right):/i.test(p)) return false;
        if (/^padding-(top|bottom|left|right):/i.test(p)) return false;
        if (/^line-height:/i.test(p)) return false;
        if (/^text-indent:\s*-\d/i.test(p)) return false;
        if (/^tab-stops:/i.test(p)) return false;
        return true;
      });
      if (kept.length === 0) el.removeAttribute("style");
      else el.setAttribute("style", kept.join("; "));
    });
  }
}

/** 折叠仅含空白 / &nbsp; / 单个 br 的段落与标题，消除 Word 巨大「空行」。 */
export function collapseEmptyWordBlocks(root: HTMLElement): void {
  const isEmptyish = (el: Element): boolean => {
    const raw = el.innerHTML
      .replace(/&nbsp;/gi, " ")
      .replace(/<br\s*\/?>/gi, "")
      .replace(/\s+/g, "")
      .trim();
    if (raw.length > 0) return false;
    const t = (el.textContent ?? "").replace(/\u00a0/g, " ").trim();
    return t.length === 0;
  };

  let guard = 0;
  while (guard < 80) {
    guard += 1;
    let removed = 0;
    root.querySelectorAll("p, h1, h2, h3, h4").forEach((el) => {
      if (!el.parentNode) return;
      if (!isEmptyish(el)) return;
      el.parentNode.removeChild(el);
      removed += 1;
    });
    if (removed === 0) break;
  }
}

/**
 * Word HTML：去掉条件注释与 VML 包装后，清洗属性；尽量保留段落/对齐等样式。
 */
export function sanitizeWordPasteHtml(raw: string, options?: SanitizeWordPasteHtmlOptions): string {
  let s = stripOfficeEmptyParagraphMarkers(stripOfficeConditionalComments(stripVmlAndOfficeTags(raw)));
  try {
    const doc = new DOMParser().parseFromString(s, "text/html");
    const root = doc.body;
    stripUnsupportedImageSources(root);
    promoteWordHeadingParagraphs(root);
    promoteNumberedParagraphsToOrderedLists(root);
    promoteBoldOnlyParagraphsToHeadings(root);
    normalizeWordBlockSpacing(root);
    root.querySelectorAll("*").forEach((el) => {
      [...el.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        const val = attr.value;
        if (name.startsWith("xmlns")) el.removeAttribute(attr.name);
        if (name.startsWith("o:") || name.startsWith("v:")) el.removeAttribute(attr.name);
        if (name === "style") {
          const next = stripMsoFromStyleValue(val);
          if (next == null) el.removeAttribute("style");
          else el.setAttribute("style", next);
        }
        if (name === "class" && /\bMso\w*/i.test(val)) {
          const rest = val
            .split(/\s+/)
            .map((c) => c.trim())
            .filter((c) => c && !/^Mso\w*$/i.test(c));
          if (rest.length) el.setAttribute("class", rest.join(" "));
          else el.removeAttribute("class");
        }
        if (name === "lang") el.removeAttribute(attr.name);
      });
    });
    stripNonPresetInlineStyles(root);
    collapseEmptyWordBlocks(root);
    if (!(root.textContent ?? "").trim() && root.children.length === 0) {
      const empty = "<p></p>";
      return options?.skipFinalPurify ? empty : purifyPastedHtmlFragment(empty);
    }
    const htmlOut = root.innerHTML;
    return options?.skipFinalPurify ? htmlOut : purifyPastedHtmlFragment(htmlOut);
  } catch {
    if (options?.skipFinalPurify) return s;
    return typeof window !== "undefined" ? purifyPastedHtmlFragment(s) : s;
  }
}

const DATA_IMG_SRC_RE = /src\s*=\s*["'](data:image\/(?:png|jpeg|jpg|gif|webp);base64,[^"']+)["']/gi;

export function htmlContainsDataUrlImage(html: string): boolean {
  return /src\s*=\s*["']data:image\/(?:png|jpeg|jpg|gif|webp);base64,/i.test(html);
}

/**
 * 从剪贴板收集图片文件：遍历 `items` / `files`。
 * 微信等截图常出现 `DataTransferItem.type` 为空但 `getAsFile()` 为有效位图，故对 `kind === "file"` 一律尝试 `getAsFile()`，再以 File 的 MIME 或空类型判定。
 */
export function collectClipboardImageFiles(dt: DataTransfer | null): File[] {
  if (!dt) return [];
  const seen = new Set<string>();
  const out: File[] = [];
  const add = (f: File | null) => {
    if (!f || f.size <= 0) return;
    const mime = (f.type || "").trim().toLowerCase();
    const looksImage =
      mime.startsWith("image/") || mime === "" || mime === "application/octet-stream";
    if (!looksImage) return;
    const k = `${f.name}-${f.size}-${f.lastModified}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(f);
  };
  for (const item of Array.from(dt.items ?? [])) {
    if (item.kind === "file") add(item.getAsFile());
  }
  for (const f of Array.from(dt.files ?? [])) {
    add(f);
  }
  return out;
}

/**
 * 将 HTML 片段中的 data:image base64 替换为 GMS 返回的可访问 URL（顺序上传）。
 */
export async function replaceDataUrlImagesInHtml(
  html: string,
  upload: (blob: Blob, fileName: string) => Promise<string | null>,
): Promise<string> {
  const matches = [...html.matchAll(DATA_IMG_SRC_RE)];
  if (matches.length === 0) return html;
  let out = html;
  let i = 0;
  for (const m of matches) {
    const dataUrl = m[1];
    if (!dataUrl) continue;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const ext = blob.type.includes("png")
        ? "png"
        : blob.type.includes("webp")
          ? "webp"
          : blob.type.includes("gif")
            ? "gif"
            : "jpg";
      const url = await uploadBlobWithContentDedup(blob, () => upload(blob, `paste-${Date.now()}-${i}.${ext}`));
      i += 1;
      if (url) {
        out = out.split(dataUrl).join(url);
      }
    } catch {
      /* 单张失败则保留 data URL */
    }
  }
  return out;
}

export function plainTextFromHtml(html: string): string {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
  } catch {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
}

export function firstImageSrcFromHtml(html: string): string {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1]?.trim() ?? "";
}
