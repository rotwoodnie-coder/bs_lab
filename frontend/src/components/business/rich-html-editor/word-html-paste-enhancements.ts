/**
 * TipTap 粘贴增强：编号列表识别、加粗标题提升、样式收敛、DOMPurify 白名单。
 * 仅在浏览器环境执行 DOMPurify。
 */
import DOMPurify from "dompurify";
import type { Config } from "dompurify";

const PURIFY_CONFIG: Config = {
  ALLOWED_TAGS: [
    "a",
    "b",
    "blockquote",
    "br",
    "code",
    "div",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "i",
    "img",
    "li",
    "ol",
    "p",
    "pre",
    "s",
    "span",
    "strong",
    "sub",
    "sup",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "u",
    "ul",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "title", "class", "colspan", "rowspan"],
  ALLOW_DATA_ATTR: false,
};

const NUMBERED_LINE = /^(\d{1,2})[.、．）)]\s*(.*)$/s;

function stripLeadingNumberFromParagraphHtml(html: string): string {
  return html
    .trim()
    .replace(/^\s*(?:&nbsp;\s*)*(?:<span[^>]*>)?\s*(?:&nbsp;\s*)*\d{1,2}[.、．）]\s*(?:<\/span>)?\s*/i, "")
    .trim();
}

/**
 * 将紧邻的 `1.` `2.` … 顶层段落合并为 `<ol><li>…</li></ol>`（至少 2 项）。
 */
export function promoteNumberedParagraphsToOrderedLists(root: HTMLElement): void {
  const doc = root.ownerDocument;
  if (!doc) return;

  const scan = (): boolean => {
    const topPs = Array.from(root.querySelectorAll(":scope > p")) as HTMLParagraphElement[];
    for (let i = 0; i < topPs.length; i++) {
      const p = topPs[i]!;
      if (!p.parentNode) continue;
      const t0 = (p.textContent ?? "").replace(/\u00a0/g, " ").trim();
      const m0 = t0.match(NUMBERED_LINE);
      if (!m0) continue;

      const seq: HTMLParagraphElement[] = [];
      let expected = parseInt(m0[1]!, 10);
      seq.push(p);
      let k = i + 1;
      while (k < topPs.length) {
        const p2 = topPs[k]!;
        if (!p2.parentNode) break;
        const t = (p2.textContent ?? "").replace(/\u00a0/g, " ").trim();
        const m = t.match(NUMBERED_LINE);
        if (!m) break;
        const n = parseInt(m[1]!, 10);
        if (n !== expected + 1) break;
        seq.push(p2);
        expected = n;
        k++;
      }
      if (seq.length < 2) continue;

      const parent = seq[0]!.parentNode!;
      const ref = seq[0]!;
      const ol = doc.createElement("ol");
      for (const para of seq) {
        const li = doc.createElement("li");
        li.innerHTML = stripLeadingNumberFromParagraphHtml(para.innerHTML);
        ol.appendChild(li);
      }
      parent.insertBefore(ol, ref);
      for (const para of seq) {
        para.remove();
      }
      return true;
    }
    return false;
  };

  let guard = 0;
  while (guard < 20 && scan()) {
    guard += 1;
  }
}

function isBoldOnlyParagraph(p: HTMLParagraphElement, maxLen: number): boolean {
  const t = (p.textContent ?? "").replace(/\u00a0/g, " ").trim();
  if (!t || t.length > maxLen) return false;
  if (/^\d{1,2}[.、．）)]/.test(t)) return false;
  const inner = p.innerHTML.trim().replace(/&nbsp;/gi, " ");
  if (/^<strong[^>]*>[\s\S]+<\/strong>$/i.test(inner)) return true;
  if (/^<b[^>]*>[\s\S]+<\/b>$/i.test(inner)) return true;
  if (/^<span[^>]*>\s*<strong[^>]*>[\s\S]+<\/strong>\s*<\/span>$/i.test(inner)) return true;
  if (/^<span[^>]*>\s*<b[^>]*>[\s\S]+<\/b>\s*<\/span>$/i.test(inner)) return true;
  if (/^<strong[^>]*>\s*<span[^>]*>[\s\S]+<\/span>\s*<\/strong>$/i.test(inner)) return true;
  if (/^<span[^>]*>\s*<strong[^>]*>[\s\S]+<\/strong>\s*<\/span>$/i.test(inner)) return true;
  return false;
}

/**
 * 将「整段仅加粗/粗体」且较短的顶层段落提升为标题（常见于 Word 无 Mso 类时）。
 */
export function promoteBoldOnlyParagraphsToHeadings(root: HTMLElement, maxLen = 96): void {
  const doc = root.ownerDocument;
  if (!doc) return;
  let promoted = 0;
  const ps = Array.from(root.querySelectorAll(":scope > p")) as HTMLParagraphElement[];
  for (const p of ps) {
    if (!p.parentNode || promoted >= 6) break;
    if (!isBoldOnlyParagraph(p, maxLen)) continue;
    const tag = promoted === 0 ? "h2" : "h3";
    const h = doc.createElement(tag);
    h.innerHTML = p.innerHTML;
    p.parentNode.replaceChild(h, p);
    promoted += 1;
  }
}

/** 仅保留与系统排版相关的内联样式（对齐、字重），去掉 Word 字体色与字号。 */
export function stripNonPresetInlineStyles(root: HTMLElement): void {
  root.querySelectorAll("[style]").forEach((el) => {
    const st = el.getAttribute("style") ?? "";
    const parts = st
      .split(";")
      .map((x) => x.trim())
      .filter(Boolean);
    const kept = parts.filter((p) => {
      const key = p.split(":")[0]?.trim().toLowerCase() ?? "";
      return key === "text-align" || key === "font-weight";
    });
    if (kept.length === 0) el.removeAttribute("style");
    else el.setAttribute("style", kept.join("; "));
  });
}

export function purifyPastedHtmlFragment(html: string): string {
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html, PURIFY_CONFIG);
}
