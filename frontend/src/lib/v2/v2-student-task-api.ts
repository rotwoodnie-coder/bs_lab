/**
 * V2 学生任务前端 API 封装
 * 对应 GET /v2/student/tasks, POST /v2/student/tasks/:seqId/submit
 */
import { buildApiUrl, buildCoreApiJsonHeaders, buildCoreApiReadHeaders, type CoreApiActor } from "@/lib/core-api-shared";

export type StudentTaskStatus = "pending" | "submitted" | "marked";

export type StudentTaskItem = {
  seqId: string;
  workId: string;
  expId: string;
  teacherExpId: string;
  expName: string;
  teacherUserId: string;
  teacherName: string;
  classId: string;
  requireDate: string | null;
  submitDate: string | null;
  markResult: string | null;
  markComments: string | null;
  status: StudentTaskStatus;
};

async function v2Get<T>(path: string, actor: CoreApiActor): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    headers: buildCoreApiReadHeaders(actor),
    credentials: "include",
  });
  const json = (await res.json()) as {
    success: boolean;
    data: T;
    error: { message: string } | null;
  };
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

async function v2Post<T>(path: string, actor: CoreApiActor, body?: unknown): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  const json = (await res.json()) as {
    success: boolean;
    data: T;
    error: { message: string } | null;
  };
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

export function fetchStudentTasks(actor: CoreApiActor): Promise<StudentTaskItem[]> {
  return v2Get<StudentTaskItem[]>("/v2/student/tasks", actor);
}

export function submitStudentTask(actor: CoreApiActor, seqId: string): Promise<{ seqId: string }> {
  return v2Post<{ seqId: string }>(`/v2/student/tasks/${encodeURIComponent(seqId)}/submit`, actor);
}
