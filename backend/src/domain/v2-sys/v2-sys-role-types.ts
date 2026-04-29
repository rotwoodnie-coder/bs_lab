/**
 * V2 系统角色模块类型定义
 * 对应表：data_role（角色字典表，只读）
 *
 * 角色权限由前端硬编码 ROLE_PERMISSIONS_MAP 定义。
 */

import type { V2Status } from "./v2-sys-types.ts";

export interface SysRoleRecord {
  roleId: string;
  roleName: string;
  /** role_code 可能在 data_role 中不存在，降级取 role_id */
  roleCode?: string;
  status: V2Status | null;
  comments: string | null;
  sortOrder: number | null;
  createUserId: string | null;
  createTime: string | null;
  updateUserId: string | null;
  updateTime: string | null;
  isDeleted: 0 | 1;
}

export interface CreateSysRoleInput {
  /** 可选：显式 `role_id`；缺省由 `roleName`/`roleCode` 自动生成。 */
  roleId?: string;
  roleName: string;
  roleCode: string;
  status?: V2Status;
  comments?: string;
  sortOrder?: number;
}

export interface UpdateSysRoleInput extends Partial<CreateSysRoleInput> {}

export type SysRoleListQuery = {
  keyword?: string;
  status?: V2Status;
};
