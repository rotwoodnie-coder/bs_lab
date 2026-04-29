import type { UserRole } from "@/types/auth";

/** 组织层级：区（教育学院）→ 校（分校区）→ 班（年级/行政班） */
export type OrgLevel = "district" | "school" | "class";

/**
 * 组织树节点（与权限范围、实验下发目标对齐）。
 */
export interface OrgNode {
  id: string;
  level: OrgLevel;
  name: string;
  /** 校区编码、年级代码等展示用元信息 */
  code?: string;
  children?: OrgNode[];
}

/**
 * 当前会话用户与组织挂载关系（后续可与 JWT / 会话接口对齐）。
 */
export interface UserContext {
  /** 当前生效组织节点 id（可为区级、校级或班级） */
  orgId: string;
  role: UserRole;
}
