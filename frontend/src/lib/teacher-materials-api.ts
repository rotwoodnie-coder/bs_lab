"use client";

import type { ApiActor } from "@/lib/new-core-api";
import { UserRole } from "@/types/auth";
import { mediaRegistryStreamUrl } from "@/lib/media-platform/registry-ref";
import { materialStorageBrowserHref } from "@/lib/material-asset-url";
import {
  deleteV2Material,
  fetchV2MaterialDetail,
  patchV2Material,
  postV2Material,
  type PatchV2MaterialInput,
  type V2MaterialDetail,
  type V2MaterialMsgRow,
} from "@/lib/v2/v2-material-api";
import {
  deleteV2File,
  fetchV2FilesAll,
  fetchV2FilesLookup,
  patchV2FileRecord,
  type V2DataFileRecord,
} from "@/lib/v2/v2-file-api";
import { inferTeacherMaterialKindFromExtension } from "@/lib/media/extension-groups";

import type { FileKind } from "./v2/file-kind-constants";

/** 教师素材 kind — 与后端 `FILE_KIND_MAP` key 100% 同步 */
export type TeacherMaterialKind = FileKind;

/** 教师素材库列表行来源：`data_file` 为素材库文件；`material_msg` 为实验材料表（兼容旧数据） */
export type TeacherMaterialRowSource = "material_msg" | "data_file";

export type TeacherMaterialItem = {
  /**
   * 主键：来自 `material_msg.material_id` 或（`rowSource === "data_file"` 时）`data_file.file_id`。
   */
  materialId: string;
  /** 缺省视为 `material_msg` */
  rowSource?: TeacherMaterialRowSource;
  title: string;
  kind: TeacherMaterialKind;
  experimentId: string | null;
  linkedExperimentTitle: string | null;
  /** `comments.mr` → `data_file.file_id`（可选登记键，与 ma 二选一用于预签名流） */
  dataFileIdMr: string | null;
  /** `comments.ma` → `data_file.file_id`（主文件登记，上传后常见） */
  dataFileIdMa: string | null;
  originalFilename: string | null;
  /** 库内直链（`main_pic_url` 或 `meta.u`）；优先于 `data_file` id 用于预览/下载 */
  directFileUrl?: string | null;
  updatedAt: string;
  /** `material_msg.status`（y/n/t） */
  materialStatus: string | null;
  /** `material_msg.main_pic_url` 列（与合并后的 directFileUrl 可不同） */
  materialMainPicUrl: string | null;
  /** `material_msg.exp_purpose` */
  expPurpose: string | null;
  /** `material_msg.additional_comments` */
  additionalComments: string | null;
  /** `material_msg.material_num` */
  materialNum: number | null;
  /** `data_file.owner_user_id` 或 `material_msg.create_user_id`，用于「仅自己可见」判断 */
  ownerUserId?: string | null;
  /** 仅创建者在全库列表中可见（data_file：`logo_url` JSON 的 `pv`；material_msg：`comments` JSON 的 `pv`） */
  visibilitySelfOnly?: boolean;
  /** 原始 `data_file.logo_url`（可能为 JSON），保存属性时与 `pv` 合并 */
  logoUrlRaw?: string | null;
  /** `data_file.content_sha256`（列表/lookup 带回；空时可在浏览时静默补齐） */
  dataFileContentSha256?: string | null;
  /** `data_file.file_type_id` */
  dataFileTypeId?: string | null;
  /** `data_file.cover_file_id`：封面文件ID */
  coverFileId?: string | null;
  /** 封面文件访问 URL（通过 coverFileId 解析） */
  coverFileUrl?: string | null;
};

/** 与 `comments` 持久化一致：优先 `ma`，否则 `mr`，均为 `data_file.file_id` */
export function resolvedTeacherMaterialDataFileId(item: TeacherMaterialItem): string | null {
  const ma = item.dataFileIdMa?.trim() ?? "";
  const mr = item.dataFileIdMr?.trim() ?? "";
  return ma || mr || null;
}

/** 写入 `material_msg.comments`（≤200）的扩展字段，兼容无 JSON 的历史迁移行 */
type TmMeta = {
  k?: string;
  eid?: string | null;
  lt?: string | null;
  mr?: string | null;
  ma?: string | null;
  of?: string | null;
  /** 直链（短键，避免与列字段重复；长 URL 优先放 main_pic_url） */
  u?: string | null;
  /** 1 表示仅创建者可见（与 data_file.logo_url JSON 的 `pv` 语义对齐） */
  pv?: number;
};

const TM_META_MAX_LEN = 200;

