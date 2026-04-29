"use client";

/**
 * 家长端「引导节奏」档位（动态调优 / 精准适配），与 `ai-config` 中导师人格 **叠加** 使用。
 * 存储键名按产品指令：`ai_guidance_style`。
 */

export type AiGuidanceStyleId = "light" | "balanced" | "strong";

export const AI_GUIDANCE_STYLE_STORAGE_KEY = "ai_guidance_style";
let inMemoryStyle: AiGuidanceStyleId = "balanced";

export const AI_GUIDANCE_STYLE_OPTIONS: readonly {
  id: AiGuidanceStyleId;
  label: string;
  /** 中性表述：调节 AI 输出节奏，不对孩子做标签化评价 */
  description: string;
}[] = [
  {
    id: "light",
    label: "更放手",
    description: "安全提醒仅在关键节点；原理说明偏短句，鼓励孩子自己说观察。",
  },
  {
    id: "balanced",
    label: "平衡",
    description: "安全与步骤常规提醒；原理与操作说明并重。",
  },
  {
    id: "strong",
    label: "强提醒",
    description: "操作前多一次安全确认；原理分层展开，强调规范表述。",
  },
] as const;

export function readAiGuidanceStyle(): AiGuidanceStyleId {
  return inMemoryStyle;
}

export function writeAiGuidanceStyle(id: AiGuidanceStyleId): void {
  inMemoryStyle = id;
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("bs-lab-ai-guidance-style"));
}

/**
 * 与 `console/ai/strategies` 所用导师人格后缀 **拼接** 的约束片段（Mock，可进未来 system prompt）。
 * 映射维度：安全预警频率、原理解析深度（文案层）。
 */
export function buildAiGuidanceStylePromptConstraint(style: AiGuidanceStyleId): string {
  switch (style) {
    case "light":
      return "【引导节奏·更放手】安全预警：关键节点提醒；原理解析：短句要点，优先让孩子复述现象。";
    case "balanced":
      return "【引导节奏·平衡】安全预警：随步骤常规提醒；原理解析：现象与步骤对照说明。";
    case "strong":
      return "【引导节奏·强提醒】安全预警：操作前前置检查更密；原理解析：分层展开，强调规范与安全用语。";
  }
}
