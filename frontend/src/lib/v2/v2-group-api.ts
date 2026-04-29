import { buildApiUrl, buildCoreApiJsonHeaders, buildCoreApiReadHeaders, type CoreApiActor } from "@/lib/core-api-shared";

export type SubjectGroupRecord = {
  groupId: string;
  groupName: string;
  comments: string | null;
  status: "Y" | "N";
  subjectId: string | null;
  ownerId: string | null;
  createUserId: string | null;
  createTime: string | null;
  updateUserId: string | null;
  updateTime: string | null;
};

export type SubjectGroupMemberRecord = {
  seqId: string;
  groupId: string;
  userId: string;
  status: "Y" | "N";
  createUserId: string | null;
  createTime: string | null;
  updateUserId: string | null;
  updateTime: string | null;
};

async function v2Get<T>(path: string, actor: CoreApiActor): Promise<T> {
  const res = await fetch(buildApiUrl(path), { headers: buildCoreApiReadHeaders(actor), credentials: "include" });
  const json = await res.json() as { success: boolean; data: T; error: { message: string } | null };
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

async function v2Post<T>(path: string, actor: CoreApiActor, body: unknown): Promise<T> {
  const res = await fetch(buildApiUrl(path), { method: "POST", headers: buildCoreApiJsonHeaders(actor), body: JSON.stringify(body), credentials: "include" });
  const json = await res.json() as { success: boolean; data: T; error: { message: string } | null };
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

async function v2Patch<T>(path: string, actor: CoreApiActor, body: unknown): Promise<T> {
  const res = await fetch(buildApiUrl(path), { method: "PATCH", headers: buildCoreApiJsonHeaders(actor), body: JSON.stringify(body), credentials: "include" });
  const json = await res.json() as { success: boolean; data: T; error: { message: string } | null };
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

async function v2Delete<T>(path: string, actor: CoreApiActor): Promise<T> {
  const res = await fetch(buildApiUrl(path), { method: "DELETE", headers: buildCoreApiReadHeaders(actor), credentials: "include" });
  const json = await res.json() as { success: boolean; data: T; error: { message: string } | null };
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

export function fetchSubjectGroups(actor: CoreApiActor): Promise<SubjectGroupRecord[]> { return v2Get("/api/group", actor); }
export function fetchSubjectGroupById(actor: CoreApiActor, groupId: string): Promise<SubjectGroupRecord> { return v2Get(`/api/group/${encodeURIComponent(groupId)}`, actor); }
export function createSubjectGroup(actor: CoreApiActor, input: { group_name: string; comments?: string | null; status?: "Y" | "N"; subject_id?: string | null; owner_id?: string | null }): Promise<SubjectGroupRecord> { return v2Post("/api/group", actor, input); }
export function patchSubjectGroup(actor: CoreApiActor, groupId: string, input: Partial<{ group_name: string; comments: string | null; status: "Y" | "N"; subject_id: string | null; owner_id: string | null }>): Promise<SubjectGroupRecord> { return v2Patch(`/api/group/${encodeURIComponent(groupId)}`, actor, input); }
export function transferSubjectGroupOwner(actor: CoreApiActor, groupId: string, newOwnerId: string): Promise<SubjectGroupRecord> { return v2Post("/api/group/transfer", actor, { group_id: groupId, new_owner_id: newOwnerId }); }
export function fetchSubjectGroupMembers(actor: CoreApiActor, groupId: string): Promise<SubjectGroupMemberRecord[]> { return v2Get(`/api/group/${encodeURIComponent(groupId)}/members`, actor); }
export function addSubjectGroupMember(actor: CoreApiActor, groupId: string, userId: string): Promise<SubjectGroupMemberRecord> { return v2Post("/api/group/members", actor, { group_id: groupId, user_id: userId }); }
export function removeSubjectGroupMember(actor: CoreApiActor, seqId: string): Promise<{ deleted: boolean }> { return v2Delete(`/api/group/members/${encodeURIComponent(seqId)}`, actor); }
