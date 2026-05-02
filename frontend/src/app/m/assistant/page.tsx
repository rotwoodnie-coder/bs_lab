"use client";

import { useState } from "react";
import { MobileCard } from "@/components/mobile/MobileCard";
import { useMobileContext } from "@/contexts/MobileContext";
import { cn } from "@/lib/utils";

const PRIMARY_GUIDE = {
  title: "🎨 魔法实验室",
  subtitle: "选择场景卡片，开始你的科学冒险！横向滑动可切换科学岛、厨房区、魔法工坊等场景。",
  accent: "from-rose-400 via-amber-400 to-yellow-400",
  cardTone: "bg-white/90 border-white/60 shadow-xl shadow-orange-200/40",
  badge: "科学岛 · 厨房区 · 魔法工坊",
  hint: "横向滑动，探索更多场景",
} as const;

const MIDDLE_GUIDE = {
  title: "💬 AI 对话助手",
  subtitle: "输入你的实验问题，AI 助手会帮你生成步骤指导和注意事项。",
  accent: "from-slate-500 via-slate-600 to-slate-700",
  cardTone: "bg-slate-50 border-slate-200 shadow-sm",
  badge: "实验问题 · 步骤指导 · 注意事项",
  hint: "输入问题，获取静态引导示例",
} as const;

export default function MobileAssistantPage() {
  const [input, setInput] = useState("");
  const { getSchoolStage } = useMobileContext();
  const stage = getSchoolStage();
  const guide = stage === "primary" ? PRIMARY_GUIDE : MIDDLE_GUIDE;

  return (
    <div className="space-y-4 p-4">
      <div
        className={cn(
          "overflow-hidden rounded-[2rem] border p-5",
          stage === "primary"
            ? "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100"
            : "bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200",
        )}
      >
        <div className={cn("rounded-[1.75rem] border p-4", guide.cardTone)}>
          <div className={cn("h-24 rounded-[1.5rem] bg-gradient-to-br", guide.accent)} />
          <div className="mt-4 space-y-2">
            <div className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">
              {guide.badge}
            </div>
            <h1 className="text-2xl font-black leading-tight text-slate-900">{guide.title}</h1>
            <p className="text-sm leading-6 text-slate-600">{guide.subtitle}</p>
            <div className={cn("rounded-2xl px-3 py-2 text-xs font-medium", stage === "primary" ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-700")}>{guide.hint}</div>
          </div>
        </div>
      </div>

      <MobileCard title="魔法球" subtitle="AI 实验助手（骨架）">
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>{stage === "primary" ? "🎮 小学版游戏化场景将在二期开放，敬请期待！" : "🧭 中学版将保留对话式入口，便于快速提问和获取步骤建议。"}</p>
          <p>{guide.subtitle}</p>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={stage === "primary" ? "描述你想去的场景或想做的实验..." : "描述你想咨询的实验问题..."}
            rows={4}
            className="w-full rounded-2xl border px-4 py-3"
          />
          <button
            disabled={!input.trim()}
            className={cn(
              "w-full rounded-2xl px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50",
              stage === "primary" ? "bg-primary" : "bg-slate-800",
            )}
          >
            生成指导（待接入 AI）
          </button>
        </div>
      </MobileCard>
    </div>
  );
}
