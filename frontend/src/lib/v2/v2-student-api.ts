import { createV2ApiService, type V2ApiListPage } from "@/lib/v2/apiService";
import type { CoreApiActor } from "@/lib/core-api-shared";

export type V2StudentItem = {
  userId: string;
  userName: string;
  loginName: string;
  loginPwd?: string | null;
  userOrgId: string | null;
  userRoleId: string | null;
  userNickName?: string | null;
  userPhone?: string | null;
  userEmail?: string | null;
  expireDate?: string | null;
  prefTitleId?: string | null;
  status: "y" | "n" | null;
  comments?: string | null;
  displayOwnerName?: string | null;
  createUserId?: string | null;
  createTime: string | null;
  updateUserId?: string | null;
  updateTime: string | null;
  isDeleted?: 0 | 1;
};

export type V2StudentDetail = V2StudentItem & { displayOwnerName: string | null };

export type V2StudentQuery = {
  keyword?: string;
  userOrgId?: string;
  userRoleId?: string;
  status?: "y" | "n";
  page?: number;
  pageSize?: number;
};

export type CreateV2StudentInput = {
  userId?: string;
  userName: string;
  loginName: string;
  loginPwd: string;
  userOrgId?: string;
  userRoleId?: string;
  userNickName?: string;
  userPhone?: string;
  userEmail?: string;
  expireDate?: string;
  prefTitleId?: string;
  status?: "y" | "n";
  comments?: string;
};

export type UpdateV2StudentInput = Partial<CreateV2StudentInput>;

const PATH = "/v2/student";

export function fetchV2StudentDetail(actor: CoreApiActor, userId: string): Promise<V2StudentDetail> {
  return createV2ApiService(actor).get<V2StudentDetail>(`${PATH}/${encodeURIComponent(userId)}`);
}

export function createV2Student(actor: CoreApiActor, input: CreateV2StudentInput): Promise<V2StudentItem> {
  return createV2ApiService(actor).post<V2StudentItem>(PATH, input);
}

export function patchV2Student(actor: CoreApiActor, userId: string, input: UpdateV2StudentInput): Promise<V2StudentItem> {
  return createV2ApiService(actor).post<V2StudentItem>(PATH, { ...input, userId });
}

export function fetchV2StudentListPage(actor: CoreApiActor, query: V2StudentQuery = {}): Promise<V2ApiListPage<V2StudentItem>> {
  return createV2ApiService(actor).get<V2ApiListPage<V2StudentItem>>(PATH, query);
}
