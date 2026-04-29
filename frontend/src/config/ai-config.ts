/**
 * AI 实验导师：人格 × 学段后缀，供 Console 策略页与学生端引导 **同源**（Mock）。
 * 后端接入时可将本结构映射为 `GET/PUT /api/v1/agent/config` 的字段子集。
 */

export type TutorPersonaId = "neutral" | "professor" | "whiz" | "coach";

export type GradeBand = "G1_3" | "G4_6" | "G7_9" | "G10_12";

export const TUTOR_PERSONA_OPTIONS: readonly {
  id: TutorPersonaId;
  label: string;
  hint: string;
}[] = [
  { id: "neutral", label: "中性实验助教", hint: "清晰、短句，少人格化修辞，适合默认校。" },
  { id: "professor", label: "严谨的老教授", hint: "术语准确、强调证据与安全，偏高年级。" },
  { id: "whiz", label: "幽默的实验小达人", hint: "类比与生活梗，语气轻松，偏低年级。" },
  { id: "coach", label: "鼓励型探究伙伴", hint: "多肯定与追问，突出「想法—方法—做法」脚手架。" },
] as const;

/** 与实验详情 `gradeLabel`（如「高一」）粗映射，仅前端 */
export function inferGradeBandFromLabel(gradeLabel: string): GradeBand {
  const s = gradeLabel.trim();
  if (/^[一二三四五六]年级|小学|低年级/.test(s) || /[1-3]年级/.test(s)) return "G1_3";
  if (/[四五六]年级|[4-6]年级/.test(s)) return "G4_6";
  if (/初|七|八|九|7|8|9/.test(s)) return "G7_9";
  return "G10_12";
}

const BAND_SUFFIX: Record<GradeBand, string> = {
  G1_3: "受众为小学低年级：请多用比喻与短句，单次引导不超过 50 字，强调安全与兴趣。",
  G4_6: "受众为小学高年级：可引入简单科学用语，单次引导不超过 80 字，强调步骤顺序。",
  G7_9: "受众为初中：强调变量与证据，单次引导不超过 120 字，提示对照与安全。",
  G10_12: "受众为高中：强调模型、测量与误差，单次引导不超过 160 字，对接课标表述。",
};

const PERSONA_PREFIX: Record<TutorPersonaId, string> = {
  neutral: "【语气】中性、简洁。",
  professor: "【语气】严谨、重证据与规范。",
  whiz: "【语气】轻松幽默，可用生活类比。",
  coach: "【语气】鼓励式追问，引导说出想法—方法—做法。",
};

/**
 * 拼接为可挂在系统 Prompt 后的后缀（）；API 接入时等价字段可存 `prompt_suffix`。
 */
export function buildMentorPromptSuffix(persona: TutorPersonaId, band: GradeBand): string {
  return `${PERSONA_PREFIX[persona]} ${BAND_SUFFIX[band]}`;
}

/** localStorage 键，与 `console/ai/strategies` 共用 */
export const TUTOR_PERSONA_STORAGE_KEY = "bs-lab:ai-tutor-persona-mock-v1";

export function readStoredTutorPersona(): TutorPersonaId {
  if (typeof window === "undefined") return "neutral";
  try {
    const v = window.localStorage.getItem(TUTOR_PERSONA_STORAGE_KEY);
    if (v && TUTOR_PERSONA_OPTIONS.some((o) => o.id === v)) return v as TutorPersonaId;
  } catch {
    /* ignore */
  }
  return "neutral";
}
