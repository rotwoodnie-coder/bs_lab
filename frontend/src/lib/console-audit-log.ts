/**
 * 控制台操作审计：结构化分类、风险等级、Payload 对比与可选关键域标记。
 * 持久化 sessionStorage；v2 架构，自 v1 自动迁移。
 */

export type ConsoleAuditCategory = "content" | "hardware" | "security";

export type ConsoleAuditRisk = "info" | "warning" | "critical";

/** 涉及场域设备或耗材台账类变更时可用于置顶（扩展） */
export type ConsoleAuditIotScope = "monitor14" | "spice" | "both";

export type ConsoleAuditLogRow = {
  id: string;
  ts: string;
  actor: string;
  /** 操作人身份（角色展示名） */
  actorRole: string;
  action: string;
  resource: string;
  /** 操作对象 ID */
  targetId: string;
  category: ConsoleAuditCategory;
  risk: ConsoleAuditRisk;
  /** 一句话摘要 */
  summary: string;
  /** 操作前快照（JSON 字符串或可读文本） */
  payloadBefore?: string;
  /** 操作后快照 */
  payloadAfter?: string;
  /** 教研员驳回等场景必填 */
  rejectionReason?: string;
  iotScope?: ConsoleAuditIotScope;
};

/** v1 遗留结构 */
type ConsoleAuditLogRowV1 = {
  id: string;
  actor: string;
  action: string;
  resource: string;
  detail: string;
};

const STORAGE_KEY_V2 = "bs_lab.console_audit_log.v2";
const STORAGE_KEY_V1 = "bs_lab.console_audit_log.v1";

export const AUDIT_CATEGORY_LABEL: Record<ConsoleAuditCategory, string> = {
  content: "内容变动",
  hardware: "硬件控制",
  security: "系统安全",
};

export const AUDIT_RISK_LABEL: Record<ConsoleAuditRisk, string> = {
  info: "Info",
  warning: "Warning",
  critical: "Critical",
};

function inferCategoryV1(resource: string, action: string): ConsoleAuditCategory {
  const r = resource.toLowerCase();
  if (r.includes("rbac") || r.includes("policy") || r.includes("user") || r.includes("account"))
    return "security";
  if (
    r.includes("deploy") ||
    r.includes("job") ||
    r.includes("iot") ||
    r.includes("hardware") ||
    r.includes("monitor")
  )
    return "hardware";
  if (action === "DELETE" && r.includes("review")) return "content";
  return "content";
}

function inferRoleLabelV1(actor: string): string {
  if (actor.includes("super")) return "超级管理员";
  if (actor.includes("district")) return "区级管理员";
  if (actor.includes("school")) return "校级管理员";
  if (actor.includes("researcher")) return "教研员";
  if (actor.includes("console")) return "控制台管理员";
  return "操作账号";
}

function migrateV1(rows: ConsoleAuditLogRowV1[]): ConsoleAuditLogRow[] {
  const now = Date.now();
  return rows.map((l, i) => {
    const category = inferCategoryV1(l.resource, l.action);
    const risk: ConsoleAuditRisk =
      l.action === "DELETE" || category === "security" ? "warning" : "info";
    return {
      id: l.id,
      ts: new Date(now - i * 60_000).toISOString(),
      actor: l.actor,
      actorRole: inferRoleLabelV1(l.actor),
      action: l.action,
      resource: l.resource,
      targetId: l.resource,
      category,
      risk,
      summary: l.detail,
      payloadBefore: undefined,
      payloadAfter: undefined,
    };
  });
}

function buildDefaultSeed(): ConsoleAuditLogRow[] {
  const t0 = Date.now();
  return [
    {
      id: "log-seed-res-1",
      ts: new Date(t0 - 120_000).toISOString(),
      actor: "district_admin",
      actorRole: "区级管理员",
      action: "UPDATE",
      resource: "experiment.catalog",
      targetId: "catalog:physics-grade8",
      category: "content",
      risk: "info",
      summary: "更新实验目录条目可见范围（）",
      payloadBefore: JSON.stringify({ visibility: "school_only" }),
      payloadAfter: JSON.stringify({ visibility: "district" }),
    },
    {
      id: "log-seed-sec-1",
      ts: new Date(t0 - 300_000).toISOString(),
      actor: "district_admin",
      actorRole: "区级管理员",
      action: "UPDATE",
      resource: "rbac.policy",
      targetId: "policy:student_portal",
      category: "security",
      risk: "warning",
      summary: "调整学生门户策略",
      payloadBefore: JSON.stringify({ allowGuestPreview: true }),
      payloadAfter: JSON.stringify({ allowGuestPreview: false }),
    },
    {
      id: "log-seed-content-1",
      ts: new Date(t0 - 400_000).toISOString(),
      actor: "researcher",
      actorRole: "教研员",
      action: "REJECT",
      resource: "experiment.workflow",
      targetId: "exp-002",
      category: "content",
      risk: "warning",
      summary: "评审驳回「酸碱中和探究」",
      payloadBefore: JSON.stringify({ workflowStatus: "in_review", score: 72 }),
      payloadAfter: JSON.stringify({ workflowStatus: "changes_requested", score: 72 }),
      rejectionReason: "步骤三缺少护目镜安全提示；步骤与安全 JSON 需对齐课标要求。",
    },
    {
      id: "log-seed-content-2",
      ts: new Date(t0 - 500_000).toISOString(),
      actor: "researcher",
      actorRole: "教研员",
      action: "APPROVE",
      resource: "experiment.workflow",
      targetId: "exp-001",
      category: "content",
      risk: "info",
      summary: "评审通过「光的折射」",
      payloadBefore: JSON.stringify({ workflowStatus: "in_review", score: 80 }),
      payloadAfter: JSON.stringify({ workflowStatus: "published", score: 85 }),
    },
  ];
}

