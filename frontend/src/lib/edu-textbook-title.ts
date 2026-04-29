/**
 * 复制教材时生成不与同学科已有 title 冲突的新书名（与后端 `duplicate-title` 规则一致）。
 * 配合数据库 UNIQUE(tenant_id, app_id, subject_id, title) 避免静默覆盖。
 */
export function nextTextbookDuplicateTitle(originalTitle: string, takenTitles: readonly string[]): string {
  const set = new Set(takenTitles.map((t) => t.trim()));
  const base = originalTitle.trim();
  let n = 1;
  let candidate = `${base} (副本)`;
  while (set.has(candidate)) {
    n += 1;
    candidate = `${base} (副本${n})`;
  }
  return candidate;
}
