import type { CurriculumSubject } from "@/types/curriculum-standard";
export const EXPERIMENT_CATALOG_SUBJECTS: readonly CurriculumSubject[] = [{ id: "catalog-subj-science-list", name: "科学试验列表", description: "按老师提供CSV重构" }] as const;
export const CATALOG_SUGGESTED_GRADE_OPTIONS = ["一年级","二年级","三年级","四年级","五年级","六年级","七年级","八年级","九年级"] as const;
export const CATALOG_ACTIVITY_TYPE_OPTIONS = ["必做"] as const;
