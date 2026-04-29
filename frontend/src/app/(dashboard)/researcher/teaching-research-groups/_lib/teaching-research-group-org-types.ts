/**
 * 教研组管理列表：按 `sys_org.org_type_id` 聚合展示。
 * 与迁移脚本 `iam_org_nodes.org_type` → `sys_org.org_type_id` 的常见取值对齐。
 */
export const TEACHING_RESEARCH_GROUP_ORG_TYPE_IDS = ["research_group", "department"] as const;

export type TeachingResearchGroupOrgTypeId = (typeof TEACHING_RESEARCH_GROUP_ORG_TYPE_IDS)[number];
