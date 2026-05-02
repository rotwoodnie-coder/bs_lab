"use client";

import { useMemo, useState } from "react";
import { MobileCard } from "@/components/mobile/MobileCard";
import { useMobileContext } from "@/contexts/MobileContext";
import { cn } from "@/lib/utils";

type Scene = {
  id: string;
  name: string;
  icon: string;
  bg: string;
  experiments: Experiment[];
};

type Experiment = {
  id: string;
  name: string;
  icon: string;
  color: string;
  steps: StepItem[];
};

type StepItem = {
  image: string;
  title: string;
  note: string;
};

const SCENES: Scene[] = [
  {
    id: "island",
    name: "科学岛",
    icon: "🌋",
    bg: "bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600",
    experiments: [
      {
        id: "volcano",
        name: "小火山喷发",
        icon: "🌋",
        color: "from-orange-400 to-red-500",
        steps: [
          { image: "🧪", title: "放入小苏打", note: "先把材料装进火山杯" },
          { image: "🍋", title: "倒入酸液", note: "观察泡泡慢慢出现" },
          { image: "✨", title: "等待喷发", note: "看火山慢慢涌出来" },
        ],
      },
      {
        id: "rainbow",
        name: "彩虹雨云",
        icon: "🌈",
        color: "from-fuchsia-400 to-violet-500",
        steps: [
          { image: "☁️", title: "准备云朵", note: "先让云朵待在天空里" },
          { image: "💧", title: "滴入雨点", note: "慢慢看颜色落下去" },
          { image: "🌦️", title: "出现彩虹", note: "彩虹会在最后出现" },
        ],
      },
    ],
  },
  {
    id: "kitchen",
    name: "厨房区",
    icon: "🍳",
    bg: "bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500",
    experiments: [
      {
        id: "bread",
        name: "发泡面包",
        icon: "🍞",
        color: "from-amber-500 to-orange-500",
        steps: [
          { image: "🥣", title: "搅拌材料", note: "把基础材料混在一起" },
          { image: "⏱️", title: "安静等待", note: "让它慢慢变大" },
          { image: "🍞", title: "观察变化", note: "看看面包鼓起来了没有" },
        ],
      },
      {
        id: "oil-water",
        name: "油水分层",
        icon: "🫙",
        color: "from-yellow-400 to-emerald-500",
        steps: [
          { image: "🫗", title: "倒入清水", note: "先准备透明底层" },
          { image: "🛢️", title: "加入食用油", note: "看两种液体分开" },
          { image: "🔬", title: "轻轻晃动", note: "观察它们怎么分层" },
        ],
      },
    ],
  },
  {
    id: "bathroom",
    name: "浴室区",
    icon: "🫧",
    bg: "bg-gradient-to-br from-sky-300 via-cyan-400 to-teal-500",
    experiments: [
      {
        id: "foam",
        name: "泡泡风暴",
        icon: "🫧",
        color: "from-sky-400 to-cyan-500",
        steps: [
          { image: "🧴", title: "加入泡泡液", note: "先放一点洗手液" },
          { image: "💨", title: "轻轻吹气", note: "泡泡会越来越多" },
          { image: "🎈", title: "观察形状", note: "看看泡泡是什么样子" },
        ],
      },
      {
        id: "float",
        name: "沉浮小船",
        icon: "🛶",
        color: "from-teal-400 to-blue-500",
        steps: [
          { image: "🛁", title: "准备水面", note: "让小船先漂起来" },
          { image: "🛶", title: "放入小船", note: "看它会不会下沉" },
          { image: "🪄", title: "调整材料", note: "尝试让它更稳定" },
        ],
      },
    ],
  },
  {
    id: "garden",
    name: "花园区",
    icon: "🌻",
    bg: "bg-gradient-to-br from-green-400 via-lime-500 to-emerald-600",
    experiments: [
      {
        id: "plant",
        name: "种子发芽",
        icon: "🌱",
        color: "from-green-400 to-emerald-500",
        steps: [
          { image: "🌰", title: "放入种子", note: "把种子轻轻放好" },
          { image: "💧", title: "浇一点水", note: "只要一点点就够" },
          { image: "🌱", title: "等待发芽", note: "过几天就会长出来" },
        ],
      },
      {
        id: "shadow",
        name: "影子方向",
        icon: "🕶️",
        color: "from-lime-400 to-green-500",
        steps: [
          { image: "☀️", title: "找到阳光", note: "站到亮亮的地方" },
          { image: "🧍", title: "摆好姿势", note: "看看影子在哪里" },
          { image: "➡️", title: "换个方向", note: "影子会跟着变化" },
        ],
      },
    ],
  },
  {
    id: "workshop",
    name: "魔法工坊",
    icon: "🪄",
    bg: "bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600",
    experiments: [
      {
        id: "magnet",
        name: "磁力寻宝",
        icon: "🧲",
        color: "from-violet-400 to-fuchsia-500",
        steps: [
          { image: "🧲", title: "拿起磁铁", note: "先让磁铁出场" },
          { image: "🔎", title: "寻找宝物", note: "找一找哪些会被吸住" },
          { image: "🎁", title: "收集结果", note: "把找到的宝物放好" },
        ],
      },
      {
        id: "static",
        name: "静电魔法",
        icon: "⚡",
        color: "from-fuchsia-400 to-rose-500",
        steps: [
          { image: "🎈", title: "先准备气球", note: "让气球先充满能量" },
          { image: "🧣", title: "轻轻摩擦", note: "给它一点静电" },
          { image: "🧻", title: "靠近纸屑", note: "纸屑会被吸起来" },
        ],
      },
    ],
  },
];

