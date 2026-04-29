"use client"

import { useState, useRef, useEffect } from "react"
import { X, Send, Bot, Sparkles, Loader2, User } from "@bs-lab/ui/icons"
import { Button } from "@bs-lab/ui"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@bs-lab/ui"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface AIAssistantPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AIAssistantPanel({ open, onOpenChange }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "您好！我是 AI 助教。您可以向我提问实验教学相关的问题。",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    // 待接入真实 AI API
    setLoading(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Bot className="size-5 text-primary" />
            <SheetTitle className="text-base">AI 助教</SheetTitle>
          </div>
          <p className="text-xs text-muted-foreground">等待真实 AI API 接入</p>
        </SheetHeader>

        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "flex-row-reverse" : "flex-row",
              )}
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full",
                  msg.role === "assistant"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {msg.role === "assistant" ? (
                  <Bot className="size-4" />
                ) : (
                  <User className="size-4" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  msg.role === "assistant"
                    ? "bg-muted text-foreground"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              思考中…
            </div>
          )}
        </div>

        <div className="border-t border-border px-6 py-4">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="在此输入问题…"
              disabled={loading}
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8 shrink-0"
              disabled={!input.trim() || loading}
              onClick={handleSend}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
