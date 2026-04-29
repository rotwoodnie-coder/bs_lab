/**
 * V2 系统日志 API 客户端
 * 对接后端 GET /v2/sys-log 审计日志分页查询
 */
import { buildApiUrl, buildCoreApiReadHeaders, type CoreApiActor } from "@/lib/core-api-shared";

/** 后端 sys_log 原始行记录 */
export interface V2SysLogRecord {
  logId: string;
  userId: string | null;
  userName: string | null;
  logType: string | null;
  logTime: string | null;
  logDataType: string | null;
  logDataId: string | null;
  logDataContent: string | null;
}

export interface V2SysLogListPage {
  items: V2SysLogRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export type V2SysLogQuery = {
  page?: number;
  pageSize?: number;
  keyword?: string;
  logType?: string;
  from?: string;
  to?: string;
};

export async function fetchSysLogList(
  actor: CoreApiActor,
  query: V2SysLogQuery = {},
): Promise<V2SysLogListPage> {
  const url = new URL(buildApiUrl("/v2/sys-log"));
  if (query.page) url.searchParams.set("page", String(query.page));
  if (query.pageSize) url.searchParams.set("pageSize", String(query.pageSize));
  if (query.keyword?.trim()) url.searchParams.set("keyword", query.keyword.trim());
  if (query.logType) url.searchParams.set("logType", query.logType);
  if (query.from) url.searchParams.set("from", query.from);
  if (query.to) url.searchParams.set("to", query.to);

  const res = await fetch(url.toString(), {
    headers: buildCoreApiReadHeaders(actor),
    credentials: "include",
  });
  const json = await res.json() as {
    success: boolean;
    data: V2SysLogListPage;
    error: { message: string } | null;
  };
  if (!json.success) throw new Error(json.error?.message ?? "获取系统日志失败");
  return json.data;
}
