export type Ability = "观察" | "推断" | "实验操作";
export type AbilityTag = "现象观察" | "变量控制" | "数据推断" | "仪器使用" | "实验设计";
export type QuestionKind = "单选题" | "多选题" | "情境简答";
export type Difficulty = 1 | 2 | 3 | 4 | 5;
export type ExperimentScene = "实验室" | "居家" | "模拟器";

export type QuestionFlowItem = {
  id: string;
  type: QuestionKind;
  difficulty: Difficulty;
  subjectTag: string;
  gradeTag: string;
  abilities: Ability[];
  abilityTags: AbilityTag[];
  scene: ExperimentScene;
  estimatedMinutes: number;
  stem: string;
  standardName: string;
  experimentName: string;
  curriculumId: string;
  knowledgePoint: string;
  correctAnswer: string;
  aiAnalysis: string;
  imageUrl?: string;
  scoreRate: number;
  usageCount: number;
  aiRefine: {
    /** 每次点击 AI 改题时增加的难度值（可为 0） */
    difficultyDeltaPerRun: 0 | 1 | 2;
    /** AI 改题附加到题干的场景变体文案（按点击次数轮换） */
    variantPrompts: string[];
  };
};

export const ABILITY_OPTIONS: Ability[] = ["观察", "推断", "实验操作"];
export const ABILITY_TAG_OPTIONS: AbilityTag[] = ["现象观察", "变量控制", "数据推断", "仪器使用", "实验设计"];
export const EXPERIMENT_SCENE_OPTIONS: ExperimentScene[] = ["实验室", "居家", "模拟器"];
export const DIFFICULTY_OPTIONS: Difficulty[] = [1, 2, 3, 4, 5];

