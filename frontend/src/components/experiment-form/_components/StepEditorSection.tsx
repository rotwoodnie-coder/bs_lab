"use client"

import { Button, Checkbox, Input, Label } from "@bs-lab/ui"
import { Loader2, Plus, Trash2, Wand2 } from "@bs-lab/ui/icons"
import type { ExperimentFormApi } from "@/hooks/use-experiment-form"
import { StepItem } from "./StepItem"

function AIButton({ form, field }: { form: ExperimentFormApi; field: string }) {
  const loading = form.ai.fieldGenerating === field
  return (
    <Button type="button" variant="ghost" size="sm" onClick={() => form.actions.handleFieldAI(field)} disabled={loading || form.ai.isGenerating} className="h-7 px-2 text-primary hover:text-primary hover:bg-primary/10">
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
      <span className="ml-1 text-xs">AI优化</span>
    </Button>
  )
}

function MaterialsEditor({ form }: { form: ExperimentFormApi }) {
  return (
    <div className="space-y-4 mt-4 min-h-[400px]">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">实验材料清单</Label>
        <AIButton form={form} field="materials" />
      </div>
      <div className="grid lg:grid-cols-2 gap-2 lg:gap-3">
        {form.values.materials.map((material, index) => (
          <div key={index} className="flex items-center gap-2 p-2 lg:p-3 bg-muted/30 rounded-lg">
            <Input value={material.name} onChange={(e) => form.actions.updateMaterial(index, "name", e.target.value)} placeholder="材料名称" className="flex-1" />
            <Input value={material.quantity} onChange={(e) => form.actions.updateMaterial(index, "quantity", e.target.value)} placeholder="数量" className="w-20 lg:w-24" />
            <div className="flex items-center gap-1">
              <Checkbox id={`optional-${index}`} checked={material.optional} onCheckedChange={(checked) => form.actions.updateMaterial(index, "optional", !!checked)} />
              <Label htmlFor={`optional-${index}`} className="text-xs text-muted-foreground hidden sm:inline">
                可选
              </Label>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => form.actions.removeMaterial(index)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" onClick={form.actions.addMaterial} className="gap-2">
        <Plus className="h-4 w-4" /> 添加材料
      </Button>
    </div>
  )
}

function StepsEditor({ form }: { form: ExperimentFormApi }) {
  return (
    <div className="space-y-4 mt-4 min-h-[400px]">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">实验步骤</Label>
        <AIButton form={form} field="steps" />
      </div>
      <div className="grid lg:grid-cols-2 gap-3 lg:gap-4">
        {form.values.steps.map((step, index) => (
          <StepItem key={index} form={form} step={step} index={index} />
        ))}
      </div>
      <Button type="button" variant="outline" onClick={form.actions.addStep} className="gap-2">
        <Plus className="h-4 w-4" /> 添加步骤
      </Button>
    </div>
  )
}

export function StepEditorSection({ form }: { form: ExperimentFormApi }) {
  if (form.ui.activeTab === "materials") return <MaterialsEditor form={form} />
  if (form.ui.activeTab === "steps") return <StepsEditor form={form} />
  return null
}