function ChatComposer() {
  const [input, setInput] = useState("");
  const templates = ["推荐实验", "安全提示", "材料清单", "我要提问"];
  return (
    <MobileCard title="对话式 AI 入口" subtitle="中学版 / 家长 / 老师通用">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {templates.map((item) => (
            <button key={item} type="button" className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
              {item}
            </button>
          ))}
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的实验问题、材料需求或教学建议"
          rows={4}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
        />
        <button disabled={!input.trim()} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
          发送
        </button>
      </div>
    </MobileCard>
  );
}

function PrimaryMagicLab() {
  const [sceneId, setSceneId] = useState(SCENES[0].id);
  const [experimentId, setExperimentId] = useState(SCENES[0].experiments[0].id);
  const [stepIndex, setStepIndex] = useState(0);
  const [voiceHint, setVoiceHint] = useState("点击卡片或说“下”继续");
  const scene = SCENES.find((item) => item.id === sceneId) ?? SCENES[0];
  const experiment = scene.experiments.find((item) => item.id === experimentId) ?? scene.experiments[0];
  const currentStep = experiment.steps[stepIndex] ?? experiment.steps[0];

  const canGoNext = stepIndex < experiment.steps.length - 1;

  const nextStep = () => {
    setStepIndex((current) => {
      if (current >= experiment.steps.length - 1) return current;
      return current + 1;
    });
  };

  const selectExperiment = (id: string) => {
    setExperimentId(id);
    setStepIndex(0);
    setVoiceHint("已进入实验，点图片卡片开始步骤");
  };

  const handleSpeechInput = () => {
    const recognized = ["下", "走", "后"];
    const matched = recognized[0];
    if (matched) {
      nextStep();
      setVoiceHint("已识别语音指令，正在前往下一步");
    }
  };

  return (
    <div className="space-y-4">
      <MobileCard title="小学版魔法实验室" subtitle="横向滑动场景，点击开始冒险">
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {SCENES.map((sceneItem) => {
            const active = sceneItem.id === sceneId;
            return (
              <button
                key={sceneItem.id}
                type="button"
                onClick={() => {
                  setSceneId(sceneItem.id);
                  setExperimentId(sceneItem.experiments[0].id);
                  setStepIndex(0);
                }}
                className={cn(
                  "min-w-[160px] rounded-[28px] p-4 text-left text-white shadow-lg transition active:scale-[0.98]",
                  sceneItem.bg,
                  active ? "ring-4 ring-white/70" : "opacity-90",
                )}
              >
                <div className="text-4xl">{sceneItem.icon}</div>
                <div className="mt-10 text-lg font-black">{sceneItem.name}</div>
                <div className="mt-1 text-xs font-medium text-white/90">静态实验场景</div>
              </button>
            );
          })}
        </div>
      </MobileCard>

      <MobileCard title={`${scene.name} 实验卡片`} subtitle="点一个实验，进入准备页">
        <div className="grid grid-cols-2 gap-3">
          {scene.experiments.map((item) => {
            const active = item.id === experiment.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectExperiment(item.id)}
                className={cn(
                  "rounded-[24px] p-4 text-left text-white shadow-md transition active:scale-[0.98]",
                  `bg-gradient-to-br ${item.color}`,
                  active ? "ring-4 ring-slate-900/20" : "opacity-90",
                )}
              >
                <div className="text-3xl">{item.icon}</div>
                <div className="mt-6 text-base font-black">{item.name}</div>
                <div className="text-xs text-white/90">静态写死 · 2-3 步</div>
              </button>
            );
          })}
        </div>
      </MobileCard>

      <MobileCard title={`${experiment.name} 准备页`} subtitle="整块区域可点，或说“下 / 走 / 后”">
        <button type="button" onClick={nextStep} className="w-full rounded-[28px] border border-orange-200 bg-orange-50 p-4 text-left active:scale-[0.99]">
          <div className="flex items-start gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[24px] bg-white text-5xl shadow-sm">{currentStep.image}</div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold uppercase tracking-[0.2em] text-orange-500">步骤 {stepIndex + 1}/{experiment.steps.length}</div>
              <div className="mt-2 text-xl font-black text-slate-900">{currentStep.title}</div>
              <div className="mt-2 text-sm leading-6 text-slate-600">{currentStep.note}</div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600">
            点击任意位置继续下一步，当前提示：{voiceHint}
          </div>
        </button>
        <div className="mt-3 flex gap-3">
          <button type="button" onClick={handleSpeechInput} className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
            语音指令下一步
          </button>
          <button type="button" onClick={nextStep} disabled={!canGoNext} className="flex-1 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
            下一步
          </button>
        </div>
      </MobileCard>
    </div>
  );
}

function MiddleAndAdultAssistant() {
  return (
    <div className="space-y-4">
      <MobileCard title="对话式 AI 助手" subtitle="中学版 / 家长 / 老师保持原有对话入口">
        <div className="space-y-3 text-sm text-slate-600">
          <p>这里保留通用对话式 AI 界面，可用于提问、解释步骤或生成任务。</p>
          <div className="flex flex-wrap gap-2">
            {["推荐实验", "安全提示", "材料清单", "班级任务", "孩子进度"].map((item) => (
              <button key={item} type="button" className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                {item}
              </button>
            ))}
          </div>
        </div>
      </MobileCard>
      <ChatComposer />
    </div>
  );
}

export default function MobileAssistantPage() {
  const { getSchoolStage } = useMobileContext();
  const stage = getSchoolStage();
  const isPrimary = stage === "primary";
  const content = useMemo(() => (isPrimary ? <PrimaryMagicLab /> : <MiddleAndAdultAssistant />), [isPrimary]);

  return <div className="space-y-4 p-4">{content}</div>;
}
