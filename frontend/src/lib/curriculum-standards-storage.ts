import { EXPERIMENT_CATALOG_SUBJECTS } from "@/data/experiment-teaching-catalog.seed";
import { getExperimentCatalogSeedRowsCache } from "@/lib/catalog-seed-cache";
import type {
  CurriculumPublishStatus,
  CurriculumStandardRow,
  CurriculumStandardsStore,
  CurriculumSubject,
} from "@/types/curriculum-standard";

/** v2：内置《实验教学基本目录》全量数据（与 CSV 同源） */
export const CURRICULUM_STANDARDS_STORAGE_KEY = "bs-lab-curriculum-standards-v2";

/** 写入课标仓后派发，供全区看板等订阅实时刷新 */
export const BS_LAB_CURRICULUM_STANDARDS_UPDATED = "bs-lab-curriculum-standards-updated";

export type CurriculumSubjectDashboardStat = {
  subjectId: string;
  subjectName: string;
  /** 该学科下课标条目总数 */
  entryTotal: number;
  /** 至少填写过一条「基本实验活动」的条目数 */
  rowsWithExperiments: number;
  /** 基本实验活动字符串条数合计（细粒度关联量） */
  linkedExperimentItems: number;
};

export type CurriculumStandardsDashboardPayload = {
  updatedAt: string;
  subjects: CurriculumSubjectDashboardStat[];
  totals: {
    entryTotal: number;
    rowsWithExperiments: number;
    linkedExperimentItems: number;
  };
};

export function computeCurriculumStandardsDashboardPayload(store: CurriculumStandardsStore): CurriculumStandardsDashboardPayload {
  const subjects: CurriculumSubjectDashboardStat[] = store.subjects.map((s) => {
    const rows = store.rows.filter((r) => r.subjectId === s.id);
    const entryTotal = rows.length;
    let rowsWithExperiments = 0;
    let linkedExperimentItems = 0;
    for (const r of rows) {
      const n = Array.isArray(r.basicExperiments) ? r.basicExperiments.filter((x) => String(x).trim().length > 0).length : 0;
      if (n > 0) rowsWithExperiments += 1;
      linkedExperimentItems += n;
    }
    return {
      subjectId: s.id,
      subjectName: s.name,
      entryTotal,
      rowsWithExperiments,
      linkedExperimentItems,
    };
  });
  const totals = subjects.reduce(
    (acc, x) => ({
      entryTotal: acc.entryTotal + x.entryTotal,
      rowsWithExperiments: acc.rowsWithExperiments + x.rowsWithExperiments,
      linkedExperimentItems: acc.linkedExperimentItems + x.linkedExperimentItems,
    }),
    { entryTotal: 0, rowsWithExperiments: 0, linkedExperimentItems: 0 },
  );
  return { updatedAt: new Date().toISOString(), subjects, totals };
}

function emitCurriculumStandardsUpdated(store: CurriculumStandardsStore): void {
  if (typeof window === "undefined") return;
  const detail = computeCurriculumStandardsDashboardPayload(store);
  window.dispatchEvent(new CustomEvent(BS_LAB_CURRICULUM_STANDARDS_UPDATED, { detail }));
}

let inMemoryStore: CurriculumStandardsStore | null = null;

const nowIso = () => new Date().toISOString();

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const GRADE_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "一年级", label: "一年级" },
  { value: "二年级", label: "二年级" },
  { value: "三年级", label: "三年级" },
  { value: "四年级", label: "四年级" },
  { value: "五年级", label: "五年级" },
  { value: "六年级", label: "六年级" },
  { value: "七年级", label: "七年级" },
  { value: "八年级", label: "八年级" },
  { value: "九年级", label: "九年级" },
  { value: "十年级", label: "十年级" },
  { value: "十一年级", label: "十一年级" },
  { value: "十二年级", label: "十二年级" },
] as const;

function catalogSeedStore(): CurriculumStandardsStore {
  const t = nowIso();
  const subjects: CurriculumSubject[] = EXPERIMENT_CATALOG_SUBJECTS.map((s) => ({ ...s }));
  const raw = getExperimentCatalogSeedRowsCache() ?? [];
  const rows: CurriculumStandardRow[] = raw.map((r, i) => ({
    ...r,
    id: `std_seed_${i}`,
    updatedAt: t,
  }));
  return { subjects, rows };
}

/** 在内存种子已就绪且本地尚无课标仓时，写入一份初始快照（便于刷新后直读 localStorage）。 */
export function persistInitialCatalogSeedIfStorageEmpty(): void {
  if (inMemoryStore) return;
  writeCurriculumStandardsStore(normalizeCurriculumStandardsStore(catalogSeedStore()));
}

function seedStore(): CurriculumStandardsStore {
  return catalogSeedStore();
}

/** 不访问 localStorage：仅返回内置课标种子（实验编辑器等「全库真实性」路径使用）。 */
export function readCurriculumStandardsStoreCatalogSeedOnly(): CurriculumStandardsStore {
  return normalizeCurriculumStandardsStore(seedStore());
}

