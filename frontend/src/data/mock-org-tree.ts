import { UserRole } from "@/types/auth";
import type { OrgNode } from "@/types/org";

/** 用三级组织树（区 → 校 → 班） */
export const MOCK_ORG_ROOT: OrgNode = {
  id: "org-district-xh",
  level: "district",
  name: "星海市教育学院",
  children: [
    {
      id: "org-school-east",
      level: "school",
      name: "城东实验小学校区",
      code: "EAST",
      children: [
        { id: "org-class-g1-1", level: "class", name: "三年级（1）班", code: "G3-1" },
        { id: "org-class-g1-2", level: "class", name: "三年级（2）班", code: "G3-2" },
        { id: "org-class-g2-1", level: "class", name: "四年级（1）班", code: "G4-1" },
      ],
    },
    {
      id: "org-school-west",
      level: "school",
      name: "城西附小分校区",
      code: "WEST",
      children: [
        { id: "org-class-west-7a", level: "class", name: "四年级 A 班", code: "G4-A" },
        { id: "org-class-west-7b", level: "class", name: "五年级 B 班", code: "G5-B" },
      ],
    },
  ],
};

export const DEFAULT_ORG_ID_BY_ROLE: Record<UserRole, string> = {
  [UserRole.STUDENT]: "org-class-g1-1",
  [UserRole.PARENT]: "org-class-g1-1",
  [UserRole.TEACHER]: "org-school-east",
  [UserRole.RESEARCHER]: "org-district-xh",
  [UserRole.SCHOOL_ADMIN]: "org-school-east",
  [UserRole.DISTRICT_ADMIN]: "org-district-xh",
  [UserRole.SUPER_ADMIN]: "org-district-xh",
};

export function flattenOrgNodes(root: OrgNode): OrgNode[] {
  const out: OrgNode[] = [root];
  for (const c of root.children ?? []) {
    out.push(...flattenOrgNodes(c));
  }
  return out;
}

export function findOrgPath(root: OrgNode, targetId: string): OrgNode[] | null {
  if (root.id === targetId) return [root];
  for (const c of root.children ?? []) {
    const sub = findOrgPath(c, targetId);
    if (sub) return [root, ...sub];
  }
  return null;
}
