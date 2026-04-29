import type { CoreApiActor } from "@/lib/core-api-shared";
import { createV2ApiService } from "@/lib/v2/apiService";

export type SysRoleRecord = {
  roleId: string;
  roleName: string;
  roleCode: string;
  status: string | null;
  comments: string | null;
  sortOrder: number | null;
};

export async function listSysRoles(actor: CoreApiActor): Promise<SysRoleRecord[]> {
  return createV2ApiService(actor).get<SysRoleRecord[]>("/v2/sys-role");
}
