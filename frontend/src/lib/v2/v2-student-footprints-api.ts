/**
 * V2 学生成长足迹前端 API 封装
 * 对应 GET /v2/student/footprints
 */
import { buildApiUrl, buildCoreApiReadHeaders, type CoreApiActor } from "@/lib/core-api-shared";

export type FootprintStatusType = "completed" | "pending_review" | "in_progress";

export type StudentFootprintItem = {
  seqId: string;
  expId: string;
  expName: string;
  teacherName: string;
  submitDate: string | null;
  markResult: string | null;
  markComments: string | null;
  status: FootprintStatusType;
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

export function fetchStudentFootprints(actor: CoreApiActor): Promise<StudentFootprintItem[]> {
  return v2Get<StudentFootprintItem[]>("/v2/student/footprints", actor);
}
