import type { ExperimentFillPayload, FillStrategy } from "@/types/experiment-link";

function isEmptyValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * 数组字段合并去重配置。
 * [payloadKey, currentKey]：payload 对象中的去重键 → 当前 store 中的对应去重键。
 *
 * 两边数据均为 Draft 类型（ExperimentStepDraft / ExperimentMaterialDraft 等），
 * 因此 payloadKey 与 currentKey 相同。
 *
 * - steps: 按 title（步骤标题）去重
 * - materials: 按 libraryMaterialId（材料库 ID）去重
 * - resultEntries: 按 title（结果标题）去重
 * - referenceCitations: 按 citedExperimentTitle（引用标题）去重
 * - scientistStories: 按 scientistName（科学家名称）去重
 */
const ARRAY_DEDUP_KEYS: Record<string, [payloadKey: string, currentKey: string]> = {
  materials: ["libraryMaterialId", "libraryMaterialId"],
  steps: ["title", "title"],
  resultEntries: ["title", "title"],
  referenceCitations: ["citedExperimentTitle", "citedExperimentTitle"],
  scientistStories: ["scientistName", "scientistName"],
};

/**
 * 合并两个数组：将 source 中的条目追加到 target，依据指定键去重。
 */
function mergeArrays(
  target: unknown[],
  source: unknown[],
  payloadKey: string,
  currentKey: string,
): unknown[] {
  if (source.length === 0) return target;

  // 从 target（当前 store 数据）中收集去重键集合
  const existingKeys = new Set<string>();
  for (const item of target) {
    const key = String((item as Record<string, unknown>)[currentKey] ?? "").trim().toLowerCase();
    if (key) existingKeys.add(key);
  }

  // 过滤 source 中新增的条目
  const newItems: unknown[] = [];
  for (const item of source) {
    const key = String((item as Record<string, unknown>)[payloadKey] ?? "").trim().toLowerCase();
    if (key && existingKeys.has(key)) continue;
    // 无键可比较的条目（如本地创建的 item），始终追加
    if (!key) {
      newItems.push(item);
      continue;
    }
    existingKeys.add(key);
    newItems.push(item);
  }

  if (newItems.length === 0) return target;
  return [...target, ...newItems];
}

export function applyAutofillToForm<T extends Record<string, any>>(
  current: T,
  payload: ExperimentFillPayload,
  strategy: FillStrategy,
): T {
  if (strategy === "ask") return current;
  const next = { ...current } as Record<string, any>;

  for (const [key, value] of Object.entries(payload)) {
    if (strategy === "replace") {
      next[key] = value;
      continue;
    }

    if (strategy === "mergeIfEmpty" && isEmptyValue(next[key])) {
      next[key] = value;
      continue;
    }

    if (strategy === "merge") {
      const dedup = ARRAY_DEDUP_KEYS[key];
      if (Array.isArray(value) && dedup) {
        // 数组字段：追加 + 去重
        const currentArr = Array.isArray(next[key]) ? (next[key] as unknown[]) : [];
        next[key] = mergeArrays(currentArr, value as unknown[], dedup[0], dedup[1]);
      } else if (Array.isArray(value)) {
        // 未配置去重的数组字段：直接追加
        const currentArr = Array.isArray(next[key]) ? (next[key] as unknown[]) : [];
        next[key] = [...currentArr, ...(value as unknown[])];
      } else if (isEmptyValue(next[key])) {
        // 非数组空字段：填充
        next[key] = value;
      }
      // 非数组非空字段：保留原值
    }
  }

  return next as T;
}
