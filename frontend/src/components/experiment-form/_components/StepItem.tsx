"use client"

import { Button, Card, CardContent, Input, Textarea } from "@bs-lab/ui"
import { Trash2 } from "@bs-lab/ui/icons"
import type { ExperimentStep } from "@/lib/types"
import type { ExperimentFormApi } from "@/hooks/use-experiment-form"

export function StepItem({ form, step, index }: { form: ExperimentFormApi; step: ExperimentStep; index: number }) {
  return (
    <Card className="relative">
      <CardContent className="p-3 lg:p-4">
        <div className="flex items-start gap-2 lg:gap-3">
          <div className="flex h-6 w-6 lg:h-7 lg:w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs lg:text-sm font-medium">
            {step.order}
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            <Input value={step.title} onChange={(e) => form.actions.updateStep(index, "title", e.target.value)} placeholder="步骤标题" className="font-medium h-8 lg:h-9" />
            <Textarea value={step.description} onChange={(e) => form.actions.updateStep(index, "description", e.target.value)} placeholder="详细描述..." rows={2} className="text-sm resize-none" />
            <Input value={step.tips || ""} onChange={(e) => form.actions.updateStep(index, "tips", e.target.value)} placeholder="小贴士（可选）" className="text-xs h-7 lg:h-8" />
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => form.actions.removeStep(index)} className="h-7 w-7 text-muted-foreground hover:text-destructive absolute top-2 right-2">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

