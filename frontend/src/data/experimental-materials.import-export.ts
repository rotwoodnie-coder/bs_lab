import {
  EXPERIMENTAL_MATERIAL_CATEGORY_OPTIONS,
  EXPERIMENTAL_MATERIAL_SAFETY_TAG_OPTIONS,
  EXPERIMENTAL_MATERIAL_TYPE_OPTIONS,
  type ExperimentalMaterialCategory,
  type ExperimentalMaterialRecord,
  type ExperimentalMaterialSafetyTag,
  type ExperimentalMaterialType,
} from "@/data/experimental-materials";

export type ExperimentalMaterialsImportMode = "append" | "replace";

const MATERIAL_TYPE_SET = new Set<ExperimentalMaterialType>(EXPERIMENTAL_MATERIAL_TYPE_OPTIONS.map((x) => x.id));
const CATEGORY_SET = new Set<ExperimentalMaterialCategory>(EXPERIMENTAL_MATERIAL_CATEGORY_OPTIONS.map((x) => x.id));
const SAFETY_TAG_SET = new Set<ExperimentalMaterialSafetyTag>(EXPERIMENTAL_MATERIAL_SAFETY_TAG_OPTIONS.map((x) => x.id));

const EXPORT_VERSION = 1;

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}

function validateString(value: unknown, fieldName: string): string {
  if (typeof value !== "string") throw new Error(`${fieldName} 必须是字符串`);
  const v = value.trim();
  if (!v) throw new Error(`${fieldName} 不能为空`);
  return value;
}

function validateStringMaybe(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function validateStringArray<T extends string>(value: unknown, allowed: ReadonlySet<T>, fieldName: string): T[] {
  if (!Array.isArray(value)) throw new Error(`${fieldName} 必须是数组`);
  const out: T[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !allowed.has(item as T)) {
      throw new Error(`${fieldName} 包含非法项：${String(item)}`);
    }
    out.push(item as T);
  }
  return out;
}

function normalizeRecord(raw: unknown): ExperimentalMaterialRecord {
  if (!raw || typeof raw !== "object") throw new Error("材料记录必须是对象");
  const record = raw as Record<string, unknown>;

  const id = validateString(record.id, "id").trim();
  const name = validateString(record.name, "name").trim();

  const materialType = record.materialType;
  if (typeof materialType !== "string" || !MATERIAL_TYPE_SET.has(materialType as ExperimentalMaterialType)) {
    throw new Error("materialType 无效");
  }

  const categories = validateStringArray(record.categories, CATEGORY_SET, "categories");
  const safetyTags = validateStringArray(record.safetyTags, SAFETY_TAG_SET, "safetyTags");

  const createdAt = isIsoTimestamp(record.createdAt) ? record.createdAt : new Date().toISOString();
  const updatedAt = isIsoTimestamp(record.updatedAt) ? record.updatedAt : new Date().toISOString();

  return {
    id,
    name,
    photoUrl: validateStringMaybe(record.photoUrl),
    materialType: materialType as ExperimentalMaterialType,
    categories,
    usage: validateString(record.usage, "usage"),
    suggestedAmount: validateStringMaybe(record.suggestedAmount),
    homeAlternative: validateStringMaybe(record.homeAlternative),
    safetyTags,
    safetyNote: validateStringMaybe(record.safetyNote),
    remark: validateStringMaybe(record.remark),
    createdByActorId: typeof record.createdByActorId === "string" && record.createdByActorId.trim() ? record.createdByActorId : "imported:local",
    createdAt,
    updatedByActorId: typeof record.updatedByActorId === "string" && record.updatedByActorId.trim() ? record.updatedByActorId : "imported:local",
    updatedAt,
  };
}

export function exportExperimentalMaterialsToJson(rows: ExperimentalMaterialRecord[]): string {
  return JSON.stringify(
    {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      materials: rows,
    },
    null,
    2,
  );
}

export function parseExperimentalMaterialsFromJson(text: string): ExperimentalMaterialRecord[] {
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch {
    throw new Error("无法解析 JSON，请确认文件为 UTF-8 JSON");
  }

  const list: unknown[] =
    Array.isArray(raw) ? raw : Array.isArray((raw as { materials?: unknown }).materials) ? (raw as { materials?: unknown }).materials as unknown[] : [];

  if (list.length === 0) throw new Error("JSON 中未找到 materials 数组");

  return list.map((item) => normalizeRecord(item));
}

export function mergeExperimentalMaterials(
  base: readonly ExperimentalMaterialRecord[],
  incoming: readonly ExperimentalMaterialRecord[],
  mode: ExperimentalMaterialsImportMode,
): ExperimentalMaterialRecord[] {
  if (mode === "replace") return [...incoming];

  if (mode === "append") {
    const byId = new Map<string, ExperimentalMaterialRecord>();
    for (const row of base) byId.set(row.id, row);
    for (const row of incoming) byId.set(row.id, row);
    return [...byId.values()].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }

  return assertNever(mode);
}

