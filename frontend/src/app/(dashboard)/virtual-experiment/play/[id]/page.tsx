"use client"

import { use, useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "@bs-lab/ui/icons"
import { Button } from "@bs-lab/ui"
import html2canvas from "html2canvas"
import { useSessionActor } from "@/hooks/use-session-actor"
import {
  fetchVirtualExperimentById,
  recordView,
  recordCall,
  updateVirtualExperiment,
  type VirtualExperimentRecord,
} from "@/lib/v2/v2-virtual-experiment-api"
import { buildApiUrl } from "@/lib/core-api-shared"
import { PLAY_MODE_SANDBOX, IFRAME_REFERRER_POLICY } from "@/config/virtual-experiment-sandbox"

interface Props {
  params: Promise<{ id: string }>
}

export default function VirtualExperimentPlayPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()
  const { actor } = useSessionActor()
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [record, setRecord] = useState<VirtualExperimentRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const screenshotTaken = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchVirtualExperimentById(actor, id)
      setRecord(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败")
    } finally {
      setLoading(false)
    }
  }, [actor, id])

  useEffect(() => { load() }, [load])

  // 记录访问 + 调用计数
  useEffect(() => {
    if (record) {
      recordView(actor, id).catch(() => {})
      recordCall(actor, id).catch(() => {})
    }
  }, [actor, id, record])

  // 自动截图：iframe 加载后尝试 html2canvas
  const autoCaptureCover = useCallback(async () => {
    if (!record || screenshotTaken.current) return
    if (record.coverUrl) return // 已有封面，跳过
    if (record.status !== "draft" && record.status !== "rejected") return

    const iframe = iframeRef.current
    if (!iframe) return

    try {
      // 等待 iframe 内容渲染
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // 注：html2canvas 不能直接传 iframe 元素，必须读取 contentDocument.body
      // 跨域时 contentDocument 为 null，截图跳过
      const doc = iframe.contentDocument ?? iframe.contentWindow?.document
      if (!doc) return

      const canvas = await html2canvas(doc.body, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
      })

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
      if (!blob) return

      const file = new File([blob], `cover-${id}.png`, { type: "image/png" })
      const formData = new FormData()
      formData.append("file", file)
      formData.append("biz_type", "virtual_exp_cover")
      formData.append("is_hidden_from_gallery", "1")

      const uploadRes = await fetch(buildApiUrl("/v2/file/upload"), {
        method: "POST",
        body: formData,
        credentials: "include",
      })
      const uploadJson = await uploadRes.json()
      if (uploadJson.success && uploadJson.data?.fileUrl) {
        await updateVirtualExperiment(actor, id, { coverUrl: uploadJson.data.fileUrl })
        screenshotTaken.current = true
        // 刷新记录获取新封面
        load()
      }
    } catch {
      // 静默失败，不阻塞播放体验
    }
  }, [record, actor, id, load])

  // 构建 iframe src
  const iframeSrc = record
    ? record.sourceType === "url"
      ? record.sourceUrl
      : record.fileStorageKey
        ? `/v2/file/serve/${encodeURIComponent(record.fileStorageKey)}`
        : null
    : null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !record) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive mb-4">{error ?? "未找到该实验"}</p>
        <Button variant="outline" onClick={() => router.back()}>返回</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* 顶部栏 */}
      <header className="flex items-center gap-3 px-4 py-2 border-b bg-background shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-sm font-medium truncate flex-1">{record.title}</h1>
        <span className="text-xs text-muted-foreground">
          {record.sourceType === "html_file" ? "HTML 文件" : "URL 内嵌"}
        </span>
        <span className="text-xs text-muted-foreground">
          调用 {record.callCount ?? 0} 次
        </span>
      </header>

      {/* iframe 容器 */}
      <div className="flex-1 bg-gray-50 relative">
        {iframeSrc ? (
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            className="w-full h-full border-0"
            sandbox={PLAY_MODE_SANDBOX}
            referrerPolicy={IFRAME_REFERRER_POLICY}
            title={record.title}
            onLoad={() => autoCaptureCover()}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            无法加载此实验内容
          </div>
        )}
      </div>
    </div>
  )
}
