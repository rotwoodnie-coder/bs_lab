import type { ExperimentDetail } from "@/types/experiment-detail";

const VIDEO_PLACEHOLDER = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

function detailForExp001(): ExperimentDetail {
  return {
    id: "exp-001",
    title: "观察植物生长需要什么",
    summary: "通过对照实验，探究光照与水分对植物生长的影响。",
    subjectPath: {
      phase: "primary",
      discipline: "science",
      gradeLabel: "三年级",
      gradeCode: "P3",
    },
    durationMin: 30,
    mainVideoUrl: VIDEO_PLACEHOLDER,
    teachingContext: {
      curriculumStandardRef: "小学科学课程标准（示例）· 生物的生长与需求（对照实验）",
      textbookRef: "（示例）小学科学",
      chapter: "观察与探究 · 对照实验",
      learningObjectives: [
        "能提出可检验的问题并做出预测。",
        "能进行简单的对照实验并持续记录。",
      ],
    },
    materials: [
      {
        id: "m1",
        nameLab: "种子或小苗（绿豆/小麦等）",
        nameHomeSubstitute: "常见豆类种子",
        imageUrl: "/icon.svg",
        hazardFlags: ["sharp", "no_taste"],
        notes: "每组数量一致，便于比较。",
      },
      {
        id: "m2",
        nameLab: "透明杯/育苗盒 + 纸巾或土壤",
        nameHomeSubstitute: "一次性透明杯 + 纸巾",
        imageUrl: "/icon.svg",
        hazardFlags: ["eye_protection"],
      },
      {
        id: "m3",
        nameLab: "滴管/量杯 + 记录表（可选：直尺）",
        nameHomeSubstitute: "瓶盖/小量杯 + 作业本",
        hazardFlags: [],
      },
    ],
    steps: [
      {
        id: "s1",
        order: 1,
        title: "分组并设定变量",
        description: "确定要探究的因素（光照/水分），设置实验组与对照组，写下预测。",
        media: { imageUrl: "/icon.svg" },
      },
      {
        id: "s2",
        order: 2,
        title: "布置培养条件",
        description: "每组放入相同数量的种子/小苗，除目标变量外其余条件保持一致。",
        media: { videoUrl: VIDEO_PLACEHOLDER },
      },
      {
        id: "s3",
        order: 3,
        title: "持续观察与记录",
        description: "每天在同一时间记录高度、叶片数量、颜色等，并拍照对比。",
      },
    ],
    safetyAlerts: [
      {
        id: "sa1",
        title: "实验前必读",
        body: "禁止品尝任何实验材料；操作前后洗手；使用工具注意安全。",
        severity: "critical",
      },
      {
        id: "sa2",
        title: "用电与设备",
        body: "如拍照记录使用电子设备，注意远离水源并在成人指导下操作。",
        severity: "warning",
      },
    ],
    evaluation: {
      scienceStory:
        "对照实验是科学探究的重要方法：控制变量、重复观察、用证据支持结论。",
      rubricSummary: "变量控制 30%、记录质量 35%、安全规范 15%、表达与反思 20%。",
      dimensions: [
        { name: "方案可行性", weightPct: 30 },
        { name: "数据与图像", weightPct: 35 },
        { name: "安全与规范", weightPct: 15 },
        { name: "论证表达", weightPct: 20 },
      ],
    },
    approvalMeta: {
      submitterName: "李老师",
      submittedAt: "2026-04-08 14:20",
      schoolName: "市实验小学",
      version: "v1.2",
      statusLabel: "待区级评审",
    },
  };
}

