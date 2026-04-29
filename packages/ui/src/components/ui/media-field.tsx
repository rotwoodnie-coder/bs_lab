'use client'

import * as React from 'react'

import { cn } from '../../lib/utils'
import { resolveMediaDisplaySrc } from '../../lib/media-display-src'
import { Button } from './button'
import { Input } from './input'
import { MediaPreview } from './media-preview'

export type MediaKind = 'image' | 'video'

export type MediaFieldProps = {
  kind: MediaKind
  value: string
  onChange: (next: string) => void
  disabled?: boolean
  className?: string
  emptyText?: string
  allowManualUrl?: boolean
}

export function MediaField({
  kind,
  value,
  onChange,
  disabled = false,
  className,
  emptyText,
  allowManualUrl = true,
}: MediaFieldProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [showManualInput, setShowManualInput] = React.useState(false)
  const [manualValue, setManualValue] = React.useState('')

  React.useEffect(() => {
    setManualValue(value)
  }, [value])

  const accept = kind === 'image' ? 'image/*' : 'video/*'
  const emptyLabel = emptyText ?? (kind === 'image' ? '暂无图片，支持上传或粘贴链接。' : '暂无视频，支持上传或粘贴链接。')

  return (
    <div className={cn('space-y-2 rounded-md border border-border p-3', className)}>
      <div className="overflow-hidden rounded-md border border-border bg-muted/30">
        {value ? (
          kind === 'image' ? (
            <img src={resolveMediaDisplaySrc(value)} alt="media-preview" className="h-40 w-full object-cover" />
          ) : (
            <MediaPreview
              kind="video"
              variant="default"
              src={value}
              className="h-40 w-full object-cover"
              alt="媒体预览"
              videoProps={{ controls: true, preload: 'metadata' }}
            />
          )
        ) : (
          <div className="flex h-32 items-center justify-center px-3 text-xs text-muted-foreground">{emptyLabel}</div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            const localUrl = URL.createObjectURL(file)
            onChange(localUrl)
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          上传{kind === 'image' ? '图片' : '视频'}
        </Button>
        {allowManualUrl ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => setShowManualInput((prev) => !prev)}
          >
            {showManualInput ? '收起链接' : '手动链接'}
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={disabled || !value}
          onClick={() => onChange('')}
        >
          清除
        </Button>
      </div>

      {allowManualUrl && showManualInput ? (
        <div className="flex gap-2">
          <Input
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            placeholder={kind === 'image' ? '粘贴图片 URL' : '粘贴视频 URL'}
            disabled={disabled}
          />
          <Button type="button" size="sm" disabled={disabled} onClick={() => onChange(manualValue.trim())}>
            应用
          </Button>
        </div>
      ) : null}
    </div>
  )
}

