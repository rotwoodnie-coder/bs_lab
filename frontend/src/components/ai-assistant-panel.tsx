"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Bot, Loader2, User, ThumbsUp, ThumbsDown } from "@bs-lab/ui/icons"
import { Button } from "@bs-lab/ui"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@bs-lab/ui"
import { cn } from "@/lib/utils"
import { postV2AiChat, postV2AiDraftFeedback, fetchAiUserContext } from "@/lib/v2/v2-ai-api"
import { useSessionActor } from "@/hooks/use-session-actor"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  /** 草稿 ID，用于采纳/拒绝反馈 */
  draftId?: string | null
}

interface AIAssistantPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const WELCOME_SUGGESTIONS = [
  "我想探究沉在水中物体是否受到了水的浮力",
  "我想知道种子发芽需要什么条件",
  "不同颜色吸热不一样吗？我想做实验看看",
  "我想研究一下小苏打和白醋的反应",
]

/** 根据姓名和年级生成个性化欢迎语 */
function buildWelcomeContent(name: string, gradePart: string): string {
  const displayName = name?.trim() || "同学"
  return `${displayName}你好${gradePart}！我是**石头老师**，专为1-6年级同学设计小学科学实验方案。请告诉我你想探究的科学问题吧~`
}

export function AIAssistantPanel({ open, onOpenChange }: AIAssistantPanelProps) {
  const { actor, hydrated } = useSessionActor()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "同学你好！我是**石头老师**，专为1-6年级同学设计小学科学实验方案。请告诉我你想探究的科学问题吧~",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gradeName, setGradeName] = useState<string | null>(null)
  const [schoolLevelName, setSchoolLevelName] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const ctxFetchedRef = useRef(false)

  //  hydrated 后获取用户年级信息并更新欢迎语
  useEffect(() => {
    if (hydrated && actor?.userId && !ctxFetchedRef.current) {
      ctxFetchedRef.current = true
      const name = actor.userName?.trim() || "同学"

      // 尝试从 localStorage 恢复缓存的年级
      const cached = localStorage.getItem(`ai-grade-${actor.userId}`)
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as { gradeName: string | null; schoolLevelName: string | null }
          if (parsed.gradeName || parsed.schoolLevelName) {
            setGradeName(parsed.gradeName)
            setSchoolLevelName(parsed.schoolLevelName)
            const gradePart = parsed.gradeName ? `（${parsed.gradeName}）` : ""
            setMessages([
              { id: "welcome", role: "assistant", content: buildWelcomeContent(name, gradePart) },
            ])
          }
        } catch { /* ignore */ }
      }

      // 异步获取最新年级信息
      fetchAiUserContext(actor).then((ctx) => {
        setGradeName(ctx.gradeName)
        setSchoolLevelName(ctx.schoolLevelName)
        if (ctx.gradeName || ctx.schoolLevelName) {
          localStorage.setItem(`ai-grade-${actor.userId}`, JSON.stringify(ctx))
        }
        const gradePart = ctx.gradeName ? `（${ctx.gradeName}）` : ""
        setMessages([
          { id: "welcome", role: "assistant", content: buildWelcomeContent(name, gradePart) },
        ])
      }).catch(() => {
        // 静默，保留已有 welcome
      })
    }
  }, [hydrated, actor?.userId, actor?.userName, actor])

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

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || loading || !hydrated) return

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)
    setError(null)

    try {
      const result = await postV2AiChat(actor, {
        message: text,
        agent_type: actor.role?.replace(/^Role_/, "").toLowerCase(),
        school_level_name: schoolLevelName ?? undefined,
      })
      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: result.reply,
        draftId: result.draftId,
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      const msg = err instanceof Error ? err.message : "请求失败，请稍后重试"
      setError(msg)
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `抱歉，我遇到了一些问题：${msg}`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, hydrated, actor, schoolLevelName])

  /** 采纳 */
  const handleAccept = useCallback(async (draftId: string) => {
    try {
      await postV2AiDraftFeedback(actor, draftId, { is_accepted: "y" })
    } catch { /* silent */ }
  }, [actor])

  /** 拒绝 */
  const handleReject = useCallback(async (draftId: string) => {
    try {
      await postV2AiDraftFeedback(actor, draftId, { is_accepted: "n" })
    } catch { /* silent */ }
  }, [actor])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Bot className="size-5 text-primary" />
            <SheetTitle className="text-base">石头老师</SheetTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            小学科学实验方案设计
          </p>
        </SheetHeader>

        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {messages.map((msg) => (
            <div key={msg.id}>
              <div
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
                  {/* 使用 white-space: pre-wrap 保留换行 */}
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                </div>
              </div>
              {/* AI 回复底部操作栏：采纳 / 拒绝 */}
              {msg.role === "assistant" && msg.draftId && msg.id !== "welcome" && (
                <div className="mt-1 flex items-center justify-end gap-2 pr-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    onClick={() => handleAccept(msg.draftId!)}
                    title="采纳此回答"
                  >
                    <ThumbsUp className="size-3" />
                    采纳
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    onClick={() => handleReject(msg.draftId!)}
                    title="不采纳此回答"
                  >
                    <ThumbsDown className="size-3" />
                    拒绝
                  </button>
                </div>
              )}
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
              disabled={loading || !hydrated}
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8 shrink-0"
              disabled={!input.trim() || loading || !hydrated}
              onClick={handleSend}
            >
              <Send className="size-4" />
            </Button>
          </div>
          {error && (
            <p className="mt-1 text-xs text-destructive">{error}</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