let cache: ConsoleAuditLogRow[] | null = null;
const listeners = new Set<() => void>();

function readStorage(): ConsoleAuditLogRow[] {
  if (typeof window === "undefined") return buildDefaultSeed();
  try {
    const raw2 = sessionStorage.getItem(STORAGE_KEY_V2);
    if (raw2) {
      const parsed = JSON.parse(raw2) as unknown;
      if (Array.isArray(parsed) && parsed.length) return parsed as ConsoleAuditLogRow[];
    }
    const raw1 = sessionStorage.getItem(STORAGE_KEY_V1);
    if (raw1) {
      const parsed = JSON.parse(raw1) as unknown;
      if (Array.isArray(parsed) && parsed.length) {
        const migrated = migrateV1(parsed as ConsoleAuditLogRowV1[]);
        sessionStorage.setItem(STORAGE_KEY_V2, JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch {
    /* ignore */
  }
  return buildDefaultSeed();
}

function persist(rows: ConsoleAuditLogRow[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY_V2, JSON.stringify(rows.slice(0, 300)));
  } catch {
    /* ignore */
  }
}

function ensureCache(): ConsoleAuditLogRow[] {
  if (!cache) cache = readStorage();
  return cache;
}

export function getConsoleAuditLogs(): ConsoleAuditLogRow[] {
  return [...ensureCache()];
}

export function subscribeConsoleAuditLogs(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  for (const l of listeners) l();
}

export type AppendConsoleAuditInput = Omit<ConsoleAuditLogRow, "id" | "ts" | "risk"> &
  Partial<Pick<ConsoleAuditLogRow, "id" | "ts" | "risk">>;

function buildAuditRow(entry: AppendConsoleAuditInput): ConsoleAuditLogRow {
  const risk: ConsoleAuditRisk = entry.iotScope ? "critical" : (entry.risk ?? "info");
  return {
    id: entry.id ?? `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: entry.ts ?? new Date().toISOString(),
    actor: entry.actor,
    actorRole: entry.actorRole,
    action: entry.action,
    resource: entry.resource,
    targetId: entry.targetId,
    category: entry.category,
    risk,
    summary: entry.summary,
    payloadBefore: entry.payloadBefore,
    payloadAfter: entry.payloadAfter,
    rejectionReason: entry.rejectionReason,
    iotScope: entry.iotScope,
  };
}

export function appendConsoleAuditLog(entry: AppendConsoleAuditInput): ConsoleAuditLogRow {
  const row = buildAuditRow(entry);
  const next = [row, ...ensureCache()];
  cache = next;
  persist(next);
  notify();
  return row;
}

/** IoT 相关行置顶，其余按时间倒序 */
export function sortAuditLogsForDisplay(rows: ConsoleAuditLogRow[]): ConsoleAuditLogRow[] {
  return [...rows].sort((a, b) => {
    const pa = a.iotScope ? 0 : 1;
    const pb = b.iotScope ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return new Date(b.ts).getTime() - new Date(a.ts).getTime();
  });
}

function startOfLocalDay(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function isTimestampInRange(ts: string, fromMs: number, toMs: number): boolean {
  const t = new Date(ts).getTime();
  return t >= fromMs && t <= toMs;
}

export type ConsoleAuditStats = {
  todayTotal: number;
  anomalyAlerts: number;
  activeAdmins: number;
};

const ADMIN_ROLE_PATTERN = /管理员|超管|控制台/;

export function computeConsoleAuditStats(logs: ConsoleAuditLogRow[]): ConsoleAuditStats {
  const now = new Date();
  const dayStart = startOfLocalDay(now);
  const dayEnd = dayStart + 86_400_000;

  const todayLogs = logs.filter((l) => isTimestampInRange(l.ts, dayStart, dayEnd));
  const todayTotal = todayLogs.length;
  const anomalyAlerts = todayLogs.filter((l) => l.risk === "warning" || l.risk === "critical").length;

  const adminActors = new Set<string>();
  for (const l of todayLogs) {
    if (ADMIN_ROLE_PATTERN.test(l.actorRole)) adminActors.add(l.actor);
  }
  const activeAdmins = adminActors.size;

  return { todayTotal, anomalyAlerts, activeAdmins };
}

export type AuditTimePreset = "all" | "today" | "7d" | "30d";

export function filterLogsByTimePreset(logs: ConsoleAuditLogRow[], preset: AuditTimePreset): ConsoleAuditLogRow[] {
  if (preset === "all") return logs;
  const now = Date.now();
  let from = 0;
  if (preset === "today") from = startOfLocalDay(new Date());
  else if (preset === "7d") from = now - 7 * 86_400_000;
  else if (preset === "30d") from = now - 30 * 86_400_000;
  return logs.filter((l) => new Date(l.ts).getTime() >= from);
}
