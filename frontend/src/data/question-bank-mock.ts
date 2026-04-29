import type { QuestionBankItem } from "@/types/question-bank";

const choice = (id: string, label: string) => ({ id, label });

/** 待教师审核的自动生成题（） */
export const QUESTION_BANK_DRAFT_SEED: readonly QuestionBankItem[] = [
  {
    id: "qb-draft-1",
    stem: "在「测量物体温度」实验中，读数时温度计玻璃泡应处于什么状态？",
    choices: [
      choice("a", "离开被测物体后立即读数"),
      choice("b", "继续留在被测物体中，待示数稳定"),
      choice("c", "取出后在空气中甩两下再读"),
      choice("d", "任意角度斜放均可"),
    ],
    correctIndex: 1,
    source: "curriculum",
    sourceDetail: "课标 · 初中物理 · 物态变化 · 基本实验活动",
    gradeLabels: ["七年级", "七~九年级"],
    subjectLabel: "初中物理",
    standardId: "std-phy-7-thermo-001",
    standardTitle: "物态变化 · 温度测量规范",
    planWeek: "第 4 周 · 热学入门",
    reviewStatus: "pending",
  },
  {
    id: "qb-draft-2",
    stem: "教师在本班发布的「探究光的反射」实验中，第一步应检查器材中的哪一项？",
    choices: [
      choice("a", "激光笔电池电量"),
      choice("b", "量角器中心是否与入射点重合"),
      choice("c", "教室窗帘颜色"),
      choice("d", "学生鞋码是否统一"),
    ],
    correctIndex: 1,
    source: "teacher_experiment",
    sourceDetail: "教师实验内容 · 八年级 2 班 · 已发布学案",
    gradeLabels: ["八年级"],
    subjectLabel: "初中物理",
    standardId: "std-phy-8-optics-002",
    standardTitle: "光的反射 · 入射角与反射角",
    planWeek: "第 7 周 · 光现象",
    reviewStatus: "pending",
  },
  {
    id: "qb-draft-3",
    stem: "教研员实验库条目「酸碱指示剂变色」中，不建议学生直接嗅闻的气体是？",
    choices: [
      choice("a", "氮气"),
      choice("b", "二氧化碳"),
      choice("c", "浓盐酸挥发雾"),
      choice("d", "水蒸气"),
    ],
    correctIndex: 2,
    source: "researcher_library",
    sourceDetail: "教研员实验库 · 初中化学 · 安全批注 v3",
    gradeLabels: ["九年级", "七~九年级"],
    subjectLabel: "初中化学",
    standardId: "std-chem-9-acidbase-003",
    standardTitle: "酸碱实验 · 安全操作规范",
    planWeek: "第 12 周 · 酸碱盐",
    reviewStatus: "pending",
  },
  {
    id: "qb-draft-4",
    stem: "课标要求「用小棒表达万以内数的意义」——下列哪项最能体现「数位」概念？",
    choices: [
      choice("a", "全部小棒捆成一捆"),
      choice("b", "按个十百千分组摆放"),
      choice("c", "随机撒在桌面"),
      choice("d", "只使用两种颜色的小棒"),
    ],
    correctIndex: 1,
    source: "curriculum",
    sourceDetail: "课标 · 小学数学 · 数与运算 · 1~2 年级",
    gradeLabels: ["1~2年级", "一年级", "二年级"],
    subjectLabel: "小学数学",
    standardId: "std-math-12-number-004",
    standardTitle: "数与运算 · 数位意义",
    planWeek: "上学期 · 第 2 单元",
    reviewStatus: "pending",
  },
];

/** 已通过审核、可进入学生闯关的题（） */
export const QUESTION_BANK_APPROVED_SEED: readonly QuestionBankItem[] = [
  {
    id: "qb-appr-1",
    stem: "实验前阅读安全须知时，发现「强酸溅入眼睛」应首选？",
    choices: [
      choice("a", "用手揉搓"),
      choice("b", "大量清水冲洗并就医"),
      choice("c", "闭眼等待挥发"),
      choice("d", "用纸巾擦拭"),
    ],
    correctIndex: 1,
    source: "teacher_experiment",
    sourceDetail: "教师实验内容 · 通用安全导读",
    gradeLabels: ["七年级", "八年级", "九年级"],
    subjectLabel: "实验规范",
    standardId: "std-safety-general-001",
    standardTitle: "实验安全 · 基础应急处理",
    planWeek: "每学期 · 第 1 课",
    reviewStatus: "approved",
  },
  {
    id: "qb-appr-2",
    stem: "使用天平时，物体应放在哪一侧托盘？（教材默认画法）",
    choices: [
      choice("a", "左侧"),
      choice("b", "右侧"),
      choice("c", "两侧同时"),
      choice("d", "任意侧均可"),
    ],
    correctIndex: 0,
    source: "curriculum",
    sourceDetail: "课标 · 初中物理 · 质量与密度",
    gradeLabels: ["八年级", "七~九年级"],
    subjectLabel: "初中物理",
    standardId: "std-phy-8-density-005",
    standardTitle: "质量与密度 · 天平规范使用",
    planWeek: "第 3 周",
    reviewStatus: "approved",
  },
  {
    id: "qb-appr-3",
    stem: "完成「电路连接」闯关时，开关在连接电路过程中应处于？",
    choices: [
      choice("a", "闭合"),
      choice("b", "断开"),
      choice("c", "快速反复拨动"),
      choice("d", "半闭合"),
    ],
    correctIndex: 1,
    source: "researcher_library",
    sourceDetail: "教研员实验库 · 电学安全清单",
    gradeLabels: ["九年级"],
    subjectLabel: "初中物理",
    standardId: "std-phy-9-electricity-006",
    standardTitle: "电流与电路 · 开关操作规范",
    planWeek: "第 15 周 · 电流与电路",
    reviewStatus: "approved",
  },
];

export function sourceLabelZh(source: QuestionBankItem["source"]): string {
  switch (source) {
    case "curriculum":
      return "课标";
    case "teacher_experiment":
      return "教师实验";
    case "researcher_library":
      return "教研员库";
    default:
      return "未知";
  }
}

/** 年级关键词是否匹配题目（：包含或区间重叠的宽松匹配） */
export function questionMatchesGradeLabels(question: QuestionBankItem, studentGradeLabel: string): boolean {
  const g = studentGradeLabel.trim();
  if (!g) return true;
  return question.gradeLabels.some((gl) => gl.includes(g) || g.includes(gl) || gl === g);
}
