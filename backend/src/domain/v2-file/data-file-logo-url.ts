/**
 * `data_file.logo_url` 是否已有可展示封面（与前端 `parseDataFileLogoMeta` 语义对齐，避免前后端一条认、一条不认）。
 */
export function dataFileRenderableLogoUrl(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  if (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/")) return t;
  return null;
}

export function dataFileHasRenderableLogoUrl(raw: string | null | undefined): boolean {
  return dataFileRenderableLogoUrl(raw) != null;
}
