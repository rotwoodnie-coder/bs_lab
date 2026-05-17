"use client"

import { useState } from "react"
import { Bot } from "@bs-lab/ui/icons"
import { Button } from "@bs-lab/ui"
import { AIAssistantPanel } from "@/components/ai-assistant-panel"

/**
 * AI 浮动入口（完全独立组件）
 *
 * 不依赖任何布局上下文，只负责渲染右下角的 AI 助教按钮和侧边面板。
 * 将此组件放在任意 layout 或 page 中即可启用，不修改任何现有组件。
 */
export function AIFloatEntry() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="fixed bottom-20 right-6 z-50">
        <Button
          size="sm"
          className="gap-1.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
          onClick={() => setOpen(true)}
          aria-label="AI 助教"
        >
          <Bot className="size-3.5" />
          <span className="text-xs font-medium">AI 助教</span>
        </Button>
      </div>
      <AIAssistantPanel open={open} onOpenChange={setOpen} />
    </>
  )
}
