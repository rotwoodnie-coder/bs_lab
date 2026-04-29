import { buildApiUrl, buildCoreApiJsonHeaders, buildCoreApiReadHeaders, type CoreApiActor } from "@/lib/core-api-shared";

type Envelope<T> = { success?: boolean; data?: T; error?: { message?: string } };

async function parse<T>(res: Response): Promise<T> {
  const json = (await res.json().catch(() => ({}))) as Envelope<T>;
  if (!res.ok || json.success === false) throw new Error(json.error?.message ?? `请求失败（HTTP ${res.status}）`);
  return (json.data ?? ({} as T)) as T;
}

/** 后端返回的家长任务条目 */
export type ParentTaskItem = {
  seqId: string;
  workId: string;
  expId: string;
  teacherExpId: string;
  expName: string;
  teacherUserId: string;
  teacherName: string;
  studentUserId: string;
  studentName: string;
  classId: string;
  className: string;
  requireDate: string | null;
  submitDate: string | null;
  markResult: string | null;
  markComments: string | null;
  status: "pending" | "submitted" | "marked";
};

export async function fetchParentTasks(actor: CoreApiActor): Promise<ParentTaskItem[]> {
  const res = await fetch(buildApiUrl("/v2/parent/tasks"), {
    method: "GET",
    headers: buildCoreApiReadHeaders(actor),
    credentials: "include",
  });
  const data = await parse<{ items?: ParentTaskItem[] }>(res);
  return data.items ?? [];
}

/** 后端返回的会话创建响应 */
export type CreateSessionResponse = {
  session: {
    sessionId: string;
    expId: string;
    expName: string;
    studentUserId: string;
    studentName: string;
    teacherName: string | null;
  };
};

export async function postCreateSession(
  actor: CoreApiActor,
  body: { studentUserId: string; expId: string; workId?: string; taskId?: string },
): Promise<CreateSessionResponse> {
  const res = await fetch(buildApiUrl("/v2/parent/sessions"), {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    credentials: "include",
    body: JSON.stringify(body),
  });
  return parse<CreateSessionResponse>(res);
}

export type MyBindingRow = {
  seqId: string;
  parentUserId: string;
  studentUserId: string;
  studentUserName?: string | null;
  classOrgId?: string | null;
  classOrgName?: string | null;
  gradeOrgId?: string | null;
  gradeOrgName?: string | null;
  schoolOrgIdResolved?: string | null;
  schoolOrgName?: string | null;
  auditStatus: "T" | "Y" | "N";
};

export async function fetchMyBindings(actor: CoreApiActor): Promise<MyBindingRow[]> {
  const res = await fetch(buildApiUrl("/v2/parent/my-bindings"), {
    method: "GET",
    headers: buildCoreApiReadHeaders(actor),
    credentials: "include",
  });
  const data = await parse<{ items?: MyBindingRow[] }>(res);
  return data.items ?? [];
}
