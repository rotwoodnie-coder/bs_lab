import type { TeacherMockMaterial } from "@/data/teacher-mock";

export const TEACHER_MOCK_MATERIALS_FIXTURE: TeacherMockMaterial[] = [
  {
    id: "m1",
    title: "伏安法实验 · 学案与数据记录（Word）",
    kind: "word",
    audiences: ["teacher", "student"],
    linkedExperimentTitle: "伏安法与电表内阻对结果的影响",
    updatedAt: "2026-04-09",
  },
  {
    id: "m2",
    title: "伏安法 · 探究课课件（PPT）",
    kind: "ppt",
    audiences: ["teacher", "researcher"],
    linkedExperimentTitle: "伏安法与电表内阻对结果的影响",
    updatedAt: "2026-04-09",
  },
  {
    id: "m3",
    title: "伏安法实验 · 安全与步骤说明（PDF）",
    kind: "pdf",
    audiences: ["teacher", "student", "researcher"],
    linkedExperimentTitle: "伏安法与电表内阻对结果的影响",
    updatedAt: "2026-04-08",
  },
  {
    id: "m4",
    title: "电表接线示范截图",
    kind: "image",
    audiences: ["teacher", "student"],
    linkedExperimentTitle: "伏安法与电表内阻对结果的影响",
    updatedAt: "2026-04-08",
  },
  {
    id: "m5",
    title: "平抛 · 参考视频",
    kind: "video",
    audiences: ["student", "teacher"],
    linkedExperimentTitle: "平抛轨迹与初速度测定",
    updatedAt: "2026-04-07",
  },
  {
    id: "m6",
    title: "实验数据汇总 · 班级成绩分析（Excel）",
    kind: "spreadsheet",
    audiences: ["teacher", "researcher"],
    linkedExperimentTitle: "平抛轨迹与初速度测定",
    updatedAt: "2026-04-06",
  },
];
