/** 基线 `data_coursebook.comments` / 章节 `comments` 内 JSON；子键与持久化结构一致，使用 snake_case（与 DDL 列名风格一致）。 */

export const COURSEBOOK_REF_KEY = "_ref" as const;

/** 写入 `comments` → `_ref` 的对象形态（非表顶层列）。 */
export type CoursebookRefMeta = {
  subject_id: string;
  grade_id?: string | null;
  sort_order?: number;
  cover_registry_id?: number | null;
};

const CH_SIDE = "_ch" as const;

/** 写入 `comments` → `_ch` 的对象形态。 */
export type ChapterSideMeta = {
  description?: string | null;
  image_registry_id?: number | null;
  row_version?: number;
};

function readStr(r: Record<string, unknown>, snake: string, camel: string): string {
  const a = r[snake];
  const b = r[camel];
  const v = (typeof a === "string" ? a : typeof b === "string" ? b : "") as string;
  return v.trim();
}

export function parseCoursebookRef(comments: unknown): CoursebookRefMeta | null {
  if (comments == null || comments === "") return null;
  try {
    const o = JSON.parse(String(comments)) as Record<string, unknown>;
    const ref = o[COURSEBOOK_REF_KEY];
    if (!ref || typeof ref !== "object") return null;
    const r = ref as Record<string, unknown>;
    const subject_id = readStr(r, "subject_id", "subjectId");
    if (!subject_id) return null;
    const gradeRaw = r.grade_id ?? r.gradeId;
    const grade_id =
      gradeRaw == null || gradeRaw === "" ? null : typeof gradeRaw === "string" ? gradeRaw : String(gradeRaw);
    const soRaw = r.sort_order ?? r.sortOrder;
    const sort_order =
      typeof soRaw === "number" && Number.isFinite(soRaw) ? soRaw : typeof soRaw === "string" && soRaw.trim() !== "" ? Number(soRaw) : 0;
    let cover_registry_id: number | null = null;
    const cr = r.cover_registry_id ?? r.coverRegistryId;
    if (typeof cr === "number" && Number.isFinite(cr)) cover_registry_id = cr;
    return { subject_id, grade_id, sort_order: Number.isFinite(sort_order) ? sort_order : 0, cover_registry_id };
  } catch {
    return null;
  }
}

export function buildCoursebookComments(ref: CoursebookRefMeta): string {
  return JSON.stringify({
    [COURSEBOOK_REF_KEY]: {
      subject_id: ref.subject_id,
      grade_id: ref.grade_id ?? null,
      sort_order: ref.sort_order ?? 0,
      cover_registry_id: ref.cover_registry_id ?? null,
    },
  });
}

export function mergeCoursebookRef(existingComments: string | null, patch: Partial<CoursebookRefMeta>): string {
  const cur = parseCoursebookRef(existingComments);
  const sid = typeof patch.subject_id === "string" ? patch.subject_id.trim() : "";
  if (!cur && !sid) throw new Error("mergeCoursebookRef: 缺少已有 _ref 或 patch.subject_id");
  const base: CoursebookRefMeta =
    cur ??
    ({
      subject_id: sid,
      grade_id: null,
      sort_order: 0,
      cover_registry_id: null,
    } as CoursebookRefMeta);
  const next: CoursebookRefMeta = {
    subject_id: patch.subject_id ?? base.subject_id,
    grade_id: patch.grade_id !== undefined ? patch.grade_id : base.grade_id,
    sort_order: patch.sort_order !== undefined ? patch.sort_order : base.sort_order ?? 0,
    cover_registry_id:
      patch.cover_registry_id !== undefined ? patch.cover_registry_id : base.cover_registry_id ?? null,
  };
  let rest: Record<string, unknown> = {};
  if (existingComments) {
    try {
      const o = JSON.parse(existingComments) as Record<string, unknown>;
      if (o && typeof o === "object") {
        rest = { ...o };
        delete rest[COURSEBOOK_REF_KEY];
      }
    } catch {
      rest = { _legacyPlain: existingComments };
    }
  }
  return JSON.stringify({ ...rest, [COURSEBOOK_REF_KEY]: next });
}

export function statusDbToApi(status: string | null | undefined): 0 | 1 {
  const s = (status ?? "y").trim().toLowerCase();
  return s === "n" ? 0 : 1;
}

export function normalizeCoursebookStatusColumn(v: unknown): "y" | "n" {
  if (v === "y" || v === "n") return v;
  if (v === 0 || v === "0" || v === false) return "n";
  return "y";
}

export function parseChapterSide(comments: unknown): ChapterSideMeta {
  if (comments == null || comments === "") return {};
  try {
    const o = JSON.parse(String(comments)) as Record<string, unknown>;
    const ch = o[CH_SIDE];
    if (!ch || typeof ch !== "object") return {};
    const c = ch as Record<string, unknown>;
    const description = typeof c.description === "string" ? c.description : null;
    const imgRaw = c.image_registry_id ?? c.imageRegistryId;
    const image_registry_id =
      typeof imgRaw === "number" && Number.isFinite(imgRaw) ? imgRaw : typeof imgRaw === "string" && imgRaw.trim() !== "" ? Number(imgRaw) : null;
    const rvRaw = c.row_version ?? c.rowVersion;
    const row_version =
      typeof rvRaw === "number" && Number.isFinite(rvRaw) ? rvRaw : typeof rvRaw === "string" && rvRaw.trim() !== "" ? Number(rvRaw) : 1;
    return {
      description,
      image_registry_id: image_registry_id != null && Number.isFinite(image_registry_id) ? image_registry_id : null,
      row_version: Number.isFinite(row_version) ? row_version : 1,
    };
  } catch {
    return {};
  }
}

export function buildChapterComments(side: ChapterSideMeta): string | null {
  const has =
    (side.description != null && side.description !== "") ||
    (side.image_registry_id != null && side.image_registry_id > 0) ||
    (side.row_version != null && side.row_version > 1);
  if (!has) return null;
  return JSON.stringify({
    [CH_SIDE]: {
      description: side.description ?? null,
      image_registry_id: side.image_registry_id ?? null,
      row_version: side.row_version ?? 1,
    },
  });
}

export function mergeChapterComments(existing: string | null, patch: ChapterSideMeta): string | null {
  const cur = parseChapterSide(existing);
  const next: ChapterSideMeta = {
    description: patch.description !== undefined ? patch.description : cur.description ?? null,
    image_registry_id:
      patch.image_registry_id !== undefined ? patch.image_registry_id : cur.image_registry_id ?? null,
    row_version: patch.row_version !== undefined ? patch.row_version : cur.row_version ?? 1,
  };
  let base: Record<string, unknown> = {};
  if (existing) {
    try {
      const o = JSON.parse(existing) as unknown;
      if (o && typeof o === "object") base = { ...(o as Record<string, unknown>) };
    } catch {
      base = { _legacyPlain: existing };
    }
  }
  const inner = buildChapterComments(next);
  if (!inner) {
    const { [CH_SIDE]: _, ...rest } = base;
    return Object.keys(rest).length ? JSON.stringify(rest) : null;
  }
  return JSON.stringify({ ...base, ...JSON.parse(inner) });
}

export function stringifyCommentsPayload(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object") return JSON.stringify(v);
  return null;
}

export function normalizeChapterStatusColumn(v: unknown): "y" | "n" {
  return normalizeCoursebookStatusColumn(v);
}
