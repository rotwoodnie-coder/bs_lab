/**
 * V2 系统主数据模块类型定义
 * 对应表：sys_org / sys_user / sys_user_role / sys_msg / sys_log
 */

// ─── 枚举 ────────────────────────────────────────────────
export type V2Status = "y" | "n";
export type V2UserStatus = "y" | "n";
export type V2ReadTag = "0" | "1";

export type V2RolePermAction = "view" | "edit" | "delete" | "manage";
export type V2RolePermRecord = {
  moduleId: string;
  resourceId: string;
  action: V2RolePermAction;
  enabled: 0 | 1;
};

// ─── 组织 sys_org ────────────────────────────────────────
export interface SysOrgRecord {
  orgId: string;
  orgName: string;
  orgTypeId: string | null;
  gradeId: string | null;
  /** 学校类组织在 `sys_org_school_grade` 中的开设年级（多选）；班级仍用 `gradeId`。 */
  schoolGradeIds: string[];
  parentOrgId: string | null;
  orgPath: string | null;
  status: V2Status | null;
  sortOrder: number | null;
  createUserId: string | null;
  createTime: string | null;
  updateUserId: string | null;
  updateTime: string | null;
  isDeleted: 0 | 1;
}

export interface CreateSysOrgInput {
  /** 可选：人工指定 `org_id`（1–32 位字母数字下划线）；缺省时由 `orgName` 自动生成英文可辨识主键。 */
  orgId?: string;
  orgName: string;
  orgTypeId?: string;
  gradeId?: string;
  /** 学校类：写入 `sys_org_school_grade`（与 `gradeId` 二选一语义，由业务层区分节点类型）。 */
  schoolGradeIds?: string[];
  parentOrgId?: string;
  orgPath?: string;
  status?: V2Status;
  sortOrder?: number;
}

/** PATCH 可更新字段（允许改父级，后台会同步 org_path）。 */
export type UpdateSysOrgInput = {
  orgName?: string;
  orgTypeId?: string | null;
  gradeId?: string | null;
  parentOrgId?: string | null;
  /** 出现则整包替换关联表行（含空数组表示清空）；学校节点建议同时置 `gradeId` 为 null。 */
  schoolGradeIds?: string[];
  status?: V2Status;
  sortOrder?: number;
};

export type SysOrgListQuery = {
  keyword?: string;
  orgTypeId?: string;
  parentOrgId?: string;
  status?: V2Status;
};

// ─── 用户 sys_user ───────────────────────────────────────
export interface SysUserRecord {
  userId: string;
  userName: string;
  userOrgId: string | null;
  userRoleId: string | null;
  userLogo: string | null;
  userNickName: string | null;
  loginName: string;
  userPhone: string | null;
  userEmail: string | null;
  expireDate: string | null;
  comments: string | null;
  status: V2UserStatus | null;
  lastLoginTime: string | null;
  prefTitleId: string | null;
  perResume: string | null;
  perScore: number;
  createUserId: string | null;
  createTime: string | null;
  updateUserId: string | null;
  updateTime: string | null;
  isDeleted: 0 | 1;
}

/** 安全暴露给 API 层（不含密码字段）*/
export type SysUserSafeRecord = Omit<SysUserRecord, never> & {
  orgName?: string;
  roleName?: string;
  prefTitleName?: string;
};

export interface CreateSysUserInput {
  /** 可选：人工指定 `user_id`（1–32 位字母数字下划线）；缺省时由 `userName`/`loginName` 自动生成。 */
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
  status?: V2UserStatus;
  comments?: string;
}

export interface UpdateSysUserInput extends Partial<Omit<CreateSysUserInput, "loginPwd">> {
  loginPwd?: string;
}

export type SysUserListQuery = {
  keyword?: string;
  userOrgId?: string;
  userRoleId?: string;
  status?: V2UserStatus;
  page?: number;
  pageSize?: number;
};

export type SysUserListPage = {
  items: SysUserSafeRecord[];
  total: number;
  page: number;
  pageSize: number;
};

// ─── 用户角色关联 sys_user_role ──────────────────────────
export interface SysUserRoleRecord {
  seqId: string;
  userId: string;
  roleId: string;
  orgId: string | null;
  createTime: string | null;
}

// ─── 系统消息 sys_msg ────────────────────────────────────
export interface SysMsgRecord {
  msgId: string;
  receiverUserId: string;
  senderUserId: string | null;
  msgTypeId: string | null;
  msgContent: string;
  readTag: V2ReadTag;
  sendTime: string | null;
  readTime: string | null;
}

export interface SendSysMsgInput {
  receiverUserId: string;
  senderUserId?: string;
  msgTypeId?: string;
  msgContent: string;
}

export type SysMsgListQuery = {
  receiverUserId: string;
  readTag?: V2ReadTag;
  page?: number;
  pageSize?: number;
};

// ─── 系统日志 sys_log ────────────────────────────────────
export interface SysLogRecord {
  logId: string;
  userId: string | null;
  logType: string | null;
  logTime: string | null;
  logDataType: string | null;
  logDataId: string | null;
}

export interface WriteLogInput {
  userId?: string;
  logType: string;
  logDataType?: string;
  logDataId?: string;
}
