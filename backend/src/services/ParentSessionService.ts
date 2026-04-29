/**
 * V2 家长会话/报告 Service
 * 家庭实验室：创建、查询、更新会话，创建/查询报告
 */
import type {
  ParentSessionDetail,
  CreateParentSessionInput,
  PatchParentSessionInput,
  CreateParentReportInput,
  ParentReportRecord,
} from "../domain/v2-parent/v2-parent-session-types.ts";
import {
  createParentSession,
  getParentSessionById,
  getParentSessionDetail,
  listParentSessionsByParentUserId,
  patchParentSession,
} from "../infrastructure/repositories/v2-parent-session-repository.ts";
import {
  createParentReport,
  getParentReportBySessionId,
} from "../infrastructure/repositories/v2-parent-report-repository.ts";

export async function createSession(
  input: CreateParentSessionInput,
): Promise<ParentSessionDetail> {
  const record = await createParentSession(input);
  const detail = await getParentSessionDetail(record.sessionId);
  return detail!;
}

export async function getSessionDetail(
  sessionId: string,
): Promise<ParentSessionDetail | null> {
  return getParentSessionDetail(sessionId);
}

export async function listSessionsByParent(
  parentUserId: string,
): Promise<ParentSessionDetail[]> {
  return listParentSessionsByParentUserId(parentUserId);
}

export async function updateSession(
  sessionId: string,
  input: PatchParentSessionInput,
): Promise<void> {
  await patchParentSession(sessionId, input);
}

export async function createReport(
  input: CreateParentReportInput,
): Promise<ParentReportRecord> {
  return createParentReport(input);
}

export async function getReportBySessionId(
  sessionId: string,
): Promise<ParentReportRecord | null> {
  return getParentReportBySessionId(sessionId);
}
