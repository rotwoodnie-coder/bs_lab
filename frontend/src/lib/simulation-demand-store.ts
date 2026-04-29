export type SimulationDevTaskStatus = "pending_review" | "in_development" | "live";

export type SimulationDevTask = {
  experimentId: string;
  title: string;
  subjectLabel: string;
  requestCount: number;
  urgency: number;
  status: SimulationDevTaskStatus;
  lastRequestedAt?: string;
};

/** 需求日志：仅进程内缓存，不做浏览器持久化（全站真实性）。 */
export const SIMULATION_REQUESTS_STORAGE_KEY = "simulation_requests";

export type SimulationRequestLogEntry = {
  experimentId: string;
  requestedAt: string;
};

const requestLog: SimulationRequestLogEntry[] = [];
const submittedOnce = new Set<string>();

export function readSimulationRequestLog(): SimulationRequestLogEntry[] {
  return [...requestLog];
}

export function hasTeacherSubmittedSimulationDemand(experimentId: string): boolean {
  return submittedOnce.has(experimentId);
}

export const SIMULATION_DEMAND_CHANGED_EVENT = "bs-lab-simulation-demand-changed";

type StoredExperiment = {
  requestCount: number;
  status: SimulationDevTaskStatus;
  urgency: number;
  lastRequestedAt?: string;
};

const store: Record<string, StoredExperiment> = {};

function defaultForId(id: string): StoredExperiment {
  return {
    requestCount: 0,
    status: "pending_review",
    urgency: 2,
    lastRequestedAt: undefined,
  };
}

function mergeExperiment(id: string, prev?: StoredExperiment): StoredExperiment {
  const base = defaultForId(id);
  if (!prev) return { ...base };
  return {
    requestCount: Math.max(prev.requestCount, base.requestCount),
    status: prev.status ?? base.status,
    urgency: prev.urgency ?? base.urgency,
    lastRequestedAt: prev.lastRequestedAt ?? base.lastRequestedAt,
  };
}

/** 教师端提交需求（同一浏览器同一实验仅计票一次，总数含种子） */
export function submitTeacherSimulationDemand(experimentId: string): { totalTeachers: number; newlyCounted: boolean } {
  const already = submittedOnce.has(experimentId);
  const merged = mergeExperiment(experimentId, store[experimentId]);
  if (!already) {
    submittedOnce.add(experimentId);
    merged.requestCount += 1;
    merged.lastRequestedAt = new Date().toISOString();
    store[experimentId] = merged;
    requestLog.push({ experimentId, requestedAt: merged.lastRequestedAt });
    if (typeof window !== "undefined") window.dispatchEvent(new Event(SIMULATION_DEMAND_CHANGED_EVENT));
    return { totalTeachers: merged.requestCount, newlyCounted: true };
  }
  return { totalTeachers: merged.requestCount, newlyCounted: false };
}

export function updateSimulationDevTask(
  experimentId: string,
  patch: Partial<Pick<StoredExperiment, "status" | "urgency">>,
): void {
  const cur = mergeExperiment(experimentId, store[experimentId]);
  if (patch.status != null) cur.status = patch.status;
  if (patch.urgency != null) cur.urgency = Math.min(5, Math.max(1, Math.round(patch.urgency)));
  store[experimentId] = cur;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SIMULATION_DEMAND_CHANGED_EVENT));
}

export function listSimulationDevTasks(): SimulationDevTask[] {
  const ids = Object.keys(store);

  const tasks: SimulationDevTask[] = [];
  for (const id of ids) {
    const merged = mergeExperiment(id, store[id]);
    if (merged.requestCount <= 0) continue;

    tasks.push({
      experimentId: id,
      title: id,
      subjectLabel: "—",
      requestCount: merged.requestCount,
      urgency: merged.urgency,
      status: merged.status,
      lastRequestedAt: merged.lastRequestedAt,
    });
  }

  tasks.sort((a, b) => {
    if (b.requestCount !== a.requestCount) return a.requestCount - b.requestCount;
    return b.urgency - a.urgency;
  });
  return tasks;
}

export function simulationDemandHeatTotal(tasks: SimulationDevTask[]): number {
  return tasks.reduce((s, t) => s + t.requestCount, 0);
}

/** 管理看板：将 1–5 档 urgency 映射为三档优先级文案 */
export function simulationUrgencyTierLabel(urgency: number): "紧急" | "高" | "中" {
  if (urgency >= 5) return "紧急";
  if (urgency >= 4) return "高";
  return "中";
}

export function simulationTaskStatusLabel(s: SimulationDevTaskStatus): string {
  switch (s) {
    case "pending_review":
      return "待评审";
    case "in_development":
      return "开发中";
    case "live":
      return "已上线";
    default:
      return s;
  }
}
