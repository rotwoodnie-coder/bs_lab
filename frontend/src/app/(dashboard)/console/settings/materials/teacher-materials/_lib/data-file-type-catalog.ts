/**
 * 控制台「实验材料分类」：`data_file_type` 只读目录（与 GET `/v2/dict/file-types` 契约一致）。
 */
export type DataFileTypeCatalogRow = {
  typeId: string;
  typeName: string;
  comments: string | null;
  status: string | null;
  sortOrder: number | null;
  logoClass: string | null;
};

function pickSortOrder(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function normalizeDataFileTypeCatalogRows(raw: unknown): DataFileTypeCatalogRow[] {
  if (!Array.isArray(raw)) return [];
  const out: DataFileTypeCatalogRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const typeId = typeof o.id === "string" ? o.id.trim() : "";
    const typeName = typeof o.name === "string" ? o.name.trim() : "";
    if (!typeId || !typeName) continue;
    const comments =
      o.comments == null || o.comments === ""
        ? null
        : String(o.comments).trim() || null;
    const statusRaw = o.status;
    const status =
      statusRaw == null || statusRaw === ""
        ? null
        : typeof statusRaw === "string"
          ? statusRaw.trim().toLowerCase() || null
          : String(statusRaw).trim().toLowerCase() || null;
    const logoRaw = o.logoClass;
    const logoClass =
      logoRaw == null || logoRaw === ""
        ? null
        : typeof logoRaw === "string"
          ? logoRaw.trim() || null
          : String(logoRaw).trim() || null;
    out.push({
      typeId,
      typeName,
      comments,
      status,
      sortOrder: pickSortOrder(o.sortOrder),
      logoClass,
    });
  }
  return out;
}

export function dataFileTypeStatusLabel(status: string | null | undefined): string {
  const v = (status ?? "").trim().toLowerCase();
  if (v === "y" || v === "") return "启用";
  if (v === "n") return "停用";
  return status?.trim() ? status.trim() : "—";
}
