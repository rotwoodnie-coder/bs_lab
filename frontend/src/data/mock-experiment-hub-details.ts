import { MOCK_EXPERIMENTS } from "@/data/mock-experiments";
import type { Experiment, ExperimentDetail } from "@/types/experiment";

const RICH_EXP_001: ExperimentDetail = {
  ...MOCK_EXPERIMENTS[0],
  bannerVideoUrl: undefined,
  teaching: {
    subject: "科学",
    stage: "小学",
    gradeLabel: MOCK_EXPERIMENTS[0].gradeLabel,
    participation: "required",
    curriculum: {
      level1Theme: "生命科学",
      level2Theme: "生物的生长与需求",
      coreCompetencies: ["科学思维", "科学探究", "科学态度与责任"],
    },
    textbook: {
      version: "（示例）小学科学",
      unit: "观察与探究",
      section: "对照实验 · 植物生长",
    },
  },
  core: {
    principle:
      "用对照实验控制变量：在相同条件下只改变一个因素（如光照或水分），通过持续观察与记录比较差异，从而得到更可靠的结论。",
    equipment: [
      {
        id: "eq-1",
        name: "种子或小苗（绿豆/小麦等）",
        imageUrl: "/icon.svg",
        homeSubstituteImageUrl: "/icon-light-32x32.png",
        measureNote: "每组数量一致，便于比较",
        homeSubstitute: "常见豆类种子",
        hazard: "caution",
      },
      {
        id: "eq-2",
        name: "透明杯/育苗盒",
        measureNote: "每组容器一致、土壤/纸巾相同",
        homeSubstitute: "一次性透明杯",
        hazard: "none",
      },
      {
        id: "eq-3",
        name: "水与滴管/量杯",
        imageUrl: "/icon.svg",
        homeSubstituteImageUrl: "/icon-dark-32x32.png",
        measureNote: "每次浇水量尽量一致",
        homeSubstitute: "带刻度瓶盖/小量杯",
        hazard: "none",
      },
      {
        id: "eq-4",
        name: "记录表/尺子（可选）",
        measureNote: "记录高度与叶片数量等",
        homeSubstitute: "作业本 + 直尺",
        hazard: "none",
      },
    ],
    steps: [
      {
        id: "st-1",
        order: 1,
        title: "分组与设定变量",
        content: "确定要探究的因素（光照/水分），设置实验组与对照组，写下预测。",
        media: [{ type: "image", url: "/icon.svg", alt: "装置示意（占位）" }],
      },
      {
        id: "st-2",
        order: 2,
        title: "布置培养条件",
        content: "每组放入相同数量的种子/小苗，除目标变量外其余条件保持一致。",
        media: [{ type: "video", url: "https://example.com/video-placeholder", alt: "操作（占位链接）" }],
      },
      {
        id: "st-3",
        order: 3,
        title: "持续观察与记录",
        content: "每天在同一时间记录高度、叶片数量、颜色等，并拍照对比。",
      },
      {
        id: "st-4",
        order: 4,
        title: "比较与得出结论",
        content: "整理记录，用表格或折线图展示变化，说明结论与证据。",
      },
    ],
    safetyAlerts: [
      "禁止品尝任何实验材料；操作前后洗手。",
      "使用剪刀/镊子等工具时注意安全；如有土壤过敏及时停止。",
      "保持桌面整洁，防止打翻水杯造成滑倒或触电风险。",
    ],
    timer: {
      suggestedDurationSec: 30 * 60,
      enableClassTimer: true,
    },
  },
  extension: {
    scientistStory: {
      name: "科学方法",
      period: "观察—提出问题—验证",
      summary:
        "对照实验是科学探究中常见的方法：控制变量、重复观察、用证据支持结论。",
    },
    extensionExperiments: [
      {
        id: "ext-1",
        title: "不同土壤/不同光源的比较",
        summary: "在控制水分一致的情况下，比较不同土壤或光源条件下的生长差异。",
      },
      {
        id: "ext-2",
        title: "记录更长时间的变化",
        summary: "持续两周以上，观察生长趋势并讨论影响因素。",
      },
    ],
  },
  management: {
    approvalStatus: "pending",
    approverName: undefined,
    reviewerComment: "建议补充「变量控制」示意图与记录模板后再发布。",
    lastReviewedAt: undefined,
    classCompletionRatePct: 87,
    practiceSubmissionCount: 42,
    classAverageScore: 86.5,
  },
};

function defaultDetailFromCard(card: Experiment): ExperimentDetail {
  const durationSec = (card.durationMin ?? 40) * 60;
  return {
    ...card,
    teaching: {
      subject: card.categoryLabel ?? "综合",
      stage: "小学",
      gradeLabel: card.gradeLabel,
      participation: "optional",
      curriculum: {
        level1Theme: "（待关联）",
        level2Theme: "（待关联）",
        coreCompetencies: ["科学探究"],
      },
      textbook: {
        version: "（校本/区本）小学科学",
        unit: "—",
        section: "—",
      },
    },
    core: {
      principle: card.summary ?? "实验原理待教研员补充。",
      equipment: [
        {
          id: "eq-default",
          name: "基础实验套件",
          measureNote: "以实验室清单为准",
          homeSubstitute: "可向教师申请家庭实验包",
          hazard: "caution",
        },
      ],
      steps: [
        {
          id: "st-d1",
          order: 1,
          title: "准备",
          content: "阅读教材与学案，检查器材。",
        },
        {
          id: "st-d2",
          order: 2,
          title: "操作与记录",
          content: "按教师完成操作并记录数据。",
        },
        {
          id: "st-d3",
          order: 3,
          title: "分析与提交",
          content: "完成误差分析与实验报告。",
        },
      ],
      safetyAlerts: ["遵守实验室安全规范；有疑问先举手问教师。"],
      timer: { suggestedDurationSec: durationSec, enableClassTimer: true },
    },
    extension: {
      scientistStory: undefined,
      extensionExperiments: [],
    },
    management: {
      approvalStatus: card.status === "draft" ? "draft" : "approved",
      approverName: card.status === "draft" ? undefined : "系统（Mock）",
      reviewerComment: undefined,
      lastReviewedAt: card.status === "draft" ? undefined : "2026-01-10",
      classCompletionRatePct: 68,
      practiceSubmissionCount: 24,
      classAverageScore: 78,
    },
  };
}

/** Experiment Hub（Bento 详情页）专用 Mock，模型见 `@/types/experiment` 的 ExperimentDetail。 */
export function getMockExperimentDetail(id: string): ExperimentDetail | null {
  const card = MOCK_EXPERIMENTS.find((e) => e.id === id);
  if (!card) return null;
  if (id === "exp-001") return RICH_EXP_001;
  const base = defaultDetailFromCard(card);
  if (id === "exp-004") {
    return {
      ...base,
      simulationConfig: { embedSrc: "about:blank", version: "mock-0.1" },
    };
  }
  return base;
}
