export function sanitizeAndNormalizeRichText(raw: unknown, maxLen: number): string | null {
  if (raw === undefined || raw === null) return null;
  const text = String(raw)
    .replace(/\r\n/g, "\n")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/on\w+=(['\"]).*?\1/gi, "")
    .trim();
  if (!text) return null;
  if (text.length > maxLen) throw new Error("CONTENT_TOO_LONG");
  return text;
}
