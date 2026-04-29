/**
 * 角色权限页本地类型
 */
import type { SysRoleRecord } from "@/lib/v2/v2-sys-role-api";

/** 角色列表中单个角色的 UI 形态 */
export type RoleItem = SysRoleRecord;

/** 页面可见性：记录单个页面在 7 个角色下的可见性 */
export type PageAccessRow = {
  pageId: string;
  pageLabel: string;
  pageHref: string;
  section: string;
  /** key: `Role_*`，value: 是否对该角色可见 */
  roles: Partial<Record<AuthRole, boolean>>;
};

export type AuthRole =
  | "Role_Sys_Admin"
  | "Role_District_Admin"
  | "Role_School_Admin"
  | "Role_Researcher"
  | "Role_Teacher"
  | "Role_Student"
  | "Role_Parent";

export type UseRolesPageReturn = {
  /** 角色列表（从 data_role 读取） */
  roles: RoleItem[];
  rolesLoading: boolean;
  rolesError: boolean;

  /** 当前选中角色 */
  selectedRoleId: string | null;
  selectedRoleLabel: string;

  /** 页面可见性矩阵 */
  accessMatrix: PageAccessRow[];

  /** 身份治理面板 */
  identityDrawerOpen: boolean;
  setIdentityDrawerOpen: (open: boolean) => void;

  /** 切换选中角色 */
  handleRoleChange: (roleId: string) => void;
};
