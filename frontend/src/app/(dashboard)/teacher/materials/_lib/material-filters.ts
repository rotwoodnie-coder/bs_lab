import type { TeacherMaterialItem } from "@/lib/teacher-materials-api";

export type KindFilterId = "all" | string;

export function filterTeacherMaterials(
  items: TeacherMaterialItem[],
  kindFilter: KindFilterId,
  keyword: string,
): TeacherMaterialItem[] {
  const q = keyword.trim().toLowerCase();
  return items.filter((m) => {
    if (kindFilter !== "all" && m.kind !== kindFilter) return false;
    if (!q) return true;
    const hay = [m.title, m.originalFilename ?? "", m.experimentId ?? "", m.linkedExperimentTitle ?? ""]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}
