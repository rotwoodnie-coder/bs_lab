import type { EducationPhase, SubjectDiscipline, SubjectNode } from "@/types/subject";

/** 管理端可视化树（学段 > 学科） */
export const SUBJECT_TREE_ROOT: SubjectNode[] = [
  {
    id: "phase-primary",
    label: "小学",
    type: "phase",
    phase: "primary",
    children: [
      {
        id: "primary-science",
        label: "科学",
        type: "discipline",
        phase: "primary",
        discipline: "science",
        grades: [
          { code: "P1", label: "一年级" },
          { code: "P2", label: "二年级" },
          { code: "P3", label: "三年级" },
          { code: "P4", label: "四年级" },
          { code: "P5", label: "五年级" },
        ],
      },
    ],
  },
  {
    id: "phase-junior",
    label: "初中",
    type: "phase",
    phase: "junior",
    children: [
      {
        id: "junior-physics",
        label: "物理",
        type: "discipline",
        phase: "junior",
        discipline: "physics",
        grades: [
          { code: "J6", label: "六年级" },
          { code: "J7", label: "七年级" },
          { code: "J8", label: "八年级" },
          { code: "J9", label: "九年级" },
        ],
      },
      {
        id: "junior-chemistry",
        label: "化学",
        type: "discipline",
        phase: "junior",
        discipline: "chemistry",
        grades: [
          { code: "J6", label: "六年级" },
          { code: "J7", label: "七年级" },
          { code: "J8", label: "八年级" },
          { code: "J9", label: "九年级" },
        ],
      },
      {
        id: "junior-biology",
        label: "生物",
        type: "discipline",
        phase: "junior",
        discipline: "biology",
        grades: [
          { code: "J6", label: "六年级" },
          { code: "J7", label: "七年级" },
          { code: "J8", label: "八年级" },
          { code: "J9", label: "九年级" },
        ],
      },
    ],
  },
  {
    id: "phase-senior",
    label: "高中",
    type: "phase",
    phase: "senior",
    children: [
      {
        id: "senior-physics",
        label: "物理",
        type: "discipline",
        phase: "senior",
        discipline: "physics",
        grades: [
          { code: "S10", label: "十年级" },
          { code: "S11", label: "十一年级" },
          { code: "S12", label: "十二年级" },
        ],
      },
      {
        id: "senior-chemistry",
        label: "化学",
        type: "discipline",
        phase: "senior",
        discipline: "chemistry",
        grades: [
          { code: "S10", label: "十年级" },
          { code: "S11", label: "十一年级" },
          { code: "S12", label: "十二年级" },
        ],
      },
      {
        id: "senior-biology",
        label: "生物",
        type: "discipline",
        phase: "senior",
        discipline: "biology",
        grades: [
          { code: "S10", label: "十年级" },
          { code: "S11", label: "十一年级" },
          { code: "S12", label: "十二年级" },
        ],
      },
    ],
  },
];

export type CascadePhaseOption = {
  phase: EducationPhase;
  label: string;
  disciplines: {
    id: string;
    discipline: SubjectDiscipline;
    label: string;
    grades: readonly { code: string; label: string }[];
  }[];
};

/** 教师端级联：学段 > 学科 > 年级 */
export const SUBJECT_CASCADE: readonly CascadePhaseOption[] = SUBJECT_TREE_ROOT.map((p) => ({
  phase: p.phase!,
  label: p.label,
  disciplines: (p.children ?? []).map((d) => ({
    id: d.id,
    discipline: d.discipline!,
    label: d.label,
    grades: d.grades ?? [],
  })),
}));
