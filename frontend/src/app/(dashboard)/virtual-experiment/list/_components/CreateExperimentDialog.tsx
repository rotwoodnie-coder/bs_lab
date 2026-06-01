"use client"

import { useState, useRef, useEffect } from "react"
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@bs-lab/ui"
import {
  createVirtualExperiment,
  uploadVirtualExperimentHtmlFile,
  type CoreApiActor,
  type VirtualExperimentSourceType,
} from "@/lib/v2/v2-virtual-experiment-api"

interface CreateExperimentDialogProps {
  actor: CoreApiActor
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CreateExperimentDialog({ actor, open, onOpenChange, onCreated }: CreateExperimentDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [sourceType, setSourceType] = useState<VirtualExperimentSourceType>("url")
  const [sourceUrl, setSourceUrl] = useState("")
  const [htmlFile, setHtmlFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 对话框打开时重置所有状态
  useEffect(() => {
    if (open) {
      setTitle(""); setDescription(""); setSourceUrl(""); setHtmlFile(null)
      setSourceType("url"); setError(null); setUploading(false); setSubmitting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [open])

  const handleSubmit = async () => {
    if (!title.trim()) { setError("请输入实验名称"); return }
    if (sourceType === "url" && !sourceUrl.trim()) { setError("请输入外部 URL"); return }
    if (sourceType === "html_file" && !htmlFile) { setError("请选择 HTML 文件"); return }

    setSubmitting(true)
    setError(null)

    try {
      let fileStorageKey: string | undefined
      let fileName: string | undefined
      let fileSize: number | undefined

      // 先上传 HTML 文件
      if (sourceType === "html_file" && htmlFile) {
        setUploading(true)
        const uploadResult = await uploadVirtualExperimentHtmlFile(htmlFile, actor)
        setUploading(false)
        fileStorageKey = uploadResult.storageKey
        fileName = uploadResult.fileName
        fileSize = uploadResult.fileSize
      }

      // 再创建实验记录
      await createVirtualExperiment(actor, {
        title: title.trim(),
        description: description.trim() || undefined,
        sourceType,
        sourceUrl: sourceUrl.trim() || undefined,
        fileStorageKey,
        fileName,
        fileSize,
      })

      setTitle(""); setDescription(""); setSourceUrl(""); setHtmlFile(null)
      onCreated()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败")
    } finally {
      setUploading(false)
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>新增虚拟实验</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && (
            <div className="p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">实验名称 *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：光的折射实验" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">实验描述</label>
            <textarea
              className="w-full px-3 py-2 text-sm border rounded-md resize-none"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要描述实验内容..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">来源类型</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sourceType"
                  checked={sourceType === "url"}
                  onChange={() => { setSourceType("url"); setError(null) }}
                />
                <span className="text-sm">URL 内嵌</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sourceType"
                  checked={sourceType === "html_file"}
                  onChange={() => { setSourceType("html_file"); setError(null) }}
                />
                <span className="text-sm">HTML 文件上传</span>
              </label>
            </div>
          </div>

          {sourceType === "url" ? (
            <div>
              <label className="block text-sm font-medium mb-1">外部 URL *</label>
              <Input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://phet.colorado.edu/sims/html/..."
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1">HTML 文件 *</label>
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
                  // 客户端校验
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
                  已选择：{htmlFile.name}（{(htmlFile.size / 1024 / 1024).toFixed(2)} MB）
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSubmit} disabled={submitting || uploading}>
            {uploading ? "上传文件中..." : submitting ? "创建中..." : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
