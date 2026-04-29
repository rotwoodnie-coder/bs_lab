/**
 * 亲子实验 AI 导师 Mock：按角色与引导风格返回结构化卡片（无网络请求）。
 */

export type AiGuideUserRole = "student" | "parent";

/** 产品指令：温和 / 严谨 / 趣味 */
export type AiGuideStyle = "gentle" | "rigorous" | "playful";

export type AiGuideCardVariant = "principle" | "safety" | "pedagogy" | "step";

export type AiGuideCard = {
  variant: AiGuideCardVariant;
  title: string;
  body: string;
};

type BuildInput = {
  role: AiGuideUserRole;
  guideStyle: AiGuideStyle;
  userMessage?: string;
};

function trimUser(msg: string | undefined): string {
  return msg?.trim() || "";
}

export function buildAiGuideReply(input: BuildInput): AiGuideCard[] {
  const q = trimUser(input.userMessage);
  const { role, guideStyle } = input;

  if (role === "student") {
    const principle =
      guideStyle === "gentle"
        ? "先说说你看到了什么颜色或形状变化，不用一次说全。"
        : guideStyle === "rigorous"
          ? "请对照步骤：现象与变量是否一一对应，能否用一句话描述因果关系？"
          : "像小侦探一样：这个现象「搞怪」在哪里？试着给它起个外号！";

    const step =
      guideStyle === "gentle"
        ? "下一步：轻轻重复刚才的动作，看看现象会不会再来一次。"
        : guideStyle === "rigorous"
          ? "下一步：记录时间或读数区间，并标注单位。"
        : "下一步：换个小道具试试，看现象会不会「变脸」。";

    return [
      { variant: "principle", title: "原理解析", body: principle },
      { variant: "step", title: "步骤引导", body: step },
      ...(q
        ? [{ variant: "principle" as const, title: "回应你的想法", body: `你提到「${q.slice(0, 80)}」——可以再加一句：这和哪一步操作最相关？` }]
        : []),
    ];
  }

  const safety =
    guideStyle === "gentle"
      ? "安全：看护距离近一点即可，让孩子自己拿稳器材；热源与化学品远离面部。"
      : guideStyle === "rigorous"
        ? "安全：操作前确认通风与防护（护目镜/手套按材料要求）；尖锐与高温物品家长先手检。"
      : "安全：把「危险区」当成游戏边界线——越线就暂停，重来一局！";

  const pedagogy =
    guideStyle === "gentle"
      ? "教育方法：多问「你注意到了吗」，少替孩子下结论；用复述代替纠正。"
      : guideStyle === "rigorous"
        ? "教育方法：用「观察—假设—验证」三句模板引导孩子自检；每次只改一个变量。"
      : "教育方法：把结论变成家庭口令或手势，增加记忆点；适时夸张表扬具体行为。";

  return [
    { variant: "safety", title: "安全预警", body: safety },
    { variant: "pedagogy", title: "教育方法提示", body: pedagogy },
    ...(q
      ? [
          {
            variant: "pedagogy" as const,
            title: "陪同确认",
            body: `关于「${q.slice(0, 80)}」：先肯定孩子的参与，再邀请他指认画面中的证据。`,
          },
        ]
      : []),
  ];
}
