const SUBJECT_EXACT_CODE_MAP: Record<string, string> = {
  科学: "SCIENCE",
  物理: "PHYSICS",
  化学: "CHEMISTRY",
  生物: "BIOLOGY",
  地理: "GEOGRAPHY",
  历史: "HISTORY",
  政治: "POLITICS",
  信息技术: "INFORMATION_TECHNOLOGY",
  信息科技: "INFORMATION_TECHNOLOGY",
  通用技术: "GENERAL_TECHNOLOGY",
  劳动: "LABOR",
  音乐: "MUSIC",
  美术: "ART",
  体育: "PHYSICAL_EDUCATION",
  数学: "MATHEMATICS",
  语文: "CHINESE",
  英语: "ENGLISH",
  道德与法治: "MORALITY_AND_RULE_OF_LAW",
  心理健康: "MENTAL_HEALTH",
  综合实践: "COMPREHENSIVE_PRACTICE",
  STEAM: "STEAM",
  AI: "AI",
};

const SUBJECT_KEYWORD_CODE_MAP: Array<{ keyword: string; token: string }> = [
  { keyword: "信息", token: "INFORMATION" },
  { keyword: "技术", token: "TECHNOLOGY" },
  { keyword: "地理", token: "GEOGRAPHY" },
  { keyword: "历史", token: "HISTORY" },
  { keyword: "政治", token: "POLITICS" },
  { keyword: "科学", token: "SCIENCE" },
  { keyword: "物理", token: "PHYSICS" },
  { keyword: "化学", token: "CHEMISTRY" },
  { keyword: "生物", token: "BIOLOGY" },
  { keyword: "数学", token: "MATHEMATICS" },
  { keyword: "英语", token: "ENGLISH" },
  { keyword: "语文", token: "CHINESE" },
  { keyword: "美术", token: "ART" },
  { keyword: "音乐", token: "MUSIC" },
  { keyword: "体育", token: "PHYSICAL_EDUCATION" },
  { keyword: "劳动", token: "LABOR" },
  { keyword: "心理", token: "MENTAL" },
  { keyword: "健康", token: "HEALTH" },
  { keyword: "综合", token: "COMPREHENSIVE" },
  { keyword: "实践", token: "PRACTICE" },
];

export function generateSubjectCodeFromName(name: string): string {
  const raw = name.trim();
  if (!raw) return "";
  if (SUBJECT_EXACT_CODE_MAP[raw]) return `SUB_${SUBJECT_EXACT_CODE_MAP[raw]}`;

  const tokens: string[] = [];
  for (let i = 0; i < SUBJECT_KEYWORD_CODE_MAP.length; i++) {
    const item = SUBJECT_KEYWORD_CODE_MAP[i];
    if (!item) continue;
    if (raw.includes(item.keyword) && !tokens.includes(item.token)) tokens.push(item.token);
  }
  if (tokens.length > 0) return `SUB_${tokens.join("_")}`;

  const ascii = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  if (ascii) return `SUB_${ascii}`;

  const fallback = raw
    .split("")
    .slice(0, 8)
    .map((ch) => ch.charCodeAt(0).toString(16).toUpperCase())
    .join("_");
  return `SUB_${fallback}`;
}

