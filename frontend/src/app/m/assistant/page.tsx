"use client";

import { useEffect, useMemo, useState } from "react";
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
      (window as Window & {
        SpeechRecognition?: SpeechRecognitionCtor;
        webkitSpeechRecognition?: SpeechRecognitionCtor;
      }).SpeechRecognition ??
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

    recognition.onerror = () => {
      // Ignore transient browser recognition errors.
    };

    recognition.onend = () => {
      try {
        recognition.start();
      } catch {
        // Some browsers throw if start() is called while already active.
      }
    };

    try {
      recognition.start();
    } catch {
      // Permission may be blocked until the user interacts with the page.
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

function AssistantImmersiveExperience() {
  const [sceneId, setSceneId] = useState(SCENES[0].id);
  const [stepIndex, setStepIndex] = useState(0);
  const [voiceStatus, setVoiceStatus] = useState("等待语音指令");

  const scene = SCENES.find((item) => item.id === sceneId) ?? SCENES[0];
  const sceneCopy = ASSISTANT_COPY[scene.id] ?? ASSISTANT_COPY.kitchen;
  const step = scene.steps[stepIndex] ?? scene.steps[scene.steps.length - 1];
  const canGoNext = stepIndex < scene.steps.length - 1;

  const nextStep = () => {
    setStepIndex((current) => {
      if (current >= scene.steps.length - 1) return current;
      return current + 1;
    });
    setVoiceStatus("已进入下一步");
  };

  const handleSceneChange = (nextSceneId: string) => {
    setSceneId(nextSceneId);
    setStepIndex(0);
    setVoiceStatus("已切换场景");
  };

  useVoiceNext(() => {
    setVoiceStatus("已识别“下 / 走 / 后”");
    nextStep();
  });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={nextStep}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          nextStep();
        }
      }}
      className={cn(
        "relative flex min-h-dvh w-full flex-col overflow-hidden text-left text-white outline-none",
        "bg-gradient-to-br",
        scene.gradient,
      )}
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
        .magic-avatar span,
        .magic-avatar svg {
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(255,255,255,0.18),_transparent_28%)]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/15 to-transparent" />

      <div className="relative z-10 flex min-h-dvh flex-col px-5 pb-6 pt-8 sm:px-8 sm:pt-10">
        <div className="flex items-start justify-between gap-4">
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
              onClick={() => handleSceneChange(item.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                item.id === scene.id
                  ? "border-white/60 bg-white/22 shadow-lg"
                  : "border-white/16 bg-white/10 text-white/82 hover:bg-white/16",
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
          <div className="text-2xl font-black sm:text-3xl">点击任意位置继续</div>
          <div className="mt-3 text-sm font-medium text-white/78">或说“下”继续</div>
          <div className="mt-4 text-xs text-white/70">语音状态：{voiceStatus}</div>
          <div className="mt-2 text-xs text-white/60">当前场景：{scene.name}</div>
          <div className="mt-4 inline-flex rounded-full bg-white/12 px-4 py-2 text-xs font-semibold text-white/90">
            {canGoNext ? "继续后将进入下一步" : "已到最后一步"}
          </div>
        </div>
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
  const content = useMemo(() => (isPrimary ? <AssistantImmersiveExperience /> : <MiddleAndAdultAssistant />), [isPrimary]);

  return content;
}
