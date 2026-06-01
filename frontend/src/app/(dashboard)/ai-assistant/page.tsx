"use client"

import { useState, useRef, useEffect, useCallback } from "react"
// 注：react-markdown v10 为 ESM-only，类型通过默认导入解析
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Send, Bot, Loader2, User, ThumbsUp, ThumbsDown, Sparkles, Square, Copy, Check } from "@bs-lab/ui/icons"
import { Button } from "@bs-lab/ui"
import { cn } from "@/lib/utils"
import { postV2AiChat, postV2AiDraftFeedback, fetchAiUserContext } from "@/lib/v2/v2-ai-api"
import { buildApiUrl } from "@/lib/core-api-shared"
import { useSessionActor } from "@/hooks/use-session-actor"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  draftId?: string | null
  /** 流式回复是否还在进行中 */
  streaming?: boolean
}

const WELCOME_SUGGESTIONS = [
  "我想探究沉在水中物体是否受到了水的浮力",
  "我想知道种子发芽需要什么条件",
  "不同颜色吸热不一样吗？我想做实验看看",
  "我想研究一下小苏打和白醋的反应",
]

// ─── Markdown 渲染组件 ─────────────────────────────────

function MdTable({ children }: { children?: React.ReactNode }) {
  return (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse border border-border text-sm">
        {children}
      </table>
    </div>
  )
}

function MdTh({ children }: { children?: React.ReactNode }) {
  return <th className="border border-border px-3 py-1.5 text-left font-medium">{children}</th>
}

function MdTd({ children }: { children?: React.ReactNode }) {
  return <td className="border border-border px-3 py-1.5">{children}</td>
}

function MdUl({ children }: { children?: React.ReactNode }) {
  return <ul className="list-disc pl-5 my-1 space-y-0.5">{children}</ul>
}

function MdOl({ children }: { children?: React.ReactNode }) {
  return <ol className="list-decimal pl-5 my-1 space-y-0.5">{children}</ol>
}

function MdP({ children }: { children?: React.ReactNode }) {
  return <p className="mb-1 last:mb-0">{children}</p>
}

const mdComponents = {
  table: MdTable,
  thead: ({ children }: { children?: React.ReactNode }) => <thead className="bg-muted/50">{children}</thead>,
  th: MdTh,
  td: MdTd,
  ul: MdUl,
  ol: MdOl,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold">{children}</strong>,
  p: MdP,
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-base font-bold mt-3 mb-1">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-sm font-bold mt-2 mb-1">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
  hr: () => <hr className="my-3 border-border" />,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

/** 静默擦除隐式状态标签 [State: ...]，确保学生端不看到内部标记 */
function stripStateTags(content: string): string {
  return content.replace(/\[State: .*?\]/g, "").trim();
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={mdComponents}
    >
      {stripStateTags(content)}
    </ReactMarkdown>
  )
}

/** 对话持久化 key（按用户隔离） */
function storageKey(userId: string): string {
  return `ai-chat-history-${userId}`
}

/** 从 localStorage 恢复对话 */
function loadMessages(userId: string): Message[] {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (raw) return JSON.parse(raw) as Message[]
  } catch { /* ignore */ }
  return []
}

/** 保存对话到 localStorage */
function saveMessages(userId: string, messages: Message[]) {
  try {
    // 只保存非流式消息，且限制条数；同时擦除隐式状态标签
    const clean = messages
      .filter((m) => !m.streaming && m.id !== "welcome")
      .map((m) => ({ ...m, content: stripStateTags(m.content) }))
      .slice(-50)
    localStorage.setItem(storageKey(userId), JSON.stringify(clean))
  } catch { /* ignore */ }
}

