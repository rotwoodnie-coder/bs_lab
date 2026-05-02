"use client";

import { useEffect, useState } from "react";
import { useMobileContext } from "@/contexts/MobileContext";
import { cn } from "@/lib/utils";

type Scene = {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  title: string;
  subtitle: string;
  steps: StepItem[];
};

type StepItem = {
  image: string;
  title: string;
  note: string;
};

type ViewMode = "scene" | "experience";

const SCENES: Scene[] = [
  {
    id: "kitchen",
    name: "厨房区",
    emoji: "🍳",
    gradient: "from-amber-500 via-orange-500 to-rose-600",
    title: "美味实验台",
    subtitle: "今天在厨房里试试新的科学魔法。",
    steps: [
      { image: "🥣", title: "准备材料", note: "先把食材和器具摆整齐。" },
      { image: "🔥", title: "小火观察", note: "留意温度和变化。" },
      { image: "🍪", title: "完成实验", note: "最后会得到惊喜作品。" },
    ],
  },
  {
    id: "island",
    name: "科学岛",
    emoji: "🌋",
    gradient: "from-cyan-500 via-sky-500 to-blue-700",
    title: "小火山喷发",
    subtitle: "先观察，再点下一步，火山会慢慢苏醒。",
    steps: [
      { image: "🧪", title: "放入小苏打", note: "先把材料放进火山杯里。" },
      { image: "🍋", title: "倒入酸液", note: "看泡泡慢慢冒出来。" },
      { image: "✨", title: "等待喷发", note: "最后火山会涌出来。" },
    ],
  },
  {
    id: "rainbow",
    name: "彩虹雨云",
    emoji: "🌈",
    gradient: "from-fuchsia-500 via-violet-500 to-indigo-700",
    title: "彩虹雨云",
    subtitle: "云朵、雨点和彩虹会依次出现。",
    steps: [
      { image: "☁️", title: "准备云朵", note: "先把云朵放到天空里。" },
      { image: "💧", title: "滴入雨点", note: "彩色雨滴会慢慢落下。" },
      { image: "🌦️", title: "出现彩虹", note: "最后彩虹会浮现出来。" },
    ],
  },
  {
    id: "garden",
    name: "花园区",
    emoji: "🌻",
    gradient: "from-emerald-500 via-lime-500 to-green-700",
    title: "种子发芽",
    subtitle: "静静等待，种子会慢慢长大。",
    steps: [
      { image: "🌰", title: "放入种子", note: "把种子轻轻放好。" },
      { image: "💧", title: "浇一点水", note: "只要一点点就足够。" },
      { image: "🌱", title: "等待发芽", note: "过几天它会长出来。" },
    ],
  },
];

const ASSISTANT_COPY: Record<string, { title: string; subtitle: string; icon: string }> = {
  kitchen: { title: "今天做什么好吃的实验？", subtitle: "魔法教授会帮你把每一步都变得更有趣。", icon: "🧙‍♂️" },
  island: { title: "火山准备好了吗？", subtitle: "观察颜色、泡泡和喷发节奏，像真正的教授一样。", icon: "🌋" },
  rainbow: { title: "让彩虹从云里出现吧！", subtitle: "跟着步骤走，下一秒就能看到漂亮变化。", icon: "🌈" },
  garden: { title: "种子会怎么长大呢？", subtitle: "耐心一点，魔法教授陪你看见生长过程。", icon: "🌱" },
};

function useVoiceNext(onNext: () => void) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    type SpeechRecognitionResultLike = { 0: { transcript?: string } };
    type SpeechRecognitionEventLike = { results: ArrayLike<SpeechRecognitionResultLike>; resultIndex: number };
    type SpeechRecognitionLike = {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onresult: ((event: SpeechRecognitionEventLike) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
    };
    type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

    const SpeechRecognitionImpl =
      (window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ??
      (window as Window & { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) return;

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = "zh-CN";
    recognition.continuous = true;
    recognition.interimResults = true;

    const triggerWords = ["下", "走", "后"];

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .map((result) => result[0]?.transcript ?? "")
        .join("");

      if (triggerWords.some((word) => transcript.includes(word))) {
        onNext();
      }
    };

    recognition.onerror = () => {};
    recognition.onend = () => {
      try {
        recognition.start();
      } catch {
        // noop
      }
    };

    try {
      recognition.start();
    } catch {
      // Permission may be blocked until user interaction.
    }

    return () => {
      recognition.onend = null;
      recognition.onresult = null;
      recognition.onerror = null;
      try {
        recognition.stop();
      } catch {
        // noop
      }
    };
  }, [onNext]);
}

