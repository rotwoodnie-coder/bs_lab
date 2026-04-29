'use client'

import { Progress } from './progress'

export type RichMediaEditorUploadStats = {
  kind: 'image' | 'video'
  total: number
  done: number
  success: number
  failed: number
  stage: 'uploading' | 'done'
  currentFilePercent: number
}

function aggregatePercent(stats: RichMediaEditorUploadStats) {
  if (stats.total <= 0) return 0
  if (stats.stage === 'done') return 100
  const base = stats.done / stats.total
  const cur = stats.currentFilePercent / 100 / stats.total
  return Math.round(Math.min(1, base + cur) * 100)
}

export function RichMediaEditorUploadStatus(props: { stats: RichMediaEditorUploadStats | null }) {
  if (!props.stats) return null
  const pct = aggregatePercent(props.stats)
  const labelKind = props.stats.kind === 'image' ? '图片' : '视频'
  const hint =
    props.stats.stage === 'uploading'
      ? `正在上传${labelKind}：第 ${props.stats.done + 1}/${props.stats.total} 个文件；数据发往应用服务器，完成后写入本地并在开启镜像时同步 MinIO。`
      : `上传完成：${props.stats.success}/${props.stats.total} 成功${props.stats.failed ? `，失败 ${props.stats.failed}` : ''}`

  return (
    <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
      <div className="text-xs text-muted-foreground">{hint}</div>
      {props.stats.stage === 'uploading' ? <Progress value={pct} className="h-2" /> : null}
    </div>
  )
}
