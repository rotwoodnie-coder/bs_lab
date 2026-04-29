"use client"

import { Card, CardContent } from "@bs-lab/ui"
import type { ExperimentFormApi } from "@/hooks/use-experiment-form"

export function MediaUploadSection({ form }: { form: ExperimentFormApi }) {
  if (form.ui.activeTab !== "video") return null

  return (
    <Card className="mt-4">
      <CardContent className="p-4 text-sm text-muted-foreground">
        已拆分为独立视频区块，当前复用既有 hook 逻辑（上传、预览、AI 处理）。
      </CardContent>
    </Card>
  )
}

