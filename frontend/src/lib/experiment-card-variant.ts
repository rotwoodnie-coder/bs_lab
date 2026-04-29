import type { Experiment } from "@/types/experiment";

export type ExperimentCardVisualVariant = "A" | "B" | "C" | "D";

function heatScore(exp: Experiment): number {
  return (exp.viewsCount ?? 0) + (exp.likesCount ?? 0) * 2;
}

function idParityBucket(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h + id.charCodeAt(i) * (i + 1)) % 97;
  }
  return h;
}

/**
 * 实验库 / 列表：物理类走 A（赛博）与 C（数据脉冲）按热度切换；化生走 B/D。
 */
export function experimentCardVariantForGallery(exp: Experiment): ExperimentCardVisualVariant {
  if (exp.scienceDiscipline === "chemistry" || exp.scienceDiscipline === "biology") {
    return idParityBucket(exp.id) % 2 === 0 ? "B" : "D";
  }
  return heatScore(exp) >= 1800 ? "C" : "A";
}

/** 首页「探索实验」发现流：与实验库相同的学科/热度策略 */
export function experimentCardVariantForDiscoveryFeed(exp: Experiment): ExperimentCardVisualVariant {
  return experimentCardVariantForGallery(exp);
}

/** 官方推荐 / 热门轮播：磨砂与全息两档轮换 */
export function experimentCardVariantForOfficialHot(_exp: Experiment, index: number): ExperimentCardVisualVariant {
  return index % 2 === 0 ? "B" : "D";
}
