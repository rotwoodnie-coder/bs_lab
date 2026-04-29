const UNITS: { ms: number; label: string }[] = [
  { ms: 86400000, label: "天" },
  { ms: 3600000, label: "小时" },
  { ms: 60000, label: "分钟" },
];

function parseDate(input: string): Date | null {
  const s = input.trim();
  if (!s) return null;
  const iso = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 将常见 `YYYY-MM-DD HH:mm:ss` 转为简短中文相对时间。 */
export function formatRelativeTimeZh(input: string | null | undefined): string {
  if (input == null || input === "") return "—";
  const then = parseDate(input);
  if (!then) return input;
  const diff = Date.now() - then.getTime();
  if (diff < 0) return "刚刚";
  if (diff < 60000) return "刚刚";
  for (const u of UNITS) {
    if (diff >= u.ms) {
      const n = Math.floor(diff / u.ms);
      return `${n}${u.label}前`;
    }
  }
  return "刚刚";
}
