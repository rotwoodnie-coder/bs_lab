import { SUBJECT_CASCADE } from "@/data/subject-tree";
import type { V2DictGradeItem, V2DictItem } from "@/lib/v2/v2-exp-api";
import type { EducationPhase, SubjectDiscipline } from "@/types/subject";

const PHASE_LEVEL_HINT: Record<EducationPhase, string> = {
  primary: "小学",
  junior: "初中",
  senior: "高中",
};

/**
 * 将「实验选择」多选学段 / 学科 / 年级（年级为 UI code）解析为 V2 列表查询用逗号 id 串
 *（`/v2/exp-library` 与 `/v2/exp` 共用 shape：`subject_ids` / `grade_ids` / `school_level_ids`）。
 * 约定：数组为空表示该维度**不限**（不传对应 IN 条件）。
 */
export function resolveExpListFilterQueryIds(input: {
  phases: EducationPhase[];
  disciplines: SubjectDiscipline[];
  gradeCodes: string[];
  subjects: V2DictItem[];
  grades: V2DictGradeItem[];
  levels: V2DictItem[];
}): { subject_ids?: string; grade_ids?: string; school_level_ids?: string } {
  const out: { subject_ids?: string; grade_ids?: string; school_level_ids?: string } = {};

  const phases = input.phases.length ? input.phases : null;
  const discSet = new Set(input.disciplines);
  const useAllDisciplines = input.disciplines.length === 0;
  const gradeCodeSet = new Set(input.gradeCodes);
  const useAllGrades = input.gradeCodes.length === 0;

  const cascadePhases = phases ? SUBJECT_CASCADE.filter((p) => phases.includes(p.phase)) : [...SUBJECT_CASCADE];

  if (phases && phases.length > 0) {
    const levelIds = new Set<string>();
    for (const ph of phases) {
      const hint = PHASE_LEVEL_HINT[ph];
      const row = input.levels.find((l) => String(l.name ?? "").includes(hint));
      const id = row?.id ? String(row.id).trim().slice(0, 32) : "";
      if (id) levelIds.add(id);
    }
    if (levelIds.size > 0) out.school_level_ids = [...levelIds].join(",");
  }

  if (!useAllDisciplines) {
    const subjectIds = new Set<string>();
    for (const ph of cascadePhases) {
      for (const d of ph.disciplines) {
        if (!discSet.has(d.discipline)) continue;
        const dLabel = String(d.label ?? "").trim();
        const sid = input.subjects.find((s) => String(s.name ?? "").trim() === dLabel)?.id?.trim().slice(0, 32);
        if (sid) subjectIds.add(sid);
      }
    }
    if (subjectIds.size > 0) out.subject_ids = [...subjectIds].join(",");
  }

  if (!useAllGrades) {
    const gradeIds = new Set<string>();
    for (const ph of cascadePhases) {
      for (const d of ph.disciplines) {
        if (!useAllDisciplines && !discSet.has(d.discipline)) continue;
        for (const g of d.grades) {
          if (!gradeCodeSet.has(g.code)) continue;
          const gLabel = String(g.label ?? "").trim();
          const gr = input.grades.find((x) => String(x.name ?? "").trim() === gLabel);
          const gid = gr?.id ? String(gr.id).trim().slice(0, 32) : "";
          if (gid) gradeIds.add(gid);
        }
      }
    }
    if (gradeIds.size > 0) out.grade_ids = [...gradeIds].join(",");
  }

  return out;
}
