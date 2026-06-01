"use client"

import { useState, useEffect, useRef } from "react"
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@bs-lab/ui"
import {
  updateVirtualExperiment,
  uploadVirtualExperimentHtmlFile,
  type VirtualExperimentRecord,
  type CoreApiActor,
  type VirtualExperimentSourceType,
} from "@/lib/v2/v2-virtual-experiment-api"

interface EditExperimentDialogProps {
  actor: CoreApiActor
  record: VirtualExperimentRecord
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
}

export function EditExperimentDialog({ actor, record, open, onOpenChange, onUpdated }: EditExperimentDialogProps) {
  const sourceType = record.sourceType as VirtualExperimentSourceType

  // ─── 通用字段 ────────────────────────────────────────
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  // ─── URL 模式专属 ──────────────────────────────────
  const [sourceUrl, setSourceUrl] = useState("")

  // ─── HTML 模式专属 ──────────────────────────────────
  const [htmlFile, setHtmlFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 对话框打开时回填现有数据
  useEffect(() => {
    if (open) {
      setTitle(record.title)
      setDescription(record.description ?? "")
      setSourceUrl(record.sourceUrl ?? "")
      setHtmlFile(null)
      setError(null)
      setUploading(false)
      setSubmitting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [open, record])

  const handleSubmit = async () => {
    if (!title.trim()) { setError("名称不能为空"); return }

    if (sourceType === "url" && !sourceUrl.trim()) {
      setError("外部 URL 不能为空"); return
    }

    setSubmitting(true)
    setError(null)

    try {
      let fileStorageKey: string | undefined
      let fileName: string | undefined
      let fileSize: number | undefined
      let newSourceUrl: string | undefined

      if (sourceType === "html_file" && htmlFile) {
        // 先上传新 HTML 文件到 S3
        setUploading(true)
        const uploadResult = await uploadVirtualExperimentHtmlFile(htmlFile, actor)
        setUploading(false)
        fileStorageKey = uploadResult.storageKey
        fileName = uploadResult.fileName
        fileSize = uploadResult.fileSize
        // html_file 的 sourceUrl 由预签名动态生成，无需前端传入
        newSourceUrl = undefined
      } else if (sourceType === "url") {
        newSourceUrl = sourceUrl.trim()
      }

      // 构造更新参数
      const updateInput: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
      }

      if (sourceType === "url") {
        updateInput.sourceUrl = newSourceUrl
      } else if (sourceType === "html_file") {
        if (fileStorageKey) {
          updateInput.fileStorageKey = fileStorageKey
          updateInput.fileName = fileName
          updateInput.fileSize = fileSize
        }
      }

      await updateVirtualExperiment(actor, record.id, updateInput as Parameters<typeof updateVirtualExperiment>[2])

      onUpdated()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败")
    } finally {
      setUploading(false)
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑虚拟实验</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && (
            <div className="p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">{error}</div>
          )}

          {/* 通用字段 */}
          <div>
            <label className="block text-sm font-medium mb-1">实验名称</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <textarea
              className="w-full px-3 py-2 text-sm border rounded-md resize-none"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* 来源类型标识（只读） */}
          <div className="text-xs text-muted-foreground">
            来源类型：{sourceType === "url" ? "URL 内嵌" : "HTML 文件上传"}
          </div>

          {/* URL 模式：可编辑 sourceUrl */}
          {sourceType === "url" && (
            <div>
              <label className="block text-sm font-medium mb-1">外部 URL</label>
              <Input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://phet.colorado.edu/sims/html/..."
              />
            </div>
          )}

          {/* HTML 模式：显示当前文件 + 重新上传 */}
          {sourceType === "html_file" && (
            <div>
              <label className="block text-sm font-medium mb-1">实验文件</label>
              <div className="p-3 bg-muted/30 border rounded-md text-sm text-muted-foreground mb-2">
                当前文件：{record.fileName ?? "（无文件）"}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm"
                className="block w-full text-sm text-gray-500
                  file:mr-3 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90
                  file:cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  if (file) {
                    const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : ""
                    if (ext !== "html" && ext !== "htm") {
                      setError("仅支持 .html 文件")
                      setHtmlFile(null)
                      return
                    }
                    if (file.size > 10 * 1024 * 1024) {
                      setError("文件大小不能超过 10MB")
                      setHtmlFile(null)
                      return
                    }
                  }
                  setHtmlFile(file)
                  setError(null)
                }}
              />
              {htmlFile && (
                <p className="mt-1 text-xs text-muted-foreground">
                  新文件：{htmlFile.name}（{(htmlFile.size / 1024 / 1024).toFixed(2)} MB） — 保存后将替换旧文件
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSubmit} disabled={submitting || uploading}>
            {uploading ? "上传文件中..." : submitting ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
