'use client'

import * as React from 'react'

import { cn } from '../../lib/utils'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { MediaPreview } from './media-preview'
import { Textarea } from './textarea'
import { Clapperboard, ImagePlus, Images, Video } from 'lucide-react'
import { RichMediaEditorUploadStatus, type RichMediaEditorUploadStats } from './rich-media-editor-upload-status'
import { sonnerToast } from './sonner'

export type RichMediaKind = 'image' | 'video'

export type RichMediaEmbed = {
  id: string
  kind: RichMediaKind
  src: string
  caption?: string
}

export type RichMediaValue = {
  text: string
  embeds: RichMediaEmbed[]
}

type UploadResult = {
  src: string
  caption?: string
}

export type RichMediaUploadContext = {
  onProgress?: (event: { loaded: number; total: number; percent: number }) => void
}

export type RichMediaEditorProps = {
  value: RichMediaValue
  onChange: (next: RichMediaValue) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  textRows?: number
  onUploadMedia?: (
    kind: RichMediaKind,
    file: File,
    ctx?: RichMediaUploadContext,
  ) => Promise<UploadResult | null> | UploadResult | null
  title?: React.ReactNode
  toolbarVariant?: 'full' | 'icon'
  enabledKinds?: RichMediaKind[]
  showTextEditor?: boolean
  toolbarActions?: React.ReactNode
  onOpenLibrary?: (kind: RichMediaKind) => void
}