function parseTmMeta(comments: string | null | undefined): TmMeta {
  if (!comments?.trim()) return {};
  try {
    const o = JSON.parse(comments) as Record<string, unknown>;
    if (!o || typeof o !== "object") return {};
    const pvRaw = o.pv;
    const pv =
      pvRaw === true || pvRaw === 1 || pvRaw === "1"
        ? 1
        : typeof pvRaw === "number" && Number.isFinite(pvRaw) && pvRaw !== 0
          ? 1
          : undefined;
    return {
      k: typeof o.k === "string" ? o.k : undefined,
      eid: typeof o.eid === "string" || o.eid === null ? (o.eid as string | null) : undefined,
      lt: typeof o.lt === "string" || o.lt === null ? (o.lt as string | null) : undefined,
      mr: typeof o.mr === "string" || o.mr === null ? (o.mr as string | null) : undefined,
      ma: typeof o.ma === "string" || o.ma === null ? (o.ma as string | null) : undefined,
      of: typeof o.of === "string" || o.of === null ? (o.of as string | null) : undefined,
      u: typeof o.u === "string" || o.u === null ? (o.u as string | null) : undefined,
      pv,
    };
  } catch {
    return {};
  }
}

function isUsableDirectUrl(s: string): boolean {
  const t = s.trim();
  return t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/");
}

/** 解析 `data_file.logo_url`：纯 URL 或 storage key */
function parseDataFileLogoMeta(raw: string | null | undefined): { coverDisplayHref: string | null } {
  const t = (raw ?? "").trim();
  if (!t) return { coverDisplayHref: null };
  // 已经是直链 → 通过同源代理访问
  if (isUsableDirectUrl(t)) {
    return { coverDisplayHref: materialStorageBrowserHref(t) };
  }
  // storage key（非 http，如 v2/user/thumb/uuid.jpg）→ 用同源代理地址
  return { coverDisplayHref: `/api/materials/open?${new URLSearchParams({ u: t }).toString()}` };
}

/** 列表/截帧落库前：与后端 `dataFileRenderableLogoUrl` 展示语义一致的可浏览封面地址 */
export function getDataFileLogoCoverDisplayHref(raw: string | null | undefined): string | null {
  return parseDataFileLogoMeta(raw).coverDisplayHref;
}

/** 更新 `data_file.logo_url`：纯 URL，`undefined` 表示不 PATCH 该列 */
function buildDataFileLogoPatchForUpdate(
  wantSelfOnly: boolean,
  prevRaw: string | null | undefined,
): string | null | undefined {
  if (!wantSelfOnly) return undefined;
  // "仅自己可见"需要保留已有封面 URL 标识，用原始值（不用代理格式）
  const t = (prevRaw ?? "").trim();
  if (!t) return null;
  return t;
}

/** 列表加载后：用 `data_file` 行补全缺失的 `file_url` / `logo_url`（避免库里有封面、列表仍空） */
async function mergeDataFileUrlsFromDataFile(actor: ApiActor, items: TeacherMaterialItem[]): Promise<TeacherMaterialItem[]> {
  const need = new Set<string>();
  for (const it of items) {
    const fid = resolvedTeacherMaterialDataFileId(it);
    if (!fid) continue;
    const d = it.directFileUrl?.trim() ?? "";
    const needUrl = !d || !isUsableDirectUrl(d);
    const pic = it.materialMainPicUrl?.trim() ?? "";
    const needPic = !pic;
    if (needUrl || needPic) need.add(fid);
  }
  if (need.size === 0) return items;
  let files: Awaited<ReturnType<typeof fetchV2FilesLookup>>;
  try {
    files = await fetchV2FilesLookup(actor, [...need]);
  } catch {
    return items;
  }
  const byId = new Map(files.map((f) => [f.fileId, f]));
  return items.map((it) => {
    const fid = resolvedTeacherMaterialDataFileId(it);
    if (!fid) return it;
    const rec = byId.get(fid);
    if (!rec) return it;
    const d0 = it.directFileUrl?.trim() ?? "";
    const needUrl = !d0 || !isUsableDirectUrl(d0);
    const pic0 = it.materialMainPicUrl?.trim() ?? "";
    const needPic = !pic0;
    if (!needUrl && !needPic) return it;

    const next: TeacherMaterialItem = { ...it };
    if (needUrl) {
      const u = rec.fileUrl?.trim() ?? "";
      if (u && isUsableDirectUrl(u)) {
        next.directFileUrl = materialStorageBrowserHref(u);
        const of = it.originalFilename?.trim() ? it.originalFilename : rec.fileName?.trim() || null;
        next.originalFilename = of;
        next.dataFileContentSha256 = rec.contentSha256?.trim()
          ? rec.contentSha256.trim()
          : it.dataFileContentSha256 ?? null;
        next.dataFileTypeId = rec.fileTypeId?.trim() ? rec.fileTypeId.trim() : it.dataFileTypeId ?? null;
      }
    }
    if (needPic) {
      const rawLogo = rec.logoUrl?.trim() || null;
      if (rawLogo) {
        const logoMeta = parseDataFileLogoMeta(rawLogo);
        next.materialMainPicUrl = logoMeta.coverDisplayHref;
        next.logoUrlRaw = rawLogo;
      }
      // logoUrl 为空但已有 coverFileId 时，同批次 look up 可能已包含封面子行
      if (!next.materialMainPicUrl && next.coverFileUrl) {
        next.materialMainPicUrl = next.coverFileUrl;
      }
    }
    // 补全 coverFileUrl（通过 coverFileId lookup 到封面子行的 fileUrl）
    // 使用 mediaRegistryStreamUrl 而非 materialStorageBrowserHref，因为
    // 封面子行的 fileUrl 是相对路径（如 v2/...），需要走预签名代理获取可访问地址
    const coverId = rec.coverFileId?.trim() || it.coverFileId?.trim();
    if (coverId && !it.coverFileUrl) {
      const coverRec = files.find((f) => f.fileId === coverId);
      if (coverRec && coverRec.fileUrl?.trim()) {
        next.coverFileUrl = mediaRegistryStreamUrl(coverId, "view", actor);
        next.coverFileId = coverId;
      }
    }
    return next;
  });
}

