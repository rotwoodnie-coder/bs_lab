/**
 * 多扩展名 → 同一业务类别（teacherMaterialKind），再经 `resolveDataFileTypeIdByTeacherMaterialKind`
 * 落到 `data_file_type` 的某一 `type_id`（一行大类、多扩展名归并）。
 *
 * **默认扩展名列表**：`v2-file-extension-groups.json`（可提交、可 code review）。
 * **前端副本**（须与默认表同步）：`frontend/src/lib/media/v2-file-extension-groups.json`。
 * **环境私有追加**：同目录下 `v2-file-extension-groups.local.json`（见 .gitignore），按 kind 与默认表合并去重。
 *
 * `data_file_type.comments` 可作文档对照；运行时以本模块 + JSON 为准。
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FILE_KIND_MAP } from "../../infrastructure/repositories/v2-file-repository.ts";

/** 与 `v2-file-repository` 中 `FILE_KIND_MAP` 的 key 集合一致 */
const ALLOWED_KINDS = new Set(Object.keys(FILE_KIND_MAP));

type ExtensionGroupsJson = Record<string, string[]>;

function thisDir(): string {
  return dirname(fileURLToPath(import.meta.url));
}

function parseExtGroups(raw: unknown, label: string): ExtensionGroupsJson {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`${label}: 根节点须为 JSON 对象`);
  }
  const out: ExtensionGroupsJson = {};
  for (const [kind, v] of Object.entries(raw as Record<string, unknown>)) {
    /** 允许 `_comment` 等元数据键 */
    if (kind.startsWith("_")) continue;
    if (!Array.isArray(v)) {
      throw new Error(`${label}: "${kind}" 的值须为字符串数组`);
    }
    const exts = v.map((x) => String(x).trim().toLowerCase()).filter(Boolean);
    if (!ALLOWED_KINDS.has(kind)) {
      throw new Error(`${label}: 未知 kind "${kind}"，允许值为 ${[...ALLOWED_KINDS].sort().join(", ")}`);
    }
    out[kind] = exts;
  }
  return out;
}

function readGroupsFile(path: string, label: string): ExtensionGroupsJson {
  const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
  return parseExtGroups(raw, label);
}

function mergeByKind(base: ExtensionGroupsJson, overlay: ExtensionGroupsJson): ExtensionGroupsJson {
  const merged: ExtensionGroupsJson = { ...base };
  for (const [kind, add] of Object.entries(overlay)) {
    if (kind.startsWith("_")) continue;
    const prev = merged[kind] ?? [];
    merged[kind] = [...new Set([...prev, ...add])].sort((a, b) => a.localeCompare(b));
  }
  return merged;
}

function loadDataFileExtensionGroups(): ExtensionGroupsJson {
  const dir = thisDir();
  const basePath = join(dir, "v2-file-extension-groups.json");
  const base = readGroupsFile(basePath, "v2-file-extension-groups.json");
  const localPath = join(dir, "v2-file-extension-groups.local.json");
  if (!existsSync(localPath)) return base;
  const local = readGroupsFile(localPath, "v2-file-extension-groups.local.json");
  return mergeByKind(base, local);
}

/** 合并后的扩展名分组（启动时从 JSON + 可选 local 加载） */
export const DATA_FILE_EXTENSION_GROUPS: Readonly<ExtensionGroupsJson> = loadDataFileExtensionGroups();

function buildExtensionToKindMap(): ReadonlyMap<string, string> {
  const m = new Map<string, string>();
  for (const [kind, exts] of Object.entries(DATA_FILE_EXTENSION_GROUPS)) {
    for (const e of exts) {
      const x = e.toLowerCase();
      const prev = m.get(x);
      if (prev !== undefined && prev !== kind) {
        throw new Error(
          `v2-file-extension-groups: 扩展名 "${x}" 同时出现在 "${prev}" 与 "${kind}"，请去重后再启动`,
        );
      }
      m.set(x, kind);
    }
  }
  return m;
}

const EXTENSION_TO_KIND = buildExtensionToKindMap();

function extFromFileName(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

/** 由 `file_ext` 或 `file_name` 后缀推断 kind，供上传 / data-repair 写入 `file_type_id` 前解析 */
export function inferTeacherMaterialKindFromDataFile(fileName: string, fileExt: string | null): string | null {
  const ext = (fileExt ?? "").trim().toLowerCase() || extFromFileName(fileName);
  if (!ext) return null;
  return EXTENSION_TO_KIND.get(ext) ?? null;
}
