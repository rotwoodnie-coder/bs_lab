/** 教研组/课题组状态：Y-正常, N-禁用 */
export type SubjectGroupStatus = "Y" | "N";

/** 组类型 */
export type SubjectGroupType = "research_group" | "subject_group";

/** subject_group 表记录 */
export type SubjectGroupRecord = {
  groupId: string;
  groupName: string;
  comments: string | null;
  status: SubjectGroupStatus;
  subjectId: string | null;
  ownerId: string | null;
  createUserId: string | null;
  createTime: string | null;
};

/** subject_group_member 表记录 */
export type SubjectGroupMemberRecord = {
  seqId: string;
  groupId: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
  status: SubjectGroupStatus;
  createUserId: string | null;
  createTime: string | null;
};

/** 用户所属组视图（含负责人名） */
export type SubjectGroupMembership = {
  groupId: string;
  groupName: string;
  comments: string | null;
  status: SubjectGroupStatus;
  ownerId: string | null;
  /** 负责人展示名（sys_user.user_name） */
  ownerName: string | null;
  subjectId: string | null;
  createTime: string | null;
};

/** 创建组输入 */
export type CreateSubjectGroupInput = {
  groupName: string;
  comments?: string | null;
  status?: SubjectGroupStatus;
  subjectId?: string | null;
  ownerId?: string | null;
};

/** 更新组输入（所有字段可选） */
export type PatchSubjectGroupInput = {
  groupName?: string;
  comments?: string | null;
  status?: SubjectGroupStatus;
  subjectId?: string | null;
  ownerId?: string | null;
};

/** 教研组管理权限校验参数 */
export type SubjectGroupManagerCheck = {
  userId: string;
  groupId: string;
  role: string;
};