/**
 * 列表首屏无 `comments.k` 时，首轮推断可能缺少 `data_file.file_url`（merge 后才写入 directFileUrl）。
 * 仅在 JSON 未显式写 `k` 时，用补全后的直链再推断一次，避免刷新后一律显示为 word。
 */
function refineTeacherMaterialKindsAfterFileLookup(
  rows: V2MaterialMsgRow[],
  items: TeacherMaterialItem[],
): TeacherMaterialItem[] {
  return items.map((item, idx) => {
    const meta = parseTmMeta(rows[idx]?.comments);
    if (typeof meta.k === "string" && meta.k.trim()) return item;
    const hint = inferKindFromFileNameOrUrlHints(item.originalFilename, item.directFileUrl?.trim() || null);
    if (!hint) return item;
    return { ...item, kind: normalizeTeacherMaterialKind(hint) };
  });
}

function pickDirectFileUrl(row: V2MaterialMsgRow, meta: TmMeta): string | null {
  const fromMeta = typeof meta.u === "string" ? meta.u.trim() : "";
  if (fromMeta && isUsableDirectUrl(fromMeta)) return materialStorageBrowserHref(fromMeta);
  const main = row.mainPicUrl?.trim() || row.logoUrl?.trim() || "";
  if (main && isUsableDirectUrl(main)) return materialStorageBrowserHref(main);
  return null;
}

/** 详情接口含 `material_pic` 合并后的 `mainPicUrl` 与 `pics`，用于补全列表行缺失的直链 */
function extractPlayableBrowserHrefFromMaterialDetail(d: V2MaterialDetail): string | null {
  const meta = parseTmMeta(d.comments);
  const primary = pickDirectFileUrl(d, meta);
  if (primary) return primary;
  for (const p of d.pics ?? []) {
    const u = p.materialUrl?.trim() ?? "";
    if (u && isUsableDirectUrl(u)) return materialStorageBrowserHref(u);
  }
  return null;
}

/**
 * 列表行仅有 `comments.k`、无 `ma`/`mr`/`u` 时，`GET /v2/material` 可能仍缺子图 URL；对「需媒体展示」的条目补拉详情，合并直链（限数量+并发，避免拖垮首屏）。
 */
async function enrichTeacherMaterialsPlaybackFromDetail(
  actor: ApiActor,
  items: TeacherMaterialItem[],
  options?: { maxFetches?: number; concurrency?: number },
): Promise<TeacherMaterialItem[]> {
  const maxFetches = options?.maxFetches ?? 24;
  const concurrency = options?.concurrency ?? 4;
  const mediaKinds = new Set<string>(["image", "video", "audio", "pdf"]);

  const targets: TeacherMaterialItem[] = [];
  for (const it of items) {
    if (!mediaKinds.has(it.kind)) continue;
    if (resolvedTeacherMaterialDataFileId(it)) continue;
    const d0 = it.directFileUrl?.trim() ?? "";
    if (d0 && isUsableDirectUrl(d0)) continue;
    targets.push(it);
  }

  const chosen = targets.slice(0, maxFetches);
  const urlById = new Map<string, string>();
  for (let i = 0; i < chosen.length; i += concurrency) {
    const slice = chosen.slice(i, i + concurrency);
    await Promise.all(
      slice.map(async (it) => {
        try {
          const detail = await fetchV2MaterialDetail(actor, it.materialId);
          const href = extractPlayableBrowserHrefFromMaterialDetail(detail);
          if (href) urlById.set(it.materialId, href);
        } catch {
          /* 单条失败忽略 */
        }
      }),
    );
  }

  if (urlById.size === 0) return items;
  return items.map((it) => {
    const h = urlById.get(it.materialId);
    return h ? { ...it, directFileUrl: h } : it;
  });
}