export default function AiAssistantPage() {
  const { actor, hydrated } = useSessionActor()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [gradeName, setGradeName] = useState<string | null>(null)
  const [schoolLevelName, setSchoolLevelName] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const initializedRef = useRef(false)
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
      }).catch(() => { /* silent */ })
    }
  }, [hydrated, actor?.userId, actor?.userName, actor])

  // 仅在 hydrated 后初始化：恢复历史对话或设欢迎语
  useEffect(() => {
    if (hydrated && actor?.userId && !initializedRef.current) {
      initializedRef.current = true
      const name = actor.userName?.trim() || "同学"
      const gradePart = gradeName ? `（${gradeName}）` : ""
      const saved = loadMessages(actor.userId)
      if (saved.length > 0) {
        setMessages(saved)
      } else {
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: `${name}你好${gradePart}！我是**石头老师**，专为1-6年级同学设计小学科学实验方案。请告诉我你想探究的科学问题吧~`,
          },
        ])
      }
    }
  }, [hydrated, actor?.userId, actor?.userName, gradeName])

  // 消息变化时自动保存（排除未初始化的空状态）
  useEffect(() => {
    if (hydrated && actor?.userId && initializedRef.current && messages.length > 0) {
      saveMessages(actor.userId, messages)
    }
  }, [messages, hydrated, actor?.userId])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  // 自动调整 textarea 高度
  const adjustTextarea = useCallback(() => {
    const el = inputRef.current
    if (el) {
      el.style.height = "auto"
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`
    }
  }, [])

  // ─── 非流式发送（fallback） ─────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || loading || !hydrated) return

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text }
    // 留一个空位给流式回复
    const assistantMsg: Message = { id: `a-${Date.now()}`, role: "assistant", content: "", streaming: true }
    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setInput("")
    setLoading(true)
    setError(null)
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
    }

    try {
      // 先尝试 SSE 流式
      await streamChat(text, actor.userId, actor.role, actor.userName, assistantMsg.id)
    } catch {
      // SSE 失败则回退到非流式
      try {
        const result = await postV2AiChat(actor, {
          message: text,
          agent_type: actor.role?.replace(/^Role_/, "").toLowerCase(),
          school_level_name: schoolLevelName ?? undefined,
        })
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: result.reply, draftId: result.draftId, streaming: false }
              : m,
          ),
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : "请求失败，请稍后重试"
        setError(msg)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: `抱歉，我遇到了一些问题：${msg}`, streaming: false }
              : m,
          ),
        )
      }
    } finally {
      setLoading(false)
    }
  }, [input, loading, hydrated, actor, schoolLevelName])

  // ─── SSE 流式聊天 ───────────────────────────────────
  const streamChat = useCallback(
    async (text: string, userId: string, userRole: string, userName: string, assistantId: string) => {
      const controller = new AbortController()
      abortRef.current = controller

      const body = JSON.stringify({
        message: text,
        agent_type: userRole.replace(/^Role_/, "").toLowerCase(),
        school_level_name: schoolLevelName ?? undefined,
      })

      const response = await fetch(buildApiUrl("/v2/ai/chat/stream"), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": userId,
          "x-role": userRole,
          "x-user-name": encodeURIComponent(userName),
        },
        body,
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let buffer = ""
      let fullContent = ""
      let draftId: string | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith("data:")) continue
          const jsonStr = trimmed.slice(5).trim()
          if (jsonStr === "[DONE]") continue

          try {
            const json = JSON.parse(jsonStr) as {
              type: "meta" | "token" | "done" | "error"
              data?: string
              logId?: string
              draftId?: string
            }

            if (json.type === "meta") {
              // 收到 logId，无需处理
              continue
            }

            if (json.type === "token" && json.data) {
              fullContent += json.data
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: fullContent, streaming: true } : m,
                ),
              )
            }

            if (json.type === "done") {
              draftId = json.draftId ?? null
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, draftId, streaming: false } : m,
                ),
              )
            }

            if (json.type === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: `抱歉，我遇到了一些问题：${json.data ?? "未知错误"}`, streaming: false }
                    : m,
                ),
              )
            }
          } catch { /* skip malformed SSE lines */ }
        }
      }

      // 流正常结束但没有 done 事件，标记为完成
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId && m.streaming ? { ...m, streaming: false } : m,
        ),
      )
    },
    [schoolLevelName],
  )

  // ─── 停止生成 ──────────────────────────────────────
  const handleStop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setMessages((prev) =>
      prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)),
    )
    setLoading(false)
  }, [])

  // ─── 采纳/拒绝 ──────────────────────────────────────
  const handleAccept = useCallback(
    async (draftId: string) => {
      try {
        await postV2AiDraftFeedback(actor, draftId, { is_accepted: "y" })
      } catch { /* silent */ }
    },
    [actor],
  )

  const handleReject = useCallback(
    async (draftId: string) => {
      try {
        await postV2AiDraftFeedback(actor, draftId, { is_accepted: "n" })
      } catch { /* silent */ }
    },
    [actor],
  )

  // ─── 复制按钮 ──────────────────────────────────────
  const handleCopy = useCallback(async (content: string, msgId: string) => {
    try {
      await navigator.clipboard.writeText(stripStateTags(content))
      setCopiedId(msgId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch { /* silent */ }
  }, [])

  const handleSuggestionClick = useCallback(
    (text: string) => {
      setInput(text)
      setTimeout(() => inputRef.current?.focus(), 50)
    },
    [],
  )

  const isWelcome = messages.length === 1 && messages[0]?.id === "welcome"

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col">
      {/* 页面头部 */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <Bot className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-foreground">石头老师</h1>
          <p className="text-xs text-muted-foreground">小学科学实验方案设计</p>
        </div>
      </div>

      {/* 消息列表 */}
      <div ref={listRef} className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
        {messages.map((msg) => (
          <div key={msg.id}>
            <div
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "flex-row-reverse" : "flex-row",
              )}
            >
              {/* 头像 */}
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  msg.role === "assistant"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {msg.role === "assistant" ? (
                  <Bot className="size-5" />
                ) : (
                  <User className="size-5" />
                )}
              </div>
              {/* 气泡 */}
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "assistant"
                    ? "bg-[#1a1a2e] text-white"
                    : "bg-primary text-primary-foreground",
                )}
              >
                <div className="whitespace-pre-wrap break-words">
                  {msg.role === "assistant" ? (
                    <MarkdownContent content={msg.content} />
                  ) : (
                    stripStateTags(msg.content)
                  )}
                  {msg.streaming && (
                    <span className="inline-flex ml-0.5">
                      <span className="inline-block size-2 bg-white rounded-full animate-pulse" />
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* 操作栏：采纳 / 拒绝 / 复制 */}
            {msg.role === "assistant" && msg.id !== "welcome" && (
              <div className="mt-2 flex items-center justify-end gap-2 pr-3">
                {msg.draftId && (
                  <>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      onClick={() => handleAccept(msg.draftId!)}
                      title="采纳此回答"
                    >
                      <ThumbsUp className="size-3.5" />
                      采纳
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      onClick={() => handleReject(msg.draftId!)}
                      title="不采纳此回答"
                    >
                      <ThumbsDown className="size-3.5" />
                      拒绝
                    </button>
                  </>
                )}
                {!msg.streaming && msg.content && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    onClick={() => handleCopy(msg.content, msg.id)}
                    title="复制到剪贴板"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="size-3.5" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        复制
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* 加载状态（仅非流式加载时显示） */}
        {loading && !messages.some((m) => m.streaming) && (
          <div className="flex items-center gap-2.5 px-12 text-sm text-muted-foreground">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
              <Bot className="size-5 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              思考中…
            </div>
          </div>
        )}

        {/* 欢迎页建议问题 */}
        {isWelcome && !loading && (
          <div className="space-y-3 px-12">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="size-3" />
              试试这些问题
            </p>
            <div className="flex flex-wrap gap-2">
              {WELCOME_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="rounded-full border border-border bg-background px-4 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                  onClick={() => handleSuggestionClick(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部输入区 */}
      <div className="border-t border-border px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-background px-4 py-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                adjustTextarea()
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="输入实验相关问题…"
              disabled={loading || !hydrated}
              rows={1}
              className="min-h-[24px] flex-1 resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
            />
            {loading && messages.some((m) => m.streaming) ? (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="size-9 shrink-0 rounded-xl"
                onClick={handleStop}
                title="停止生成"
              >
                <Square className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                className="size-9 shrink-0 rounded-xl"
                disabled={!input.trim() || loading || !hydrated}
                onClick={handleSend}
              >
                <Send className="size-4" />
              </Button>
            )}
          </div>
          {error && (
            <p className="mt-2 text-xs text-destructive">{error}</p>
          )}
          {!hydrated && (
            <p className="mt-2 text-xs text-muted-foreground">正在加载用户信息，请稍候…</p>
          )}
        </div>
      </div>
    </div>
  )
}