function makeEmbedId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function RichMediaEditor({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = '请输入内容',
  textRows = 5,
  onUploadMedia,
  title,
  toolbarVariant = 'full',
  enabledKinds = ['image', 'video'],
  showTextEditor = true,
  toolbarActions,
  onOpenLibrary,
}: RichMediaEditorProps) {
  const imageInputRef = React.useRef<HTMLInputElement | null>(null)
  const videoInputRef = React.useRef<HTMLInputElement | null>(null)
  const valueRef = React.useRef(value)
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState<RichMediaEditorUploadStats | null>(null)

  React.useEffect(() => {
    valueRef.current = value
  }, [value])
  const canUploadImage = enabledKinds.includes('image')
  const canUploadVideo = enabledKinds.includes('video')

  const updateEmbeds = React.useCallback(
    (updater: (prev: RichMediaEmbed[]) => RichMediaEmbed[]) => {
      onChange({ ...value, embeds: updater(value.embeds) })
    },
    [onChange, value],
  )

  const handleUpload = React.useCallback(
    async (kind: RichMediaKind, files: FileList | File[]) => {
      if (!onUploadMedia) return
      const fileList = Array.from(files)
      if (fileList.length === 0) return
      setIsUploading(true)
      setUploadProgress({
        kind,
        total: fileList.length,
        done: 0,
        success: 0,
        failed: 0,
        stage: 'uploading',
        currentFilePercent: 0,
      })
      const appended: RichMediaEmbed[] = []
      let successCount = 0
      let failedCount = 0
      for (const file of fileList) {
        try {
          const result = await onUploadMedia(kind, file, {
            onProgress: (event) => {
              setUploadProgress({
                kind,
                total: fileList.length,
                done: successCount + failedCount,
                success: successCount,
                failed: failedCount,
                stage: 'uploading',
                currentFilePercent: event.percent,
              })
            },
          })
          if (!result?.src) {
            sonnerToast.error("上传失败", { description: `${file.name} 未返回可用地址` })
            failedCount += 1
            const processed = successCount + failedCount
            setUploadProgress({
              kind,
              total: fileList.length,
              done: processed,
              success: successCount,
              failed: failedCount,
              stage: 'uploading',
              currentFilePercent: 0,
            })
            continue
          }
          appended.push({ id: makeEmbedId(), kind, src: result.src, caption: result.caption })
          successCount += 1
        } catch (error) {
          failedCount += 1
          sonnerToast.error("上传失败", {
            description: error instanceof Error ? `${file.name}: ${error.message}` : `${file.name}: 未知错误`,
          })
        }
        const processed = successCount + failedCount
        setUploadProgress({
          kind,
          total: fileList.length,
          done: processed,
          success: successCount,
          failed: failedCount,
          stage: 'uploading',
          currentFilePercent: 0,
        })
      }
      if (appended.length > 0) {
        const base = valueRef.current
        onChange({ ...base, embeds: [...base.embeds, ...appended] })
        sonnerToast.success("上传完成", {
          description: `已新增 ${appended.length} 个${kind === 'image' ? '图片' : '视频'}文件`,
        })
      } else {
        sonnerToast.message("未新增文件", {
          description: `所选${kind === 'image' ? '图片' : '视频'}未成功加入列表`,
        })
      }
      setUploadProgress({
        kind,
        total: fileList.length,
        done: fileList.length,
        success: successCount,
        failed: failedCount,
        stage: 'done',
        currentFilePercent: 100,
      })
      setIsUploading(false)
      window.setTimeout(() => {
        setUploadProgress((current) => (current?.stage === 'done' ? null : current))
      }, 2400)
    },
    [onChange, onUploadMedia],
  )

  return (
    <div className={cn('space-y-3 rounded-md border border-border p-3', className)}>
      <div className="flex items-center gap-2">
        {title ? <div className="mr-auto text-sm font-medium text-foreground">{title}</div> : null}
        {toolbarVariant === 'icon' ? (
          <>
            {canUploadImage ? (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={disabled || !onUploadMedia || isUploading}
                  aria-label="插入图片"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImagePlus />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={disabled || !onOpenLibrary}
                  aria-label="从图片媒体库选择"
                  onClick={() => onOpenLibrary?.('image')}
                >
                  <Images />
                </Button>
              </div>
            ) : null}
            {canUploadImage && canUploadVideo ? <div className="mx-1 h-4 w-px bg-border" /> : null}
            {canUploadVideo ? (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={disabled || !onUploadMedia || isUploading}
                  aria-label="插入视频"
                  onClick={() => videoInputRef.current?.click()}
                >
                  <Video />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={disabled || !onOpenLibrary}
                  aria-label="从视频媒体库选择"
                  onClick={() => onOpenLibrary?.('video')}
                >
                  <Clapperboard />
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <>
            {canUploadImage ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled || !onUploadMedia || isUploading}
                onClick={() => imageInputRef.current?.click()}
              >
                {isUploading ? '上传中…' : '插入图片'}
              </Button>
            ) : null}
            {canUploadVideo ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled || !onUploadMedia || isUploading}
                onClick={() => videoInputRef.current?.click()}
              >
                {isUploading ? '上传中…' : '插入视频'}
              </Button>
            ) : null}
          </>
        )}
        {toolbarActions}
      </div>
      <RichMediaEditorUploadStatus stats={uploadProgress} />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = event.currentTarget.files ? Array.from(event.currentTarget.files) : []
          event.currentTarget.value = ''
          if (files.length === 0) return
          void handleUpload('image', files)
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = event.currentTarget.files ? Array.from(event.currentTarget.files) : []
          event.currentTarget.value = ''
          if (files.length === 0) return
          void handleUpload('video', files)
        }}
      />

      {showTextEditor ? (
        <Textarea
          value={value.text}
          onChange={(event) => onChange({ ...value, text: event.target.value })}
          placeholder={placeholder}
          rows={textRows}
          disabled={disabled}
          onPaste={(event) => {
            const cd = event.clipboardData
            if (!cd || disabled || !onUploadMedia) return
            const imageFiles = Array.from(cd.files).filter((f) => f.type.startsWith('image/'))
            if (!imageFiles.length) return
            event.preventDefault()
            void handleUpload('image', imageFiles)
          }}
        />
      ) : null}

      {value.embeds.length > 0 ? (
        <div className="space-y-3">
          {(['image', 'video'] as const).map((kind) => {
            const list = value.embeds.filter((item) => item.kind === kind)
            if (list.length === 0) return null
            return (
              <div key={kind} className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  {kind === 'image' ? '图片列表' : '视频列表'}（{list.length}）
                </Label>
                <div className="rounded-md border border-border bg-muted/20 p-2">
                  <div className="flex flex-wrap items-start gap-2">
                    {list.map((item, index) => (
                      <div key={item.id} className="w-[220px] shrink-0 rounded-md border border-border bg-background p-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">{index + 1}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={disabled}
                            onClick={() => updateEmbeds((prev) => prev.filter((embed) => embed.id !== item.id))}
                          >
                            删除
                          </Button>
                        </div>
                        <div className="mt-1 h-32 overflow-hidden rounded border border-border bg-muted/30">
                          <MediaPreview
                            kind={item.kind}
                            src={item.src}
                            variant={item.kind === "video" ? "default" : undefined}
                            videoProps={{ controls: true, preload: "metadata" }}
                            className="size-full object-contain"
                          />
                        </div>
                        <Input
                          className="mt-2"
                          value={item.caption ?? ''}
                          onChange={(event) =>
                            updateEmbeds((prev) =>
                              prev.map((embed) =>
                                embed.id === item.id ? { ...embed, caption: event.target.value } : embed,
                              ),
                            )
                          }
                          disabled={disabled}
                          placeholder="补充说明（可选）"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