function buildTmMetaString(input: {
  kind: TeacherMaterialKind;
  experimentId: string | null;
  linkedExperimentTitle: string | null;
  dataFileIdMr: string | null;
  dataFileIdMa: string | null;
  originalFilename: string | null;
  visibilitySelfOnly?: boolean;
}): string {
  const trim = (s: string | null | undefined, max: number) => {
    const t = (s ?? "").trim();
    if (!t) return undefined;
    return t.length > max ? t.slice(0, max) : t;
  };
  const meta: TmMeta = {
    k: trim(input.kind, 48),
    eid: input.experimentId?.trim() ? input.experimentId.trim().slice(0, 64) : null,
    lt: trim(input.linkedExperimentTitle, 80),
    mr: input.dataFileIdMr?.trim() ? input.dataFileIdMr.trim().slice(0, 64) : null,
    ma: input.dataFileIdMa?.trim() ? input.dataFileIdMa.trim().slice(0, 64) : null,
    of: trim(input.originalFilename, 120),
    ...(input.visibilitySelfOnly ? { pv: 1 } : {}),
  };
  let s = JSON.stringify(meta);
  if (s.length <= TM_META_MAX_LEN) return s;
  const shrink: TmMeta = { ...meta, lt: undefined, of: trim(input.originalFilename, 40) };
  s = JSON.stringify(shrink);
  if (s.length <= TM_META_MAX_LEN) return s;
  const minimal: TmMeta = {
    k: meta.k,
    mr: meta.mr,
    ma: meta.ma,
    eid: meta.eid,
    ...(input.visibilitySelfOnly ? { pv: 1 } : {}),
  };
  s = JSON.stringify(minimal);
  return s.length <= TM_META_MAX_LEN ? s : s.slice(0, TM_META_MAX_LEN);
}

function buildTmMetaStringRequired(input: Parameters<typeof buildTmMetaString>[0]): string {
  const s = buildTmMetaString(input);
  return s.trim() ? s : "{}";
}

/** 从 `V2DataFileRecord` 读取时间字段（兼容 JSON 为 camelCase 或 snake_case）。 */
function readV2DataFileTimestamp(f: V2DataFileRecord, which: "update" | "create"): string {
  const o = f as unknown as Record<string, unknown>;
  const camel = which === "update" ? "updateTime" : "createTime";
  const snake = which === "update" ? "update_time" : "create_time";
  const v = o[camel] ?? o[snake];
  if (v == null || v === "") return "";
  return String(v).trim();
}

/** 从 `V2MaterialMsgRow` 读取时间（兼容 camelCase / snake_case，与列表 JSON 对齐）。 */
function readV2MaterialTimestamp(row: V2MaterialMsgRow, which: "update" | "create"): string {
  const o = row as unknown as Record<string, unknown>;
  const camel = which === "update" ? "updateTime" : "createTime";
  const snake = which === "update" ? "update_time" : "create_time";
  const v = o[camel] ?? o[snake];
  if (v == null || v === "") return "";
  return String(v).trim();
}

/**
 * 列表/卡片「更新时间」：与库表 `create_time` / `update_time` 一致展示，**保留时分**（不截成仅日期）。
 * - `YYYY-MM-DD` 原样；
 * - `YYYY-MM-DD HH:mm:ss`（后端 `pickSqlDateTime`）取到分钟 `YYYY-MM-DD HH:mm`；
 * - 含 `T` 的 ISO 按浏览器本地时区格式化为 `YYYY-MM-DD HH:mm`。
 */
