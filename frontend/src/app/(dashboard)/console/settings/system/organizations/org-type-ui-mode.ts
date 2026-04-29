/**
 * 根据 data_org_type.type_name 推断组织节点在 UI 上的年级编辑模式。
 * 字典无结构化标记时用语义关键词匹配；不命中则视为「其他」。
 */
import type { V2OrgTypeId } from "@/lib/v2/v2-org-type-constants";

export type OrgTypeUiMode = "school" | "grade" | "class" | "staff" | "other";

export function resolveOrgTypeUiMode(typeName: string | null | undefined): OrgTypeUiMode {
  if (typeName == null || typeName.trim() === "") return "other";
  const n = typeName.trim();
  if (/(老师|教职工|教师|staff|teacher)/i.test(n)) return "staff";
  if (/(班级|行政班)/.test(n)) return "class";
  if (/(年级|grade)/i.test(n)) return "grade";
  if (/(学校|小学|初中|高中|一贯|完全中学|幼儿园|园|附小|附中|附校)/.test(n)) return "school";
  return "other";
}

export function resolveOrgTypeModeById(orgTypeId: V2OrgTypeId | string | null | undefined): OrgTypeUiMode {
  if (!orgTypeId) return "other";
  switch (orgTypeId) {
    case "Org_School":
    case "Org_School_Campus":
      return "school";
    case "Org_School_Grade":
    case "Org_School_Level":
      return "grade";
    case "Org_School_Class":
      return "class";
    case "Org_Manage":
      return "staff";
    default:
      return "other";
  }
}
