/**
 * V2 审核 API 客户端
 * 对接后端 /v2/review/*（学生作品审核、实验审核、课题组审核）
 */
import { buildApiUrl, buildCoreApiJsonHeaders, buildCoreApiReadHeaders, type CoreApiActor } from "@/lib/core-api-shared";

// ─── 类型 ─────────────────────────────────────────────────

/** 审核状态：t 待审核, y 已通过, n 已驳回 */
export type ReviewStatus = "t" | "y" | "n";

export interface StudentWorkReviewItem {
  expId: string;
  expName: string;
  status: ReviewStatus | null;
  createUserType: "Student" | null;
  createUserId: string | null;
  /** JOIN sys_user.user_name */
  displayOwnerName?: string | null;
  createTime: string | null;
  confirmUserId: string | null;
  confirmTime: string | null;
  confirmComments: string | null;
  rejectReason: string | null;
  subjectId: string | null;
  schoolLevelId: string | null;
  gradeId: string | null;
  likeNum: number;
  collectionNum: number;
}

export interface ResearchGroupReviewItem {
  groupId: string;
  groupName: string;
  reviewStatus: ReviewStatus;
  reviewUserId: string | null;
  reviewTime: string | null;
  reviewComments: string | null;
  rejectReason: string | null;
  ownerId: string | null;
  ownerName: string | null;
  comments: string | null;
  createTime: string | null;
}

export interface ReviewListResponse<T> {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
}

// ─── 学生作品审核 ─────────────────────────────────────────

/**
 * GET /v2/review/student-works
 */
export async function fetchStudentWorksForReview(
  actor: CoreApiActor,
  page = 1,
  pageSize = 20,
): Promise<ReviewListResponse<StudentWorkReviewItem>> {
  const url = buildApiUrl(`/v2/review/student-works?page=${page}&page_size=${pageSize}`);
  const res = await fetch(url, { headers: buildCoreApiReadHeaders(actor) });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `请求失败 ${res.status}`);
  }
  const json = await res.json();
  return json.data as ReviewListResponse<StudentWorkReviewItem>;
}

/**
 * POST /v2/review/student-works/approve
 */
export async function approveStudentWork(
  actor: CoreApiActor,
  expId: string,
  confirmComments?: string | null,
): Promise<void> {
  const url = buildApiUrl("/v2/review/student-works/approve");
  const res = await fetch(url, {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify({ exp_id: expId, confirm_comments: confirmComments ?? null }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `请求失败 ${res.status}`);
  }
}

/**
 * POST /v2/review/student-works/reject
 */
export async function rejectStudentWork(
  actor: CoreApiActor,
  expId: string,
  rejectReason: string,
): Promise<void> {
  const url = buildApiUrl("/v2/review/student-works/reject");
  const res = await fetch(url, {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify({ exp_id: expId, reject_reason: rejectReason }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `请求失败 ${res.status}`);
  }
}

// ─── 课题组审核 ─────────────────────────────────────────

/**
 * GET /v2/review/research-groups
 */
export async function fetchResearchGroupsForReview(
  actor: CoreApiActor,
): Promise<ReviewListResponse<ResearchGroupReviewItem>> {
  const url = buildApiUrl("/v2/review/research-groups");
  const res = await fetch(url, { headers: buildCoreApiReadHeaders(actor) });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `请求失败 ${res.status}`);
  }
  const json = await res.json();
  return json.data as ReviewListResponse<ResearchGroupReviewItem>;
}

/**
 * POST /v2/review/research-groups/approve
 */
export async function approveResearchGroup(
  actor: CoreApiActor,
  groupId: string,
): Promise<void> {
  const url = buildApiUrl("/v2/review/research-groups/approve");
  const res = await fetch(url, {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify({ group_id: groupId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `请求失败 ${res.status}`);
  }
}

/**
 * POST /v2/review/research-groups/reject
 */
export async function rejectResearchGroup(
  actor: CoreApiActor,
  groupId: string,
  rejectReason: string,
): Promise<void> {
  const url = buildApiUrl("/v2/review/research-groups/reject");
  const res = await fetch(url, {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify({ group_id: groupId, reject_reason: rejectReason }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `请求失败 ${res.status}`);
  }
}
