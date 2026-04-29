import type { MaterialHazardFlag } from "@/types/experiment-detail";

const KNOWN: Partial<Record<string, string>> = {
  no_taste: "不可品尝",
  no_inhale: "禁止吸入粉尘/烟雾",
  flammable: "易燃",
  corrosive: "腐蚀性",
  toxic: "有毒有害",
  sharp: "尖锐防刺伤",
  eye_protection: "佩戴护目镜",
};

export function hazardFlagLabel(flag: MaterialHazardFlag): string {
  return KNOWN[flag] ?? flag;
}