function formatTeacherMaterialsListDate(raw: string | null | undefined): string {
  if (raw == null) return "";
  const s = String(raw).trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}[ T]\d/.test(s)) {
    const normalized = s.replace("T", " ").replace(/\.\d+.*$/, "").trim();
    const m = normalized.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{1,2})(?::\d{1,2})?/);
    if (m) {
      const hh = String(Number(m[2])).padStart(2, "0");
      const mm = String(Number(m[3])).padStart(2, "0");
      return `${m[1]} ${hh}:${mm}`;
    }
    return normalized.slice(0, 19);
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s.length >= 10 ? s.slice(0, 10) : s;
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${day} ${hh}:${mm}`;
}

/** 与 `teacher-materials-ui.config` 侧栏/表单下拉一致，不含「全部」。 */
const KNOWN_TEACHER_MATERIAL_KINDS = new Set<string>([
  "word",
  "ppt",
  "pdf",
  "image",
  "video",
  "audio",
  "spreadsheet",
]);

/** 迁移或旧端写入的 `k` 与当前表单 value 不一致时做映射。 */
const LEGACY_TEACHER_MATERIAL_KIND_ALIASES: Record<string, TeacherMaterialKind> = {
  document: "word",
  doc: "word",
  excel: "spreadsheet",
  xls: "spreadsheet",
  sheet: "spreadsheet",
};

/** 将任意历史 `k` 规范为下拉可选的 code，避免 Select 无匹配项显示空白。 */
export function normalizeTeacherMaterialKind(raw: string | null | undefined): TeacherMaterialKind {
  const t = (raw ?? "").trim().toLowerCase();
  if (!t) return "word";
  if (KNOWN_TEACHER_MATERIAL_KINDS.has(t)) return t as TeacherMaterialKind;
  const mapped = LEGACY_TEACHER_MATERIAL_KIND_ALIASES[t];
  if (mapped) return mapped;
  return "word";
}

/** 从同源代理路径还原真实存储 URL，供后缀推断（与 `materialStorageBrowserHref` 对称）。 */
function urlForKindInference(href: string | null | undefined): string {
  const t = (href ?? "").trim();
  if (!t) return "";
  if (t.startsWith("/api/materials/open?")) {
    try {
      const raw = new URL(t, "http://localhost").searchParams.get("u");
      return raw?.trim() || "";
    } catch {
      return "";
    }
  }
  return t;
}

/** 无 JSON `k` 时从文件名或库内 URL 路径推断侧栏/预览类型（与 material_type_id 字典主键无关）。 */
export function inferKindFromFileNameOrUrlHints(
  fileName: string | null | undefined,
  url: string | null | undefined,
): TeacherMaterialKind | null {
  const n = (fileName ?? "").trim();
  const u = urlForKindInference(url);
  const extFromName = (s: string) => {
    const i = s.lastIndexOf(".");
    return i < 0 ? "" : s.slice(i + 1).toLowerCase();
  };
  const extFromHttpUrl = (href: string) => {
    try {
      const pathname = new URL(href).pathname;
      const seg = pathname.split("/").pop() ?? "";
      const i = seg.lastIndexOf(".");
      return i >= 0 ? seg.slice(i + 1).toLowerCase() : "";
    } catch {
      return "";
    }
  };
  let suffix = n ? extFromName(n) : "";
  if (!suffix && (u.startsWith("http://") || u.startsWith("https://"))) suffix = extFromHttpUrl(u);
  if (!suffix) return null;
  return inferTeacherMaterialKindFromExtension(suffix);
}

/** 上传回写后由 `GET /v2/file/:fileId` 组装列表行（与 `listTeacherMaterialsApi` 一致） */
export function teacherMaterialFromDataFileRecord(f: V2DataFileRecord): TeacherMaterialItem {
  return dataFileRecordToTeacherItem(f);
}

/** 与 `FILE_KIND_MAP` 反向：FT_ type_id → TeacherMaterialKind */
const FT_TO_KIND: Record<string, TeacherMaterialKind> = {
  FT_Document: "word",
  FT_Ppt: "ppt",
  FT_Pdf: "pdf",
  FT_Image: "image",
  FT_Video: "video",
  FT_Audio: "audio",
  FT_Spreadsheet: "spreadsheet",
};

function dataFileRecordToTeacherItem(f: V2DataFileRecord): TeacherMaterialItem {
  const inferredKind = inferKindFromFileNameOrUrlHints(f.fileName, f.fileUrl);
  // 文件名/URL 推断不到时，用 file_type_id 降级（如 FT_Image → image）
  const kind = inferredKind
    ? normalizeTeacherMaterialKind(inferredKind)
    : f.fileTypeId?.trim()
      ? (FT_TO_KIND[f.fileTypeId.trim()] ?? "word")
      : "word";
  const rawLogo = f.logoUrl?.trim() || null;
  const logoMeta = parseDataFileLogoMeta(rawLogo);

  // 封面 URL 优先级：coverFileUrl > 旧版 logoUrl
  // coverFileUrl 由 listTeacherMaterialsApi 中批量 lookup 补全
  const coverDisplayUrl = logoMeta.coverDisplayHref;
  return {
    rowSource: "data_file",
    materialId: f.fileId,
    title: f.fileName?.trim() || "未命名文件",
    kind,
    experimentId: null,
    linkedExperimentTitle: null,
    dataFileIdMr: null,
    dataFileIdMa: f.fileId,
    originalFilename: f.fileName?.trim() || null,
    directFileUrl: materialStorageBrowserHref(f.fileUrl),
    updatedAt:
      formatTeacherMaterialsListDate(readV2DataFileTimestamp(f, "update")) ||
      formatTeacherMaterialsListDate(readV2DataFileTimestamp(f, "create")) ||
      "—",
    materialStatus: f.status?.trim() ? f.status.trim() : null,
    materialMainPicUrl: coverDisplayUrl,
    expPurpose: null,
    additionalComments: null,
    materialNum: null,
    ownerUserId: f.ownerUserId?.trim() || null,
    logoUrlRaw: rawLogo,
    dataFileContentSha256: f.contentSha256?.trim() ? f.contentSha256.trim() : null,
    dataFileTypeId: f.fileTypeId?.trim() ? f.fileTypeId.trim() : null,
    coverFileId: f.coverFileId?.trim() || null,
    coverFileUrl: null,
  };
}

function v2RowToTeacherItem(row: V2MaterialMsgRow): TeacherMaterialItem {
  const meta = parseTmMeta(row.comments);
  const kindFromMeta = typeof meta.k === "string" && meta.k.trim() ? meta.k.trim() : "";
  const rawMainPic = row.mainPicUrl?.trim() || row.logoUrl?.trim() || "";
  const metaUrl = typeof meta.u === "string" ? meta.u.trim() : "";
  const inferredKind = inferKindFromFileNameOrUrlHints(meta.of, metaUrl || rawMainPic || null);
  /** 侧栏/预览使用「教师类型 code」（word、pdf…），不是 material_msg.material_type_id（指向 data_material_type 主键）。 */
  const kind = kindFromMeta
    ? normalizeTeacherMaterialKind(kindFromMeta)
    : inferredKind
      ? normalizeTeacherMaterialKind(inferredKind)
      : "word";
  return {
    rowSource: "material_msg",
    materialId: row.materialId,
    title: row.materialName?.trim() || "未命名素材",
    kind,
    experimentId: meta.eid ?? null,
    linkedExperimentTitle: meta.lt ?? null,
    dataFileIdMr: meta.mr ?? null,
    dataFileIdMa: meta.ma ?? null,
    originalFilename: meta.of ?? null,
    directFileUrl: pickDirectFileUrl(row, meta),
    updatedAt:
      formatTeacherMaterialsListDate(readV2MaterialTimestamp(row, "update")) ||
      formatTeacherMaterialsListDate(readV2MaterialTimestamp(row, "create")) ||
      "—",
    materialStatus: row.status?.trim() ? row.status.trim() : null,
    materialMainPicUrl: row.mainPicUrl?.trim() || row.logoUrl?.trim() || null,
    expPurpose: row.expPurpose?.trim() ? row.expPurpose.trim() : null,
    additionalComments: row.additionalComments?.trim() ? row.additionalComments.trim() : null,
    materialNum: row.materialNum != null && !Number.isNaN(Number(row.materialNum)) ? Number(row.materialNum) : null,
    ownerUserId: row.createUserId?.trim() || null,
    visibilitySelfOnly: meta.pv === 1,
    logoUrlRaw: null,
  };
}

/**
 * 列表是否按 `data_file.owner_user_id` 收窄：
 * - 默认：**不按归属人过滤**（全库可见；「仅自己可见」由 `visibilitySelfOnly` + 前端过滤）。
 * - 设 `NEXT_PUBLIC_TEACHER_MATERIALS_SCOPE=owner` 时：教师/学生/家长仅看本人上传（旧行为）。
 */
function isOwnerScopedTeacherMaterialsList(): boolean {
  return (process.env.NEXT_PUBLIC_TEACHER_MATERIALS_SCOPE ?? "").trim().toLowerCase() === "owner";
}

function teacherLibraryOwnerUserIdScope(actor: ApiActor): string | undefined {
  if (!isOwnerScopedTeacherMaterialsList()) return undefined;
  const r = actor.role;
  if (r === UserRole.RESEARCHER || r === UserRole.DISTRICT_ADMIN || r === UserRole.SUPER_ADMIN) {
    return undefined;
  }
  const uid = actor.userId?.trim();
  return uid || undefined;
}

/** 排除「仅自己可见」且归属人非当前用户的素材 */
export function filterTeacherMaterialsVisibleToActor(actor: ApiActor, items: TeacherMaterialItem[]): TeacherMaterialItem[] {
  const uid = actor.userId?.trim() || "";
  return items.filter((it) => {
    if (!it.visibilitySelfOnly) return true;
    const owner = it.ownerUserId?.trim() || "";
    if (!owner) return false;
    return owner === uid;
  });
}

/** 与 `listTeacherMaterialsApi` 相同的 `GET /v2/file` 基础筛选（巡检、对账复用） */
export function teacherMaterialsDataFileListBaseQuery(actor: ApiActor): { ownerUserId?: string; status: "y" } {
  const ownerUserId = teacherLibraryOwnerUserIdScope(actor);
  return { ...(ownerUserId ? { ownerUserId } : {}), status: "y" };
}

export async function listTeacherMaterialsApi(
  actor: ApiActor,
  filters?: { keyword?: string; materialTypeCode?: string },
): Promise<TeacherMaterialItem[]> {
  void filters?.materialTypeCode;
  const files = await fetchV2FilesAll(actor, {
    ...teacherMaterialsDataFileListBaseQuery(actor),
    keyword: filters?.keyword?.trim() || undefined,
  });

  // 按 contentSha256 去重：相同哈希只保留最新一条（遍历顺序即最新排序）
  const seen = new Map<string, TeacherMaterialItem>();
  const noShaItems: TeacherMaterialItem[] = [];
  for (const f of files) {
    const item = dataFileRecordToTeacherItem(f);
    const sha = f.contentSha256?.trim();
    if (!sha) {
      // 无哈希的旧数据每条单独显示（不参与去重），等用户删除重传后自然消失
      noShaItems.push(item);
      continue;
    }
    if (!seen.has(sha)) {
      seen.set(sha, item);
    }
  }

  const deduped = filterTeacherMaterialsVisibleToActor(actor, [...seen.values()]);
  const merged = [...deduped, ...noShaItems];

  // 批量补全封面 URL：收集所有有 coverFileId 但无 coverFileUrl 的条目
  const coverNeed = new Map<string, TeacherMaterialItem>();
  for (const it of merged) {
    const coverId = it.coverFileId?.trim();
    if (coverId && !it.coverFileUrl) {
      coverNeed.set(coverId, it);
    }
  }
  if (coverNeed.size > 0) {
    try {
      const coverFiles = await fetchV2FilesLookup(actor, [...coverNeed.keys()]);
      const coverById = new Map(coverFiles.map((f) => [f.fileId, f]));
      for (const [coverId, item] of coverNeed) {
        const rec = coverById.get(coverId);
        if (rec && rec.fileUrl) {
          // 封面子行的 fileUrl 是相对路径（如 v2/...），mediaRegistryStreamUrl
          // 利用 coverFileId 走 /api/media/registry-stream 代理获得预签名可访问地址
          const href = mediaRegistryStreamUrl(coverId, "view", actor);
          item.coverFileUrl = href;
          // 同步到 materialMainPicUrl，供 getMaterialPreviewPayload 读取
          item.materialMainPicUrl = href;
        }
      }
    } catch {
      // 失败时静默忽略，封面列为空不影响主流程
    }
  }

  return merged;
}

export type CreateTeacherMaterialPayload = Pick<
  TeacherMaterialItem,
  | "title"
  | "kind"
  | "experimentId"
  | "linkedExperimentTitle"
  | "dataFileIdMr"
  | "dataFileIdMa"
  | "originalFilename"
> & {
  /** V2 上传回写的 `data_file.file_url`，写入 `material_msg.main_pic_url` */
  mainPicUrl?: string | null;
};

export type UpdateTeacherMaterialPayload = Pick<
  TeacherMaterialItem,
  | "title"
  | "kind"
  | "experimentId"
  | "linkedExperimentTitle"
  | "dataFileIdMr"
  | "dataFileIdMa"
  | "originalFilename"
  | "materialStatus"
  | "materialMainPicUrl"
  | "expPurpose"
  | "additionalComments"
  | "materialNum"
> & {
  visibilitySelfOnly?: boolean;
  /** 更新 data_file 行时传入当前库里的 `logo_url` 原始值，便于写入/解除「仅自己可见」JSON */
  logoUrlRaw?: string | null;
};

export async function deleteTeacherMaterialApi(
  actor: ApiActor,
  materialId: string,
  rowSource?: TeacherMaterialRowSource,
): Promise<{ deleted: boolean; s3CleanupScheduled?: boolean; childrenCleaned?: number }> {
  if (rowSource === "data_file") {
    const result = await deleteV2File(actor, materialId);
    return result;
  }
  await deleteV2Material(actor, materialId);
  return { deleted: true };
}

export async function updateTeacherMaterialApi(
  actor: ApiActor,
  materialId: string,
  payload: UpdateTeacherMaterialPayload,
  rowSource?: TeacherMaterialRowSource,
): Promise<TeacherMaterialItem> {
  if (rowSource === "data_file") {
    const logoPatch =
      payload.visibilitySelfOnly !== undefined
        ? buildDataFileLogoPatchForUpdate(payload.visibilitySelfOnly === true, payload.logoUrlRaw ?? null)
        : undefined;
    const rec = await patchV2FileRecord(actor, materialId, {
      fileName: payload.title.trim(),
      ...(payload.materialStatus?.trim() ? { status: payload.materialStatus.trim() } : {}),
      ...(logoPatch !== undefined ? { logoUrl: logoPatch } : {}),
    });
    return dataFileRecordToTeacherItem(rec);
  }
  const comments = buildTmMetaStringRequired({
    kind: payload.kind,
    experimentId: payload.experimentId,
    linkedExperimentTitle: payload.linkedExperimentTitle,
    dataFileIdMr: payload.dataFileIdMr,
    dataFileIdMa: payload.dataFileIdMa,
    originalFilename: payload.originalFilename,
    visibilitySelfOnly: payload.visibilitySelfOnly === true,
  });
  const patch: PatchV2MaterialInput = {
    materialName: payload.title.trim(),
    comments,
    status: payload.materialStatus?.trim() ? payload.materialStatus.trim() : null,
    mainPicUrl: payload.materialMainPicUrl?.trim() ? payload.materialMainPicUrl.trim() : null,
    expPurpose: payload.expPurpose?.trim() ? payload.expPurpose.trim() : null,
    additionalComments: payload.additionalComments?.trim() ? payload.additionalComments.trim() : null,
    materialNum: payload.materialNum != null ? String(payload.materialNum) : null,
  };
  const row = await patchV2Material(actor, materialId, patch);
  return v2RowToTeacherItem(row);
}

export async function createTeacherMaterialApi(
  actor: ApiActor,
  payload: CreateTeacherMaterialPayload,
): Promise<TeacherMaterialItem> {
  const comments = buildTmMetaStringRequired({
    kind: payload.kind,
    experimentId: payload.experimentId,
    linkedExperimentTitle: payload.linkedExperimentTitle,
    dataFileIdMr: payload.dataFileIdMr,
    dataFileIdMa: payload.dataFileIdMa,
    originalFilename: payload.originalFilename,
  });
  const row = await postV2Material(actor, {
    materialName: payload.title.trim(),
    status: "y",
    comments,
    mainPicUrl: payload.mainPicUrl?.trim() || undefined,
  });
  return v2RowToTeacherItem(row);
}

type DownloadActorSlice = Pick<ApiActor, "orgId" | "userId" | "userName" | "tenantId" | "appId">;

/**
 * 下载地址：凡有 V2 `data_file` 登记 id 时一律走 `/api/media/registry-stream` → 预签名（避免浏览器直连 MinIO 匿名 GET 报 AccessDenied）；
 * 否则再尝试库内直链（同源代理或公网可直连 URL）。
 */
export function teacherMaterialDownloadHref(item: TeacherMaterialItem, actor?: DownloadActorSlice): string | null {
  const fid = resolvedTeacherMaterialDataFileId(item);
  if (fid) return mediaRegistryStreamUrl(fid, "download", actor);
  const d = item.directFileUrl?.trim() ?? "";
  if (d && isUsableDirectUrl(d)) return d;
  return null;
}

/**
 * 列表行未带附件列时，拉取详情尝试 `main_pic_url` / `material_pic` 的首个可用 URL。
 */
export async function resolveTeacherMaterialDownload(actor: ApiActor, item: TeacherMaterialItem): Promise<string | null> {
  const wired = teacherMaterialDownloadHref(item, actor);
  if (wired) return wired;
  if (item.rowSource !== "data_file") {
    try {
      const detail = await fetchV2MaterialDetail(actor, item.materialId);
      const main = detail.mainPicUrl?.trim() ?? "";
      if (main && isUsableDirectUrl(main)) return materialStorageBrowserHref(main);
      for (const p of detail.pics ?? []) {
        const u = p.materialUrl?.trim() ?? "";
        if (u && isUsableDirectUrl(u)) return materialStorageBrowserHref(u);
      }
    } catch {
      /* 忽略单条拉取失败 */
    }
  }
  return null;
}
