export const QUESTION_FLOW_POOL: readonly QuestionFlowItem[] = [
  {
    id: "qb-flow-001",
    type: "单选题",
    difficulty: 1,
    subjectTag: "小学科学",
    gradeTag: "一年级",
    abilities: ["观察"],
    abilityTags: ["现象观察"],
    scene: "居家",
    estimatedMinutes: 3,
    stem: "### 观察物体特征\n把家里找到的 3 件物品放在桌面上，比较它们的颜色、形状和表面粗糙程度。下面哪一种分类方法更合理？\n- 按颜色分类\n- 按大小分类\n- 按“是否粗糙”分类",
    standardName: "课标-小学科学-物质的结构与性质-物质具有一定的特性与功能",
    experimentName: "观察描述常见物体的特征",
    curriculumId: "std_seed_catalog_sci_001",
    knowledgePoint: "根据外部特征进行简单分类",
    correctAnswer: "按“是否粗糙”分类（选择一个可观察且可比较的特征）。",
    aiAnalysis: "强调“可观察、可比较”的分类依据，符合低年级科学探究的起点要求。",
    imageUrl: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&auto=format&fit=crop",
    scoreRate: 0.84,
    usageCount: 18,
    aiRefine: {
      difficultyDeltaPerRun: 0,
      variantPrompts: ["AI 场景变体：把物体替换为“铅笔、橡皮、积木”，要求给出分类理由。"],
    },
  },
  {
    id: "qb-flow-002",
    type: "单选题",
    difficulty: 2,
    subjectTag: "小学科学",
    gradeTag: "二年级",
    abilities: ["观察"],
    abilityTags: ["现象观察"],
    scene: "居家",
    estimatedMinutes: 4,
    stem: "### 观察水的特点\n把一杯清水放在白纸上观察，再轻轻闻一闻。下列描述正确的是哪一项？\nA. 水是有颜色的\nB. 水没有气味，通常是无色透明的\nC. 水摸起来一定是热的",
    standardName: "课标-小学科学-空气与水-水的特征",
    experimentName: "观察水的特点",
    curriculumId: "std_seed_catalog_sci_002",
    knowledgePoint: "观察并描述水的颜色、状态、气味等",
    correctAnswer: "B",
    aiAnalysis: "把“观察维度”限定在颜色/气味/状态，避免引入温度等干扰信息。",
    imageUrl: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&auto=format&fit=crop",
    scoreRate: 0.79,
    usageCount: 22,
    aiRefine: {
      difficultyDeltaPerRun: 1,
      variantPrompts: ["AI 场景变体：加入“冰块融化后还是水吗？”的追问，提升推断要求。"],
    },
  },
  {
    id: "qb-flow-003",
    type: "情境简答",
    difficulty: 3,
    subjectTag: "小学科学",
    gradeTag: "二年级",
    abilities: ["观察", "推断"],
    abilityTags: ["现象观察", "数据推断"],
    scene: "居家",
    estimatedMinutes: 6,
    stem: "### 空气占据空间\n把纸巾塞进杯子底部并压紧，倒扣杯子快速竖直插入水中（不倾斜）。取出后纸巾大多是干的。\n请用一句话解释：为什么纸巾没有湿？",
    standardName: "课标-小学科学-空气与水-空气占据空间",
    experimentName: "空气占据空间的实验",
    curriculumId: "std_seed_catalog_sci_003",
    knowledgePoint: "空气占据空间并充满各处",
    correctAnswer: "杯子里有空气占据空间，阻挡水进入杯内，所以纸巾不容易湿。",
    aiAnalysis: "用现象反推原因，体现“现象—解释”的基础推断链。",
    imageUrl: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600&auto=format&fit=crop",
    scoreRate: 0.71,
    usageCount: 14,
    aiRefine: {
      difficultyDeltaPerRun: 1,
      variantPrompts: ["AI 场景变体：将操作改为“杯子倾斜插入水中”，让学生比较纸巾变化并解释。"],
    },
  },
  {
    id: "qb-flow-004",
    type: "单选题",
    difficulty: 2,
    subjectTag: "小学科学",
    gradeTag: "三年级",
    abilities: ["实验操作"],
    abilityTags: ["仪器使用"],
    scene: "实验室",
    estimatedMinutes: 4,
    stem: "### 用尺子测量长度\n测量铅笔的长度时，下列做法正确的是哪一项？\nA. 从尺子的任意刻度开始量\nB. 让铅笔的一端对齐“0”刻度再读数\nC. 把尺子竖起来读数更快",
    standardName: "课标-小学科学-物质的结构与性质-物质具有一定的特性与功能",
    experimentName: "用尺子测量物体的长度",
    curriculumId: "std_seed_catalog_sci_004",
    knowledgePoint: "用恰当计量单位记录长度",
    correctAnswer: "B",
    aiAnalysis: "强调从 0 刻度对齐可减少系统误差，体现基本测量规范。",
    imageUrl: "https://images.unsplash.com/photo-1453738773917-9c3eff1db985?w=600&auto=format&fit=crop",
    scoreRate: 0.76,
    usageCount: 16,
    aiRefine: {
      difficultyDeltaPerRun: 0,
      variantPrompts: ["AI 场景变体：把尺子 0 刻度磨损情境加入，要求用“差值法”测量。"],
    },
  },
  {
    id: "qb-flow-005",
    type: "多选题",
    difficulty: 3,
    subjectTag: "小学科学",
    gradeTag: "四年级",
    abilities: ["实验操作", "推断"],
    abilityTags: ["仪器使用", "数据推断"],
    scene: "实验室",
    estimatedMinutes: 6,
    stem: "### 用温度计测量温度\n测量热水温度时，哪些做法能让读数更准确？\n- 温度计玻璃泡完全浸入水中\n- 玻璃泡碰到杯底\n- 视线与液面刻度保持水平\n- 读数前等待液柱稳定",
    standardName: "课标-小学科学-物质的结构与性质-物质具有一定的特性与功能",
    experimentName: "用温度计测量物体的温度",
    curriculumId: "std_seed_catalog_sci_005",
    knowledgePoint: "规范使用仪器并记录温度",
    correctAnswer: "选择“玻璃泡完全浸入水中、视线水平、等待稳定”。",
    aiAnalysis: "把常见误操作（碰杯底）作为干扰项，考查规范操作与读数习惯。",
    imageUrl: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&auto=format&fit=crop",
    scoreRate: 0.67,
    usageCount: 10,
    aiRefine: {
      difficultyDeltaPerRun: 1,
      variantPrompts: ["AI 场景变体：给出两次读数记录，让学生判断哪次更可信并说明理由。"],
    },
  },
  {
    id: "qb-flow-006",
    type: "情境简答",
    difficulty: 4,
    subjectTag: "小学科学",
    gradeTag: "四年级",
    abilities: ["推断", "实验操作"],
    abilityTags: ["变量控制", "实验设计"],
    scene: "居家",
    estimatedMinutes: 8,
    stem: "### 分离混合物\n把“沙和糖”混在一起后，你想把它们分开。\n请写出一个可行的实验方案（至少 3 步），并说明你利用了糖和沙的什么不同特点。",
    standardName: "课标-小学科学-物质的结构与性质-物质具有一定的特性与功能",
    experimentName: "根据物质特点分离混合在一起的物质",
    curriculumId: "std_seed_catalog_sci_006",
    knowledgePoint: "利用物质性质差异进行分离",
    correctAnswer: "加水溶解糖→过滤分离沙→蒸发/加热回收糖（利用糖易溶于水、沙不溶）。",
    aiAnalysis: "要求“步骤+依据”，把操作层面与科学解释绑定，避免只背流程。",
    imageUrl: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600&auto=format&fit=crop",
    scoreRate: 0.61,
    usageCount: 8,
    aiRefine: {
      difficultyDeltaPerRun: 1,
      variantPrompts: ["AI 场景变体：把材料换成“铁屑和木屑”，引导选择磁吸分离。"],
    },
  },
  {
    id: "qb-flow-007",
    type: "单选题",
    difficulty: 3,
    subjectTag: "小学科学",
    gradeTag: "五年级",
    abilities: ["推断", "实验操作"],
    abilityTags: ["变量控制", "数据推断"],
    scene: "实验室",
    estimatedMinutes: 6,
    stem: "### 探究导电性\n把电池、灯泡和导线连成简单电路。依次把不同材料接入电路（如回形针、木棒、橡皮）。\n要保证比较公平，下列哪项应该保持不变？\nA. 每次更换电池\nB. 电路连接方式和电源保持一致\nC. 每次换不同灯泡",
    standardName: "课标-小学科学-物质的结构与性质-物质具有一定的特性与功能",
    experimentName: "探究常见材料的导电性",
    curriculumId: "std_seed_catalog_sci_007",
    knowledgePoint: "控制变量进行公平比较",
    correctAnswer: "B",
    aiAnalysis: "把“控制变量”落到电路条件保持一致，符合探究性实验的基本规范。",
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop",
    scoreRate: 0.63,
    usageCount: 11,
    aiRefine: {
      difficultyDeltaPerRun: 0,
      variantPrompts: ["AI 场景变体：加入“材料接触不良”情境，要求排查并改进连接方式。"],
    },
  },
  {
    id: "qb-flow-008",
    type: "多选题",
    difficulty: 4,
    subjectTag: "小学科学",
    gradeTag: "六年级",
    abilities: ["观察", "推断", "实验操作"],
    abilityTags: ["现象观察", "数据推断", "实验设计"],
    scene: "居家",
    estimatedMinutes: 8,
    stem: "### 探究材料沉浮\n准备：木块、橡皮、金属勺、塑料瓶盖和一盆水。\n把材料依次放入水中并记录“浮/沉”。哪些做法能让你的记录更可靠？\n- 每次只放一种材料\n- 放入后等 10 秒再判断\n- 用同一盆水\n- 同一材料反复测一次",
    standardName: "课标-小学科学-物质的结构与性质-物质具有一定的特性与功能",
    experimentName: "探究常见材料在水中的沉浮",
    curriculumId: "std_seed_catalog_sci_008",
    knowledgePoint: "用记录与重复提高结论可信度",
    correctAnswer: "选择“每次只放一种、等待再判断、用同一盆水、同一材料复测”。",
    aiAnalysis: "突出“重复+控制条件+延时判断”，让学生形成基础的实验可靠性意识。",
    imageUrl: "https://images.unsplash.com/photo-1502741126161-b048400d1d0f?w=600&auto=format&fit=crop",
    scoreRate: 0.58,
    usageCount: 6,
    aiRefine: {
      difficultyDeltaPerRun: 1,
      variantPrompts: ["AI 场景变体：加入“把金属勺放在水面上会先浮后沉吗？”引导讨论气泡与表面张力。"],
    },
  },
];

export const QUESTION_KIND_OPTIONS: QuestionKind[] = Array.from(new Set(QUESTION_FLOW_POOL.map((item) => item.type)));
