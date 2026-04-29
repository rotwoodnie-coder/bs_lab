import type { Experiment, ExperimentScienceDiscipline } from "@/types/experiment";

export function resolveScienceDiscipline(ex: Experiment): ExperimentScienceDiscipline {
  return ex.scienceDiscipline ?? "physics";
}

/** 无封面图时的学科品牌渐变（物化生），仅用语义化 token。 */
export function experimentCoverPlaceholderClass(ex: Experiment): string {
  const d = resolveScienceDiscipline(ex);
  switch (d) {
    case "chemistry":
      return "bg-gradient-to-br from-chart-2/35 via-chart-4/25 to-primary/15";
    case "biology":
      return "bg-gradient-to-br from-chart-3/35 via-chart-5/25 to-muted/30";
    default:
      return "bg-gradient-to-br from-chart-1/35 via-primary/25 to-chart-5/15";
  }
}
