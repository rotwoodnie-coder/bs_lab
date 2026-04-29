import { buildApiUrl, buildCoreApiReadHeaders, buildCoreApiJsonHeaders, type CoreApiActor } from "@/lib/core-api-shared";

export type TeacherAuthorizedClassRow = {
  orgId: string;
  orgName: string;
  subjectId: string | null;
  teacherName: string;
  avatar: string | null;
  subjectName: string | null;
  fullPathName: string;
};

export type TeacherClassRelationInput = { classOrgId: string; subjectId: string };

/**
 * 获取授课班级列表（Teacher_Class 表）。
 * - 普通教师：不传 teacherId，查自身
 * - 管理员：传 teacherId，查指定教师（需 ORG_MANAGE 权限）
 */
export async function getTeacherAuthorizedClasses(
  actor: CoreApiActor,
  subjectId?: string | null,
  teacherId?: string | null,
): Promise<TeacherAuthorizedClassRow[]> {
  const url = new URL(buildApiUrl("/v2/sys-org/teacher-classes"));
  if (subjectId?.trim()) url.searchParams.set("subjectId", subjectId.trim());
  if (teacherId?.trim()) url.searchParams.set("teacherId", teacherId.trim());

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: buildCoreApiReadHeaders(actor),
    credentials: "include",
  });

  const payload = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: { items?: TeacherAuthorizedClassRow[] };
    error?: { message?: string };
  };

  if (!res.ok) {
    const msg = payload.error?.message?.trim();
    throw new Error(
      msg ? `getTeacherAuthorizedClasses failed: ${res.status} — ${msg}` : `getTeacherAuthorizedClasses failed: ${res.status}`,
    );
  }

  return payload.data?.items || [];
}

/** 单条绑定：写入 Teacher_Class（userId + orgId 班级 + subjectId） */
export async function bindTeacherClassRole(
  actor: CoreApiActor,
  body: { userId: string; orgId: string; subjectId: string },
): Promise<void> {
  const res = await fetch(buildApiUrl("/v2/sys-org/teacher-class-bind"), {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    credentials: "include",
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { success?: boolean; error?: { message?: string } };
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error?.message ?? "绑定失败");
  }
}

/** 同步教师授课关系（整包替换 Teacher_Class），需 ORG_MANAGE 权限 */
export async function syncTeacherClasses(
  actor: CoreApiActor,
  teacherId: string,
  relations: TeacherClassRelationInput[],
): Promise<void> {
  const res = await fetch(buildApiUrl("/v2/teacher-class/sync"), {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    credentials: "include",
    body: JSON.stringify({ teacherId, relations }),
  });

  const json = (await res.json()) as { success?: boolean; error?: { message?: string } };
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error?.message ?? "同步授课关系失败");
  }
}

// ─── 新 API：教师课设配置辅助 ─────────────────────────────

export type TeacherSubjectRow = {
  subjectId: string;
  subjectName: string;
};

export type ClassSubjectConflictRow = {
  classOrgId: string;
  subjectId: string;
  conflictTeacherName: string;
};

/**
 * 获取教师在课题组中绑定的可教学科。
 * GET /v2/teacher-class/subjects?teacherId=xxx
 */
export async function fetchTeacherSubjects(
  actor: CoreApiActor,
  teacherId: string,
): Promise<TeacherSubjectRow[]> {
  const url = new URL(buildApiUrl("/v2/teacher-class/subjects"));
  url.searchParams.set("teacherId", teacherId);
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: buildCoreApiReadHeaders(actor),
    credentials: "include",
  });
  const json = (await res.json()) as { success?: boolean; data?: { items?: TeacherSubjectRow[] }; error?: { message?: string } };
  if (!res.ok) throw new Error(json?.error?.message ?? "获取教师可教学科失败");
  return json.data?.items ?? [];
}

/**
 * 获取年级-学科映射（data_school_grade_subject）。
 * GET /v2/teacher-class/grade-subjects
 */
export async function fetchGradeSubjectMap(
  actor: CoreApiActor,
): Promise<Record<string, string[]>> {
  const res = await fetch(new URL(buildApiUrl("/v2/teacher-class/grade-subjects")).toString(), {
    method: "GET",
    headers: buildCoreApiReadHeaders(actor),
    credentials: "include",
  });
  const json = (await res.json()) as { success?: boolean; data?: { map?: Record<string, string[]> }; error?: { message?: string } };
  if (!res.ok) throw new Error(json?.error?.message ?? "获取年级-学科映射失败");
  return json.data?.map ?? {};
}

/**
 * 获取指定年级下班级-学科冲突列表（排除当前教师自身）。
 * GET /v2/teacher-class/conflicts?teacherId=xxx&gradeId=yyy
 */
export async function fetchClassSubjectConflicts(
  actor: CoreApiActor,
  teacherId: string,
  gradeId: string,
): Promise<ClassSubjectConflictRow[]> {
  const url = new URL(buildApiUrl("/v2/teacher-class/conflicts"));
  url.searchParams.set("teacherId", teacherId);
  url.searchParams.set("gradeId", gradeId);
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: buildCoreApiReadHeaders(actor),
    credentials: "include",
  });
  const json = (await res.json()) as { success?: boolean; data?: { items?: ClassSubjectConflictRow[] }; error?: { message?: string } };
  if (!res.ok) throw new Error(json?.error?.message ?? "获取班级-学科冲突失败");
  return json.data?.items ?? [];
}
