import type { ExperimentDetail } from "@/types/experiment";

/** 是否已配置可运行的在线模拟（有有效嵌入入口） */
export function isOnlineSimulationReady(detail: Pick<ExperimentDetail, "simulationConfig">): boolean {
  const c = detail.simulationConfig;
  if (c == null) return false;
  const src = typeof c.embedSrc === "string" ? c.embedSrc.trim() : "";
  return src.length > 0;
}
