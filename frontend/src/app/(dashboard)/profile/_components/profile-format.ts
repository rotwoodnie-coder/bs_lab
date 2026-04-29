export function formatNullable(v: string | null | undefined): string {
  const s = (v ?? "").trim();
  return s.length ? s : "—";
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatParts(d: Date): { date: string; dateTime: string } {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  const date = `${yyyy}-${mm}-${dd}`;
  return { date, dateTime: `${date} ${hh}:${mi}:${ss}` };
}

/** 仅日期：YYYY-MM-DD（用于 expire_date 等） */
export function formatDate(v: string | null | undefined): string {
  const s = (v ?? "").trim();
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return formatParts(d).date;
}

/** 日期时间：YYYY-MM-DD HH:mm:ss */
export function formatDateTime(v: string | null | undefined): string {
  const s = (v ?? "").trim();
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return formatParts(d).dateTime;
}

