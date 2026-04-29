/**
 * 行政班（组织树 / 校管）与教师侧 adminClassId（作业、学情）的映射 — Mock 真源。
 */

/** 组织树「班级」节点 id → 教师侧 TEACHER_MOCK_CLASSES.id */
export const ORG_CLASS_NODE_TO_ADMIN_CLASS_ID: Record<string, string> = {
  "g3-c1": "c1",
  "g3-c2": "c2",
  "g4-c1": "c3",
};

export function adminClassIdFromOrgClassNode(orgClassNodeId: string): string | undefined {
  return ORG_CLASS_NODE_TO_ADMIN_CLASS_ID[orgClassNodeId];
}

export function orgClassNodeIdFromAdminClassId(adminClassId: string): string | undefined {
  const hit = Object.entries(ORG_CLASS_NODE_TO_ADMIN_CLASS_ID).find(([, v]) => v === adminClassId);
  return hit?.[0];
}
