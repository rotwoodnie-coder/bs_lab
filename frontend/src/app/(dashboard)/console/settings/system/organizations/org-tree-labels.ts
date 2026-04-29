import { V2_ORG_TYPE_IDS } from "@/lib/v2/v2-org-type-constants";

const schoolLikeIds = [V2_ORG_TYPE_IDS.school, V2_ORG_TYPE_IDS.campus];
const gradeOrClassIds = [V2_ORG_TYPE_IDS.grade, V2_ORG_TYPE_IDS.level, V2_ORG_TYPE_IDS.class];

export function orgTypeBadgeVariant(orgTypeId: string | null): "default" | "secondary" | "outline" {
  if (!orgTypeId) return "outline";
  if (orgTypeId === V2_ORG_TYPE_IDS.manage) return "default";
  if (schoolLikeIds.includes(orgTypeId)) return "secondary";
  if (gradeOrClassIds.includes(orgTypeId)) return "outline";
  return "outline";
}

const schoolIconIds = [V2_ORG_TYPE_IDS.school, V2_ORG_TYPE_IDS.campus];
const classIconIds = [V2_ORG_TYPE_IDS.grade, V2_ORG_TYPE_IDS.level, V2_ORG_TYPE_IDS.class];

export function orgTypeIconName(orgTypeId: string | null): "district" | "school" | "class" | "other" {
  if (!orgTypeId) return "other";
  if (orgTypeId === V2_ORG_TYPE_IDS.manage) return "district";
  if (schoolIconIds.includes(orgTypeId)) return "school";
  if (classIconIds.includes(orgTypeId)) return "class";
  return "other";
}

export function orgTypeShortLabel(labels: Record<string, string>, orgTypeId: string | null): string {
  if (!orgTypeId) return "—";
  return labels[orgTypeId] ?? orgTypeId;
}