function AssistantImmersiveExperience({ onExit, initialSceneId }: { onExit: () => void; initialSceneId: string }) {
  const [sceneId, setSceneId] = useState(initialSceneId);
  const [stepIndex, setStepIndex] = useState(0);
  const [showEndOptions, setShowEndOptions] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("等待语音指令");

  const scene = SCENES.find((item) => item.id === sceneId) ?? SCENES[0];
  const sceneCopy = ASSISTANT_COPY[scene.id] ?? ASSISTANT_COPY.kitchen;
  const step = scene.steps[stepIndex] ?? scene.steps[scene.steps.length - 1];
  const isLastStep = stepIndex >= scene.steps.length - 1;

  const goNext = () => {
    if (!isLastStep) {
      setStepIndex((current) => current + 1);
      setVoiceStatus("已进入下一步");
      return;
    }
    setShowEndOptions(true);
  };

  const restartExperiment = () => {
    setStepIndex(0);
    setShowEndOptions(false);
    setVoiceStatus("已重新开始实验");
  };

  const returnToSceneCards = () => {
    setShowEndOptions(false);
    onExit();
  };

  useVoiceNext(() => {
    setVoiceStatus("已识别“下 / 走 / 后”");
    goNext();
  });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goNext}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          goNext();
        }
      }}
      className={cn("relative flex min-h-dvh w-full flex-col overflow-hidden text-left text-white outline-none", "bg-gradient-to-br", scene.gradient)}
    >
      <style jsx>{`
        .magic-avatar {
          position: relative;
          width: 56px;
          height: 56px;
          border-radius: 9999px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.38);
          box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.45);
          animation: pulseGlow 2.2s ease-in-out infinite;
        }
        .magic-avatar::after {
          content: "";
          position: absolute;
          inset: -10px;
          border-radius: inherit;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.28), transparent 68%);
          filter: blur(8px);
          z-index: 0;
        }
        .magic-avatar span {
          position: relative;
          z-index: 1;
        }
        .scene-bubble {
          position: relative;
          animation: bubbleFadeIn 320ms ease-out both;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .scene-bubble::before {
          content: "";
          position: absolute;
          left: 28px;
          top: -10px;
          width: 18px;
          height: 18px;
          background: rgba(255, 255, 255, 0.24);
          transform: rotate(45deg);
          border-left: 1px solid rgba(255, 255, 255, 0.18);
          border-top: 1px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(14px);
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.36), 0 0 18px rgba(255, 255, 255, 0.28); transform: scale(1); }
          50% { box-shadow: 0 0 0 14px rgba(255, 255, 255, 0), 0 0 28px rgba(255, 255, 255, 0.48); transform: scale(1.03); }
        }
        @keyframes bubbleFadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onExit();
        }}
        aria-label="返回场景卡片"
        className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/18 text-lg font-black text-white backdrop-blur-md transition hover:bg-white/26 active:scale-95"
      >
        ←
      </button>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(255,255,255,0.18),_transparent_28%)]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/15 to-transparent" />

      <div className="relative z-10 flex min-h-dvh flex-col px-5 pb-6 pt-8 sm:px-8 sm:pt-10">
        <div className="flex items-start justify-between gap-4 pl-12 sm:pl-14">
          <div className="flex items-start gap-4">
            <div className="magic-avatar text-2xl sm:text-3xl" aria-hidden="true">
              <span>{sceneCopy.icon}</span>
            </div>
            <div>
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
                魔法教授 · {scene.name}
              </div>
              <div className="scene-bubble mt-4 inline-flex max-w-2xl flex-col rounded-[1.8rem] border border-white/22 bg-white/22 px-5 py-4 text-slate-900 shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
                <div className="text-base font-extrabold sm:text-lg">{sceneCopy.title}</div>
                <p className="mt-1 text-sm leading-6 text-slate-800/90 sm:text-base">{sceneCopy.subtitle}</p>
              </div>
            </div>
          </div>
          <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
            静态预演
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">
          {SCENES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSceneId(item.id);
                setStepIndex(0);
                setShowEndOptions(false);
                setVoiceStatus("已切换场景");
              }}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                item.id === scene.id ? "border-white/60 bg-white/22 shadow-lg" : "border-white/16 bg-white/10 text-white/82 hover:bg-white/16",
              )}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="scene-bubble mt-8 flex-1 rounded-[1.75rem] border border-white/20 bg-white/20 p-4 shadow-[0_24px_60px_rgba(2,6,23,0.18)] sm:mt-10 sm:p-6 before:pointer-events-none">
          <div className="flex items-center justify-between text-sm font-semibold text-white/90">
            <span>图片化步骤</span>
            <span>
              {stepIndex + 1}/{scene.steps.length}
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {scene.steps.map((item, index) => {
              const active = index === stepIndex;
              return (
                <div
                  key={item.title}
                  className={cn(
                    "rounded-[1.75rem] border p-4 transition-all",
                    active ? "border-white/60 bg-white/18 shadow-xl scale-[1.02]" : "border-white/16 bg-white/8 opacity-85",
                  )}
                >
                  <div className="flex h-28 items-center justify-center rounded-[1.4rem] bg-white/90 text-5xl text-slate-900 shadow-sm">
                    {item.image}
                  </div>
                  <div className="mt-4 text-lg font-black">{item.title}</div>
                  <p className="mt-2 text-sm leading-6 text-white/82">{item.note}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-white/18 bg-black/10 px-4 py-4 text-sm text-white/85">
            <div className="font-semibold text-white">当前步骤</div>
            <div className="mt-1 text-base font-bold">{step.title}</div>
            <div className="mt-1 leading-6">{step.note}</div>
          </div>
        </div>

        <div className="mt-5 flex-1 rounded-[2rem] border border-dashed border-white/35 bg-white/8 px-6 py-8 text-center backdrop-blur-sm sm:mt-6 sm:py-10">
          <div className="text-2xl font-black sm:text-3xl">{isLastStep ? "完成实验！" : "点击任意位置继续"}</div>
          <div className="mt-3 text-sm font-medium text-white/78">{isLastStep ? "点击后选择下一步操作" : "或说“下”继续"}</div>
          <div className="mt-4 text-xs text-white/70">语音状态：{voiceStatus}</div>
          <div className="mt-2 text-xs text-white/60">当前场景：{scene.name}</div>
          <div className="mt-4 inline-flex rounded-full bg-white/12 px-4 py-2 text-xs font-semibold text-white/90">
            {isLastStep ? "完成实验！" : "继续后将进入下一步"}
          </div>
        </div>
      </div>

      {showEndOptions ? (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[1.75rem] border border-white/30 bg-white p-4 text-slate-900 shadow-2xl">
            <div className="text-lg font-black">实验完成</div>
            <div className="mt-1 text-sm text-slate-600">请选择接下来的操作。</div>
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  restartExperiment();
                }}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              >
                再做一次
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  returnToSceneCards();
                }}
                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900"
              >
                返回场景
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SceneCardSelection({ onEnter }: { onEnter: (sceneId: string) => void }) {
  return (
    <div className="space-y-4 p-4">
      <div className="rounded-[1.75rem] border border-white/60 bg-white/85 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="text-2xl font-black text-slate-900">实验准备页</div>
        <p className="mt-2 text-sm leading-6 text-slate-600">选择一个场景后进入全屏准备模式，所有内容均为静态数据。</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SCENES.map((scene) => (
          <button
            key={scene.id}
            type="button"
            onClick={() => onEnter(scene.id)}
            className={cn("rounded-[1.75rem] p-4 text-left text-white shadow-lg transition active:scale-[0.99]", "bg-gradient-to-br", scene.gradient)}
          >
            <div className="text-4xl">{scene.emoji}</div>
            <div className="mt-8 text-lg font-black">{scene.title}</div>
            <div className="mt-1 text-xs font-medium text-white/90">点击进入全屏准备页</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MiddleAndAdultAssistant() {
  return <div className="space-y-4 p-4">中学/家长/老师模式保持原有入口</div>;
}

export default function MobileAssistantPage() {
  const { getSchoolStage } = useMobileContext();
  const stage = getSchoolStage();
  const isPrimary = stage === "primary";
  const [viewMode, setViewMode] = useState<ViewMode>("scene");
  const [selectedSceneId, setSelectedSceneId] = useState(SCENES[0].id);

  useEffect(() => {
    if (!isPrimary) {
      setViewMode("scene");
    }
  }, [isPrimary]);

  if (!isPrimary) {
    return <MiddleAndAdultAssistant />;
  }

  if (viewMode === "experience") {
    return (
      <AssistantImmersiveExperience
        initialSceneId={selectedSceneId}
        onExit={() => {
          setViewMode("scene");
        }}
      />
    );
  }

  return (
    <div className="space-y-4 p-4">
      <SceneCardSelection
        onEnter={(sceneId) => {
          setSelectedSceneId(sceneId);
          setViewMode("experience");
        }}
      />
    </div>
  );
}
