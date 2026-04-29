/**
 * V2 作业模块 API 客户端
 * 对接后端 /v2/homework
 */
import { buildApiUrl, buildCoreApiJsonHeaders, buildCoreApiReadHeaders, type CoreApiActor } from "@/lib/core-api-shared";

// ─── 类型定义 ─────────────────────────────────────────────
export interface V2HomeworkItem {
  workId: string;
  expId: string;
  expName: string;
  teacherUserId: string;
  classId: string;
  requireDate: string | null;
  createTime: string | null;
  updateTime: string | null;
  isDeleted: 0 | 1;
  studentTotal: number;
  submittedCount: number;
  pendingMarkCount: number;
}

export interface V2HomeworkListResult {
  items: V2HomeworkItem[];
  total: number;
}

export type V2HomeworkQuery = {
  teacherUserId?: string;
  classId?: string;
  expId?: string;
  page?: number;
  pageSize?: number;
};

export interface V2HomeworkStudentRecord {
  seqId: string;
  workId: string;
  expId: string;
  teacherUserId: string;
  teacherExpId: string;
  studentUserId: string;
  requireDate: string | null;
  submitDate: string | null;
  markUserId: string | null;
  markTime: string | null;
  markResult: string | null;
  markComments: string | null;
}

export interface CreateHomeworkInput {
  expId: string;
  teacherUserId: string;
  classId: string;
  requireDate?: string;
  studentUserIds?: string[];
}

export interface MarkHomeworkInput {
  markUserId: string;
  markResult: string;
  markComments?: string;
}

// ─── 工具函数 ─────────────────────────────────────────────
async function v2Get<T>(path: string, actor: CoreApiActor, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(buildApiUrl(path));
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), { headers: buildCoreApiReadHeaders(actor), credentials: "include" });
  const json = await res.json() as { success: boolean; data: T; error: { message: string } | null };
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

async function v2Post<T>(path: string, actor: CoreApiActor, body: unknown): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify(body),
    credentials: "include",
  });
  const json = await res.json() as { success: boolean; data: T; error: { message: string } | null };
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

async function v2Patch<T>(path: string, actor: CoreApiActor, body: unknown): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "PATCH",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify(body),
    credentials: "include",
  });
  const json = await res.json() as { success: boolean; data: T; error: { message: string } | null };
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

// ─── 接口 ─────────────────────────────────────────────────
export function fetchV2HomeworkList(actor: CoreApiActor, query: V2HomeworkQuery = {}): Promise<V2HomeworkListResult> {
  return v2Get("/v2/homework", actor, query as Record<string, string | number | undefined>);
}

export function fetchV2HomeworkById(actor: CoreApiActor, workId: string): Promise<V2HomeworkItem> {
  return v2Get(`/v2/homework/${encodeURIComponent(workId)}`, actor);
}

export function fetchV2HomeworkStudents(actor: CoreApiActor, workId: string): Promise<V2HomeworkStudentRecord[]> {
  return v2Get(`/v2/homework/${encodeURIComponent(workId)}/students`, actor);
}

export function createV2Homework(actor: CoreApiActor, input: CreateHomeworkInput): Promise<V2HomeworkItem> {
  return v2Post("/v2/homework", actor, input);
}

export function markV2HomeworkStudent(actor: CoreApiActor, seqId: string, input: MarkHomeworkInput): Promise<{ seqId: string }> {
  return v2Patch(`/v2/homework/students/${encodeURIComponent(seqId)}/mark`, actor, input);
}
