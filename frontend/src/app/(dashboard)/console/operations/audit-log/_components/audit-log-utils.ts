import type { ConsoleAuditCategory, ConsoleAuditLogRow, ConsoleAuditRisk } from "@/lib/console-audit-log";
import type { V2SysLogRecord } from "@/lib/v2/v2-sys-log-api";

export function riskBadgeVariant(risk: ConsoleAuditRisk): "secondary" | "warning" | "destructive" {
  if (risk === "critical") return "destructive";
  if (risk === "warning") return "warning";
  return "secondary";
}

/** 从后端 SysLogRecord 推断前端 risk 等级 */
export function inferRisk(logType: string | null, logDataType: string | null): ConsoleAuditRisk {
  const lt = (logType ?? "").toUpperCase();
  const dt = (logDataType ?? "").toLowerCase();
  if (lt.includes("DELETE") || lt.includes("REJECT") || dt.includes("security")) return "warning";
  if (lt.includes("ERROR") || lt.includes("CRITICAL")) return "critical";
  return "info";
}

/** 从后端 SysLogRecord 推断前端 category */
export function inferCategory(logType: string | null, logDataType: string | null): ConsoleAuditCategory {
  const dt = (logDataType ?? "").toLowerCase();
  const lt = (logType ?? "").toLowerCase();
  if (dt.includes("hardware") || lt.includes("hardware")) return "hardware";
  if (dt.includes("security") || lt.includes("security") || lt.includes("delete")) return "security";
  return "content";
}

/** 将后端记录转为前端展示行 */
export function toAuditRow(r: V2SysLogRecord): ConsoleAuditLogRow {
  const logDataType = r.logDataType ?? "";
  const summary = (() => {
    try {
      if (r.logDataContent) {
        const parsed = JSON.parse(r.logDataContent) as Record<string, unknown>;
        return String(parsed.detail ?? parsed.errorType ?? r.logDataContent);
      }
    } catch { /* not JSON, use raw */ }
    return r.logDataContent ?? "";
  })();
  return {
    id: r.logId,
    ts: r.logTime ?? "",
    actor: r.userName ?? r.userId ?? "未知",
    actorRole: "操作员",
    action: r.logType ?? "",
    resource: logDataType,
    targetId: r.logDataId ?? "",
    category: inferCategory(r.logType, logDataType),
    risk: inferRisk(r.logType, logDataType),
    summary: summary.slice(0, 200),
    payloadBefore: undefined,
    payloadAfter: undefined,
  };
}