/** 丢弃本地修改，恢复为《实验教学基本目录》内置全量数据 */
export function resetCurriculumStandardsToCatalogSeed(): CurriculumStandardsStore {
  const next = normalizeCurriculumStandardsStore(catalogSeedStore());
  writeCurriculumStandardsStore(next);
  return next;
}

function parseStore(raw: unknown): CurriculumStandardsStore | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.subjects) || !Array.isArray(o.rows)) return null;
  return { subjects: o.subjects as CurriculumSubject[], rows: o.rows as CurriculumStandardRow[] };
}

function keepPrimaryScienceOnly(store: CurriculumStandardsStore): CurriculumStandardsStore {
  const subject =
    store.subjects.find((s) => s.name.trim() === "小学科学") ??
    store.subjects.find((s) => s.name.trim() === "科学试验列表");
  if (!subject) return { subjects: [], rows: [] };
  return {
    subjects: [subject],
    rows: store.rows.filter((r) => r.subjectId === subject.id && (r.phase ?? "").trim() === "小学"),
  };
}

/** 由活动类型推断用难度（无后端时的默认补全） */
export function inferCurriculumDifficulty(activityType?: string): string {
  const t = (activityType ?? "").trim();
  if (/观察||参观|阅读/.test(t)) return "低";
  if (/探究|设计|制作|调查/.test(t)) return "高";
  return "中";
}

function normalizePublishStatus(v: unknown): CurriculumPublishStatus | undefined {
  if (v === "draft" || v === "published") return v;
  return undefined;
}

/** 读入后补全新版本字段，兼容旧版 localStorage */
export function normalizeCurriculumStandardsStore(store: CurriculumStandardsStore): CurriculumStandardsStore {
  const cleaned = keepPrimaryScienceOnly(store);
  return {
    ...cleaned,
    rows: cleaned.rows.map((r) => {
      const publishStatus = normalizePublishStatus(r.publishStatus) ?? "published";
      return {
        ...r,
        effectiveYear: typeof r.effectiveYear === "number" && Number.isFinite(r.effectiveYear) ? r.effectiveYear : 2022,
        publishStatus,
        suggestedCoreMaterials:
          typeof r.suggestedCoreMaterials === "string" ? r.suggestedCoreMaterials : "",
        difficultyLevel:
          typeof r.difficultyLevel === "string" && r.difficultyLevel.trim()
            ? r.difficultyLevel.trim()
            : inferCurriculumDifficulty(r.activityType),
        updatedAt: typeof r.updatedAt === "string" && r.updatedAt ? r.updatedAt : nowIso(),
      };
    }),
  };
}

export function readCurriculumStandardsStore(): CurriculumStandardsStore {
  if (!inMemoryStore) {
    inMemoryStore = normalizeCurriculumStandardsStore(seedStore());
  }
  return inMemoryStore;
}

export function writeCurriculumStandardsStore(store: CurriculumStandardsStore): void {
  inMemoryStore = store;
  emitCurriculumStandardsUpdated(store);
}

export function createSubject(
  store: CurriculumStandardsStore,
  input: Pick<CurriculumSubject, "name" | "description">,
): CurriculumStandardsStore {
  const subject: CurriculumSubject = {
    id: newId("subj"),
    name: input.name.trim(),
    description: input.description.trim(),
  };
  return { ...store, subjects: [...store.subjects, subject] };
}

export function updateSubject(
  store: CurriculumStandardsStore,
  id: string,
  input: Pick<CurriculumSubject, "name" | "description">,
): CurriculumStandardsStore {
  return {
    ...store,
    subjects: store.subjects.map((s) =>
      s.id === id ? { ...s, name: input.name.trim(), description: input.description.trim() } : s,
    ),
  };
}

export function deleteSubject(store: CurriculumStandardsStore, id: string): CurriculumStandardsStore {
  return {
    subjects: store.subjects.filter((s) => s.id !== id),
    rows: store.rows.filter((r) => r.subjectId !== id),
  };
}

export function createStandardRow(
  store: CurriculumStandardsStore,
  input: Omit<CurriculumStandardRow, "id" | "updatedAt">,
): CurriculumStandardsStore {
  const row: CurriculumStandardRow = {
    ...input,
    id: newId("std"),
    updatedAt: nowIso(),
  };
  return { ...store, rows: [...store.rows, row] };
}

export function updateStandardRow(
  store: CurriculumStandardsStore,
  id: string,
  patch: Omit<CurriculumStandardRow, "id" | "updatedAt">,
): CurriculumStandardsStore {
  return {
    ...store,
    rows: store.rows.map((r) =>
      r.id === id ? { ...r, ...patch, updatedAt: nowIso() } : r,
    ),
  };
}

export function deleteStandardRow(store: CurriculumStandardsStore, id: string): CurriculumStandardsStore {
  return { ...store, rows: store.rows.filter((r) => r.id !== id) };
}