function detailForExp002(): ExperimentDetail {
  return {
    id: "exp-002",
    title: "水的三态变化与小水循环",
    summary: "观察蒸发、凝结与融化现象，用图示解释小水循环。",
    subjectPath: {
      phase: "primary",
      discipline: "science",
      gradeLabel: "四年级",
      gradeCode: "P4",
    },
    durationMin: 25,
    mainVideoUrl: VIDEO_PLACEHOLDER,
    teachingContext: {
      curriculumStandardRef: "小学科学课程标准（示例）· 物态变化与水循环",
      textbookRef: "（示例）小学科学",
      chapter: "水与空气 · 水的变化",
      learningObjectives: ["能描述蒸发与凝结现象。", "能用图示解释简单的水循环过程。"],
    },
    materials: [
      {
        id: "m1",
        nameLab: "透明杯 + 热水/温水",
        nameHomeSubstitute: "耐热杯 + 温水",
        hazardFlags: ["no_taste"],
        notes: "注意防烫，需成人指导。",
      },
      {
        id: "m2",
        nameLab: "保鲜膜/玻璃盖 + 冰块（可选）",
        nameHomeSubstitute: "玻璃盖 + 冰袋",
        imageUrl: "/icon.svg",
        hazardFlags: ["no_inhale", "eye_protection"],
        notes: "避免冷凝水滴落造成打滑。",
      },
    ],
    steps: [
      {
        id: "s1",
        order: 1,
        title: "观察蒸发",
        description: "在安全温度下观察水面减少、杯壁水汽等现象，并记录。",
        media: { imageUrl: "/icon.svg" },
      },
      {
        id: "s2",
        order: 2,
        title: "观察凝结与小水循环",
        description: "盖上盖子并在盖上放冰块，观察水汽凝结成小水滴并回落。",
      },
    ],
    safetyAlerts: [
      {
        id: "sa1",
        title: "安全注意事项",
        body: "禁止品尝实验材料；热水需成人协助；注意防烫与地面防滑。",
        severity: "critical",
      },
    ],
    evaluation: {
      scienceStory: "从日常现象出发：杯口的水汽、窗户的水珠，背后都是蒸发与凝结。",
      rubricSummary: "观察描述 40%、记录质量 30%、安全操作 20%、结论 10%。",
      dimensions: [
        { name: "观察与操作", weightPct: 40 },
        { name: "数据记录", weightPct: 30 },
        { name: "安全规范", weightPct: 20 },
        { name: "结论", weightPct: 10 },
      ],
    },
    approvalMeta: {
      submitterName: "王老师",
      submittedAt: "2026-04-09 09:00",
      schoolName: "市实验小学",
      version: "v1.0",
      statusLabel: "待评审",
    },
  };
}

function genericDetail(id: string, title: string, gradeLabel: string, durationMin: number): ExperimentDetail {
  return {
    id,
    title,
    summary: "（Mock）完整字段占位，用于列表中其他实验的详情。",
    subjectPath: {
      phase: "primary",
      discipline: "science",
      gradeLabel,
    },
    durationMin,
    mainVideoUrl: VIDEO_PLACEHOLDER,
    teachingContext: {
      curriculumStandardRef: "对应课标条目（Mock）",
      textbookRef: "教材版本（Mock）",
      chapter: "章节（Mock）",
      learningObjectives: ["学习目标 A（Mock）", "学习目标 B（Mock）"],
    },
    materials: [
      {
        id: "m1",
        nameLab: "标准器材 A",
        nameHomeSubstitute: "家庭替代品 A",
        hazardFlags: ["no_taste"],
        imageUrl: "/icon.svg",
      },
    ],
    steps: [
      {
        id: "s1",
        order: 1,
        title: "步骤一（Mock）",
        description: "请根据课堂指导完成操作与记录。",
        media: { imageUrl: "/icon.svg" },
      },
    ],
    safetyAlerts: [
      {
        id: "sa1",
        title: "安全注意事项",
        body: "禁止品尝任何实验材料；听从教师指挥；佩戴必要护具。",
        severity: "critical",
      },
    ],
    evaluation: {
      scienceStory: "科学故事占位：联系生活现象与科学史。",
      rubricSummary: "评价摘要占位。",
      dimensions: [
        { name: "探究过程", weightPct: 50 },
        { name: "结果表达", weightPct: 50 },
      ],
    },
    approvalMeta: {
      submitterName: "教师（Mock）",
      submittedAt: "2026-04-01 10:00",
      schoolName: "学校（Mock）",
      version: "v0.9",
      statusLabel: "草稿",
    },
  };
}

const MAP: Record<string, ExperimentDetail> = {
  "exp-001": detailForExp001(),
  "exp-002": detailForExp002(),
  "exp-003": genericDetail("exp-003", "影子长度与太阳高度的关系", "五年级", 35),
  "exp-004": genericDetail("exp-004", "搭建电路点亮小灯泡", "五年级", 30),
  "exp-005": genericDetail("exp-005", "制作简易温度计并比较测量", "四年级", 30),
};

export function getExperimentDetailById(id: string): ExperimentDetail | undefined {
  return MAP[id];
}

export function listExperimentDetailIds(): string[] {
  return Object.keys(MAP);
}
