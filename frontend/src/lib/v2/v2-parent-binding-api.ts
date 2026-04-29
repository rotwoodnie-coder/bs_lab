import { buildApiUrl, buildCoreApiJsonHeaders, buildCoreApiReadHeaders, type CoreApiActor } from "@/lib/core-api-shared";

type Envelope<T> = { success?: boolean; data?: T; error?: { message?: string } };

async function parse<T>(res: Response): Promise<T> {
  const json = (await res.json().catch(() => ({}))) as Envelope<T>;
  if (!res.ok || json.success === false) throw new Error(json.error?.message ?? `请求失败（HTTP ${res.status}）`);
  return (json.data ?? ({} as T)) as T;
}

export type OrgLite = { orgId: string; orgName: string };

/** 组织树节点（学校选择树用，仅包含 manage / school / campus 类型） */
export type SchoolTreeNode = {
  orgId: string;
  orgName: string;
  parentOrgId: string | null;
  orgTypeId: string;
};

export type VerifyStudentCandidate = {
  studentUserId: string;
  studentUserName: string;
  maskedLoginName: string | null;
};

export async function fetchParentSchoolTree(actor: CoreApiActor): Promise<SchoolTreeNode[]> {
  const res = await fetch(buildApiUrl("/v2/parent/school-tree"), { method: "GET", headers: buildCoreApiReadHeaders(actor), credentials: "include" });
  const data = await parse<{ items?: SchoolTreeNode[] }>(res);
  return data.items ?? [];
}

export async function fetchParentSchools(actor: CoreApiActor): Promise<OrgLite[]> {
  const res = await fetch(buildApiUrl("/v2/parent/schools"), { method: "GET", headers: buildCoreApiReadHeaders(actor), credentials: "include" });
  const data = await parse<{ items?: OrgLite[] }>(res);
  return data.items ?? [];
}

export async function fetchParentGrades(actor: CoreApiActor, schoolOrgId: string): Promise<OrgLite[]> {
  const url = new URL(buildApiUrl("/v2/parent/grades"));
  url.searchParams.set("schoolOrgId", schoolOrgId);
  const res = await fetch(url.toString(), { method: "GET", headers: buildCoreApiReadHeaders(actor), credentials: "include" });
  const data = await parse<{ items?: OrgLite[] }>(res);
  return data.items ?? [];
}

export async function fetchParentClasses(actor: CoreApiActor, gradeOrgId: string): Promise<OrgLite[]> {
  const url = new URL(buildApiUrl("/v2/parent/classes"));
  url.searchParams.set("gradeOrgId", gradeOrgId);
  const res = await fetch(url.toString(), { method: "GET", headers: buildCoreApiReadHeaders(actor), credentials: "include" });
  const data = await parse<{ items?: OrgLite[] }>(res);
  return data.items ?? [];
}

export async function postVerifyStudent(actor: CoreApiActor, body: { classOrgId: string; studentName: string }): Promise<VerifyStudentCandidate[]> {
  const res = await fetch(buildApiUrl("/v2/parent/verify-student"), {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await parse<{ candidates?: VerifyStudentCandidate[] }>(res);
  return data.candidates ?? [];
}

export async function postBindApply(actor: CoreApiActor, body: { classOrgId: string; studentUserId: string }): Promise<void> {
  const res = await fetch(buildApiUrl("/v2/parent/bind-apply"), {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    credentials: "include",
    body: JSON.stringify(body),
  });
  await parse<unknown>(res);
}

export type MyBindingRow = {
  seqId: string;
  parentUserId: string;
  studentUserId: string;
  schoolOrgId: string;
  createTime: string;
  auditStatus: "T" | "Y" | "N";
  auditUserId: string | null;
  auditComments: string | null;
  auditTime: string | null;
  studentUserName?: string | null;
  classOrgId?: string | null;
  classOrgName?: string | null;
  gradeOrgId?: string | null;
  gradeOrgName?: string | null;
  schoolOrgIdResolved?: string | null;
  schoolOrgName?: string | null;
};

export async function fetchMyBindings(actor: CoreApiActor): Promise<MyBindingRow[]> {
  const res = await fetch(buildApiUrl("/v2/parent/my-bindings"), { method: "GET", headers: buildCoreApiReadHeaders(actor), credentials: "include" });
  const data = await parse<{ items?: MyBindingRow[] }>(res);
  return data.items ?? [];
}

export type PendingBindingRow = MyBindingRow & { parentUserName?: string | null; parentLoginName?: string | null };

export async function fetchAuditPending(actor: CoreApiActor): Promise<PendingBindingRow[]> {
  const res = await fetch(buildApiUrl("/v2/parent/audit/pending"), { method: "GET", headers: buildCoreApiReadHeaders(actor), credentials: "include" });
  const data = await parse<{ items?: PendingBindingRow[] }>(res);
  return data.items ?? [];
}

export async function postAudit(actor: CoreApiActor, body: { seqId: string; auditStatus: "Y" | "N"; auditComments?: string | null }): Promise<void> {
  const res = await fetch(buildApiUrl("/v2/parent/audit"), {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    credentials: "include",
    body: JSON.stringify(body),
  });
  await parse<unknown>(res);
}

