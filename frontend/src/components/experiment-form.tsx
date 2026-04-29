"use client"

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Tabs, TabsList, TabsTrigger } from "@bs-lab/ui"
import type { Experiment } from "@/lib/types"
import { useExperimentForm } from "@/hooks/use-experiment-form"
import { BasicInfoSection } from "./experiment-form/_components/BasicInfoSection"
import { StepEditorSection } from "./experiment-form/_components/StepEditorSection"
import { MediaUploadSection } from "./experiment-form/_components/MediaUploadSection"

interface ExperimentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  experiment?: Experiment
  onSubmit: (data: Partial<Experiment>) => void
}

export function ExperimentForm({ open, onOpenChange, experiment, onSubmit }: ExperimentFormProps) {
  const form = useExperimentForm({ open, experiment, onOpenChange, onSubmit })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[96vw] h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{experiment ? "编辑实验" : "创建新实验"}</DialogTitle>
        </DialogHeader>
        <Tabs value={form.ui.activeTab} onValueChange={(v) => form.ui.setActiveTab(v as "basic" | "materials" | "steps" | "video")}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="materials">实验材料</TabsTrigger>
            <TabsTrigger value="steps">实验步骤</TabsTrigger>
            <TabsTrigger value="video">视频</TabsTrigger>
          </TabsList>
          {form.ui.activeTab === "basic" ? <BasicInfoSection form={form} /> : null}
          <StepEditorSection form={form} />
          <MediaUploadSection form={form} />
        </Tabs>
        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={form.actions.handleSubmit}>{experiment ? "保存修改" : "创建实验"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

