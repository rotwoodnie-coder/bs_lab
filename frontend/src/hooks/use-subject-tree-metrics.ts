/**
 * Hook: useSubjectTreeMetrics
 *
 * 统一管理学科树的各级统计数量。
 * 将后端 flat 的 bySubject / byGradeSubject 映射为 SubjectSelectionTree 所需的
 * per-phase / per-discipline / per-leaf 回调结构。
 *
 * 使用方式：
 * ```tsx
 * const { metrics, loading } = useSubjectTreeMetrics(actor, fetchV2ExpStats);
 * <SubjectSelectionTree metrics={metrics} ... />
 * ```
 */
import * as React from "react";
import type { CoreApiActor } from "@/lib/core-api-shared";
import type { SubjectPath } from "@/lib/subject-taxonomy";
import type { EducationPhase } from "@/types/subject";

type SubjectMetrics = {
  count?: number;
  attention?: boolean;
};

export type ExpStatsData = {
  total: number;
  bySubject: Record<string, number>;
  byGradeSubject: Record<string, number>;
};

export type StatsFetcher = (actor: CoreApiActor) => Promise<ExpStatsData>;

type SubjectTreeMetrics = {
  phase?: (phase: EducationPhase) => SubjectMetrics;
  discipline?: (nodeId: string) => SubjectMetrics;
  leaf?: (leaf: SubjectPath) => SubjectMetrics;
};

export function useSubjectTreeMetrics(
  actor: CoreApiActor | null,
  fetcher: StatsFetcher | null,
): { metrics: SubjectTreeMetrics | undefined; loading: boolean } {
  const [stats, setStats] = React.useState<ExpStatsData | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!actor || !fetcher) {
      setStats(null);
      return;
    }
    setLoading(true);
    fetcher(actor)
      .then(setStats)
      .catch(() => { setStats(null); })
      .finally(() => setLoading(false));
  }, [actor, fetcher]);

  const metrics = React.useMemo<SubjectTreeMetrics | undefined>(() => {
    if (!stats) return undefined;

    const { bySubject, byGradeSubject } = stats;

    const phase: SubjectTreeMetrics["phase"] = (phase) => {
      const prefix = `${phase}-`;
      let count = 0;
      for (const [subjectId, c] of Object.entries(bySubject)) {
        if (subjectId.startsWith(prefix)) count += c;
      }
      return { count: count > 0 ? count : undefined };
    };

    const discipline: SubjectTreeMetrics["discipline"] = (nodeId) => {
      const c = bySubject[nodeId];
      return c != null && c > 0 ? { count: c } : {};
    };

    const leaf: SubjectTreeMetrics["leaf"] = (leafPath) => {
      const key = `${leafPath.nodeId}::${leafPath.gradeCode}`;
      const c = byGradeSubject[key];
      return c != null && c > 0 ? { count: c } : {};
    };

    return { phase, discipline, leaf };
  }, [stats]);

  return { metrics, loading };
}
