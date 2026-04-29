import { buildApiUrl, buildCoreApiJsonHeaders, buildCoreApiReadHeaders, type CoreApiActor } from "@/lib/core-api-shared";

type Envelope<T> = { success?: boolean; data?: T; error?: { message?: string } };

async function parse<T>(res: Response): Promise<T> {
  const raw = await res.text().catch(() => "");
  let json: Envelope<T> | null = null;
  if (raw) {
    try {
      json = JSON.parse(raw) as Envelope<T>;
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    const msg = json?.error?.message ?? raw.trim() || `请求失败（HTTP ${res.status}）`;
    throw new Error(msg === "服务内部错误" ? "家长实验室数据暂时不可用，请稍后重试" : msg);
  }
  if (json && json.success === false) {
    const msg = json.error?.message ?? `请求失败（HTTP ${res.status}）`;
    throw new Error(msg === "服务内部错误" ? "家长实验室数据暂时不可用，请稍后重试" : msg);
  }
  return ((json?.data ?? ({} as T)) as T);
}

/** 后端会话详情（含关联报告） */
export type ParentSessionDetail = {
  sessionId: string;
  parentUserId: string;
  studentUserId: string;
  expId: string;
  workId: string | null;
  taskId: string | null;
  guideStyle: "gentle" | "rigorous" | "playful";
  parentAttestedAt: string | null;
  errorCount: number;
  materialShortageReported: number;
  evaluationStatus: "none" | "evaluated";
  teacherComment: string | null;
  teacherStarRating: number | null;
  completionStatus: "in_progress" | "completed";
  createTime: string;
  expName: string;
  studentName: string;
  teacherName: string | null;
  report: ParentReportRecord | null;
};

/** 后端报告记录 */
export type ParentReportRecord = {
  reportId: string;
  sessionId: string;
  summary: string | null;
  strengths: string[];
  improvements: string[];
  nextRecommendations: string[];
  shareCopy: string | null;
  teacherComment: string | null;
  createTime: string;
};

/** 列表会话（含详情） */
export type ParentSessionListItem = ParentSessionDetail;

export async function fetchParentSessions(actor: CoreApiActor): Promise<ParentSessionListItem[]> {
  const res = await fetch(buildApiUrl("/v2/parent/sessions"), {
    method: "GET",
    headers: buildCoreApiReadHeaders(actor),
    credentials: "include",
  });
  const data = await parse<{ items?: ParentSessionListItem[] }>(res);
  return data.items ?? [];
}

export async function fetchParentSessionDetail(actor: CoreApiActor, sessionId: string): Promise<ParentSessionDetail> {
  const res = await fetch(buildApiUrl(`/v2/parent/sessions/${encodeURIComponent(sessionId)}`), {
    method: "GET",
    headers: buildCoreApiReadHeaders(actor),
    credentials: "include",
  });
  const data = await parse<{ session?: ParentSessionDetail }>(res);
  if (!data.session) throw new Error("会话不存在");
  return data.session;
}

export async function patchParentSession(
  actor: CoreApiActor,
  sessionId: string,
  body: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(buildApiUrl(`/v2/parent/sessions/${encodeURIComponent(sessionId)}`), {
    method: "PATCH",
    headers: buildCoreApiJsonHeaders(actor),
    credentials: "include",
    body: JSON.stringify(body),
  });
  await parse<unknown>(res);
}

export async function fetchParentReport(actor: CoreApiActor, sessionId: string): Promise<ParentReportRecord> {
  const url = new URL(buildApiUrl("/v2/parent/reports"));
  url.searchParams.set("sessionId", sessionId);
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: buildCoreApiReadHeaders(actor),
    credentials: "include",
  });
  const data = await parse<{ report?: ParentReportRecord }>(res);
  if (!data.report) throw new Error("报告未生成");
  return data.report;
}

export async function postCreateParentReport(
  actor: CoreApiActor,
  body: {
    sessionId: string;
    summary: string;
    strengths?: string[];
    improvements?: string[];
    nextRecommendations?: string[];
    shareCopy?: string;
    teacherComment?: string;
  },
): Promise<ParentReportRecord> {
  const res = await fetch(buildApiUrl("/v2/parent/reports"), {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await parse<{ report?: ParentReportRecord }>(res);
  return data.report!;
}

/** 将后端的 ParentReportRecord 适配为 ScienceAchievementCard 所需的格式 */
export function adaptReportForCard(
  report: ParentReportRecord,
): {
  id: string;
  sessionId: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  nextRecommendations: string[];
  shareCopy?: string;
  createdAt: string;
  teacherComment?: string;
} {
  return {
    id: report.reportId,
    sessionId: report.sessionId,
    summary: report.summary ?? "",
    strengths: report.strengths,
    improvements: report.improvements,
    nextRecommendations: report.nextRecommendations,
    shareCopy: report.shareCopy ?? undefined,
    createdAt: report.createTime,
    teacherComment: report.teacherComment ?? undefined,
  };
}
