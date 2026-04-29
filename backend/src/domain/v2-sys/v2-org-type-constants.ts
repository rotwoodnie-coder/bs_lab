/**
 * 与 `database/migrations/bs_exp_data.sql` 中 `sys_org.org_type_id` / `data_org_type` 对齐；与前端同名文件须完全一致。
 * UI 遍历说明：`docs/platform/sys-org-tree-teacher-class.md`（不替代基线 SQL）。
 *
 * 组织树完整层级（初始化后固定，见 `database/seed/insert-org-types-campus-level.sql`）：
 *   Org_Manage（管理教育局/集团）
 *   └── Org_School（顶层学校）
 *        └── Org_School_Campus（校区/分校）
 *             └── Org_School_Level（学段，如小学/初中）
 *                  ├── Org_School_Grade（年级）
 *                  │    └── Org_School_Class（班级）
 *                  └── ...
 */
export const V2_ORG_TYPE_IDS = {
  manage: "Org_Manage",
  school: "Org_School",
  campus: "Org_School_Campus",
  level: "Org_School_Level",
  grade: "Org_School_Grade",
  class: "Org_School_Class",
} as const;

export type V2OrgTypeId = (typeof V2_ORG_TYPE_IDS)[keyof typeof V2_ORG_TYPE_IDS];

export const V2_ORG_TYPE_ID_SET = new Set<string>(Object.values(V2_ORG_TYPE_IDS));
