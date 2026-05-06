import type { V2DictGradeItem, V2DictItem, V2GradeSubjectItem } from "@/lib/v2/v2-exp-api";
import type { EducationPhase, SubjectDiscipline } from "@/types/subject";

const PHASE_LABEL: Record<EducationPhase, string> = {
  primary: "小学",
  junior: "初中",
  senior: "高中",
};

const PHASE_DISCIPLINE_HINT: Record<EducationPhase, SubjectDiscipline[]> = {
  primary: ["science"],
  junior: ["physics", "chemistry", "biology"],
  senior: ["physics", "chemistry", "biology"],
};

function phaseOfGradeCode(code: string): EducationPhase | null {
  if (code.startsWith("P")) return "primary";
  if (code.startsWith("J")) return "junior";
  if (code.startsWith("S")) return "senior";
  return null;
}

export function resolveExpListFilterQueryIds(input: {
  phases: EducationPhase[];
  disciplines: SubjectDiscipline[];
  gradeCodes: string[];
  subjects: V2DictItem[];
  grades: V2DictGradeItem[];
  levels: V2DictItem[];
  gradeSubjects: V2GradeSubjectItem[];
}): { subject_ids?: string; grade_ids?: string; school_level_ids?: string } {
  const out: { subject_ids?: string; grade_ids?: string; school_level_ids?: string } = {};
  const phaseSet = new Set(input.phases);
  const discSet = new Set(input.disciplines);
  const gradeCodeSet = new Set(input.gradeCodes);
  const gradeByCode = new Map(input.grades.map((g) => [String(g.name ?? "").trim(), g] as const));
  const subjectByName = new Map(input.subjects.map((s) => [String(s.name ?? "").trim(), s.id] as const));
  const levelByName = new Map(input.levels.map((lv) => [String(lv.name ?? "").trim(), lv.id] as const));

  const allowedGradeIds = new Set<string>();
  const allowedSubjectIds = new Set<string>();

  if (phaseSet.size > 0) {
    const levelIds = [...phaseSet]
      .map((ph) => levelByName.get(PHASE_LABEL[ph]) ?? null)
      .filter((v): v is string => Boolean(v));
    if (levelIds.length > 0) out.school_level_ids = [...new Set(levelIds)].join(",");
  }

  if (discSet.size > 0) {
    const hints = [...phaseSet].length > 0 ? [...phaseSet].flatMap((ph) => PHASE_DISCIPLINE_HINT[ph]) : null;
    for (const subj of input.subjects) {
      const name = String(subj.name ?? "").trim();
      const matchedByHint = hints ? hints.includes(name as SubjectDiscipline) : true;
      if (!matchedByHint) continue;
      if (discSet.has(name as SubjectDiscipline)) allowedSubjectIds.add(subj.id);
    }
    if (allowedSubjectIds.size > 0) out.subject_ids = [...allowedSubjectIds].join(",");
  }

  if (gradeCodeSet.size > 0) {
    const relationPairs = new Set(input.gradeSubjects.map((gs) => `${gs.subjectId}::${gs.gradeId}`));
    for (const gradeCode of gradeCodeSet) {
      const grade = gradeByCode.get(gradeCode);
      if (!grade) continue;
      const gradePhase = phaseOfGradeCode(gradeCode);
      if (phaseSet.size > 0 && gradePhase && !phaseSet.has(gradePhase)) continue;
      if (allowedSubjectIds.size === 0) {
        allowedGradeIds.add(grade.id);
        continue;
      }
      for (const subjectId of allowedSubjectIds) {
        if (relationPairs.has(`${subjectId}::${grade.id}`)) {
          allowedGradeIds.add(grade.id);
          break;
        }
      }
    }
    if (allowedGradeIds.size > 0) out.grade_ids = [...allowedGradeIds].join(",");
  }

  return out;
}
