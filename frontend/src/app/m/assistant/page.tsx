"use client";

import { useState } from "react";
import { MobileCard } from "@/components/mobile/MobileCard";

export default function MobileAssistantPage() {
  const [input, setInput] = useState("");

  return (
    <div className="space-y-4 p-4">
      <MobileCard title="魔法球" subtitle="AI 实验助手（骨架）">
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>在此输入你的实验想法，AI 会帮你生成步骤指导和注意事项。</p>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="描述你想做的实验..."
            rows={4}
            className="w-full rounded-2xl border px-4 py-3"
          />
          <button
            disabled={!input.trim()}
            className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            生成指导（待接入 AI）
          </button>
        </div>
      </MobileCard>
    </div>
  );
}
