import { createV2ApiService, type V2ApiListPage } from "@/lib/v2/apiService";
import type { CoreApiActor } from "@/lib/core-api-shared";

export type V2ClassItem = {
  orgId: string;
  orgName: string;
  parentOrgId: string | null;
  orgTypeId: string | null;
  gradeId: string | null;
  status: "y" | "n" | null;
  sortOrder: number | null;
  displayOwnerName?: string | null;
  createUserId?: string | null;
  createTime: string | null;
  updateUserId?: string | null;
  updateTime: string | null;
  isDeleted?: 0 | 1;
};

export type V2ClassDetail = V2ClassItem & {
  displayOwnerName: string | null;
};

export type V2ClassQuery = {
  keyword?: string;
  parentOrgId?: string;
  gradeId?: string;
  status?: "y" | "n";
  page?: number;
  pageSize?: number;
};

export type CreateV2ClassInput = {
  orgId?: string;
  orgName: string;
  parentOrgId?: string | null;
  orgTypeId?: string | null;
  gradeId?: string | null;
  status?: "y" | "n" | null;
  sortOrder?: number | null;
};

export type UpdateV2ClassInput = Partial<CreateV2ClassInput>;

const PATH = "/v2/class";

export function fetchV2ClassDetail(actor: CoreApiActor, orgId: string): Promise<V2ClassDetail> {
  return createV2ApiService(actor).get<V2ClassDetail>(`${PATH}/${encodeURIComponent(orgId)}`);
}

export function createV2Class(actor: CoreApiActor, input: CreateV2ClassInput): Promise<V2ClassItem> {
  return createV2ApiService(actor).post<V2ClassItem>(PATH, input);
}

export function patchV2Class(actor: CoreApiActor, orgId: string, input: UpdateV2ClassInput): Promise<V2ClassItem> {
  return createV2ApiService(actor).post<V2ClassItem>(PATH, { ...input, orgId });
}

export function fetchV2ClassListPage(actor: CoreApiActor, query: V2ClassQuery = {}): Promise<V2ApiListPage<V2ClassItem>> {
  return createV2ApiService(actor).get<V2ApiListPage<V2ClassItem>>(PATH, query);
}
