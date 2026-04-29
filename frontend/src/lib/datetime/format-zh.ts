export type DateInput = Date | string | number | null | undefined;

function parseDate(input: DateInput): Date | null {
  if (input == null) return null;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function fmtUnified(d: Date): string {
  const Y = d.getFullYear();
  const M = pad2(d.getMonth() + 1);
  const D = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${Y}-${M}-${D} ${hh}:${mm}`;
}

/**
 * 时间展示规范（全站统一）
 * - 统一格式：YYYY-MM-DD HH:mm
 */
export function formatZhDate(input: DateInput): string {
  const d = parseDate(input);
  return d ? fmtUnified(d) : "—";
}

export function formatZhDateTime(input: DateInput): string {
  const d = parseDate(input);
  return d ? fmtUnified(d) : "—";
}

export function formatZhDateTimeSeconds(input: DateInput): string {
  const d = parseDate(input);
  return d ? fmtUnified(d) : "—";
}
