"use client"

import { Button, Card, CardContent, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Tabs, TabsContent, TabsList, TabsTrigger } from "@bs-lab/ui"
import { Beaker, CheckCircle2, FlaskConical, GripVertical, Info, Loader2, Sparkles, Video, Wand2 } from "@bs-lab/ui/icons"

import type { Experiment } from "@/lib/types"
import type { ExperimentFormApi } from "@/hooks/use-experiment-form"
import { BasicInfoSection } from "./BasicInfoSection"
import { MediaUploadSection } from "./MediaUploadSection"
import { StepEditorSection } from "./StepEditorSection"

export function ExperimentFormDialog({ open, onOpenChange, experiment, form }: { open: boolean; onOpenChange: (open: boolean) => void; experiment?: Experiment; form: ExperimentFormApi }) {
  const isEdit = !!experiment

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl xl:max-w-7xl w-[96vw] h-[85vh] lg:h-[92vh] overflow-hidden p-0">
        <div className="flex flex-col lg:flex-row h-full overflow-hidden">
          <div className="lg:w-80 xl:w-96 flex-shrink-0 border-b lg:border-b-0 lg:border-r bg-muted/30 p-3 lg:p-5 lg:overflow-y-auto">
            <DialogHeader className="pb-4">
              <div className="flex items-center gap-3"><div className="flex h-11 w-11 lg:h-12 lg:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg"><FlaskConical className="h-5 w-5 lg:h-6 lg:w-6 text-primary-foreground" /></div><div><DialogTitle className="text-lg lg:text-xl font-bold text-foreground">{isEdit ? "编辑实验" : "创建新实验"}</DialogTitle><DialogDescription className="text-xs lg:text-sm">AI智能助手帮助您快速创建实验方案</DialogDescription></div></div>
            </DialogHeader>
            <div className="hidden lg:block space-y-4">
              <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent"><CardContent className="p-4"><div className="flex items-center gap-3 mb-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25"><Sparkles className="h-5 w-5 text-primary-foreground" /></div><div><h3 className="font-bold text-sm">AI智能助手</h3><p className="text-xs text-muted-foreground">内置30+实验模板</p></div></div><p className="text-xs text-muted-foreground mb-3">输入实验主题后点击生成，AI会自动填充完整实验方案</p><Button onClick={form.actions.handleAIGenerate} disabled={form.ai.isGenerating || !form.values.title.trim()} className="w-full gap-2 shadow-lg shadow-primary/25">{form.ai.isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" />生成中...</> : <><Wand2 className="h-4 w-4" />一键生成实验</>}</Button>{form.ai.aiSuggestion ? <div className="mt-3 flex items-center gap-2 text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 p-2 rounded-lg"><CheckCircle2 className="h-4 w-4 flex-shrink-0" /><span>已生成，可在右侧修改</span></div> : null}</CardContent></Card>
              <div className="space-y-2"><h4 className="text-xs font-medium text-muted-foreground">快捷操作</h4><div className="grid grid-cols-2 gap-2"><Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => form.ui.setActiveTab("basic")}><Info className="h-3.5 w-3.5 mr-1" />基本信息</Button><Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => form.ui.setActiveTab("materials")}><Beaker className="h-3.5 w-3.5 mr-1" />材料</Button><Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => form.ui.setActiveTab("steps")}><GripVertical className="h-3.5 w-3.5 mr-1" />步骤</Button><Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => form.ui.setActiveTab("video")}><Video className="h-3.5 w-3.5 mr-1" />视频</Button></div></div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 lg:p-6 space-y-4 lg:space-y-5">
              <Tabs value={form.ui.activeTab} onValueChange={(v) => form.ui.setActiveTab(v as any)}>
                <TabsList className="grid w-full grid-cols-4 h-11 p-1 bg-muted/50">
                  <TabsTrigger value="basic" className="gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"><Info className="h-3.5 w-3.5" /><span className="hidden sm:inline">基本信息</span><span className="sm:hidden">基本</span></TabsTrigger>
                  <TabsTrigger value="materials" className="gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"><Beaker className="h-3.5 w-3.5" /><span className="hidden sm:inline">实验材料</span><span className="sm:hidden">材料</span></TabsTrigger>
                  <TabsTrigger value="steps" className="gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"><GripVertical className="h-3.5 w-3.5" /><span className="hidden sm:inline">实验步骤</span><span className="sm:hidden">步骤</span></TabsTrigger>
                  <TabsTrigger value="video" className="text-xs">视频</TabsTrigger>
                </TabsList>
                <TabsContent value="basic"><BasicInfoSection form={form} /></TabsContent>
                <TabsContent value="materials"><StepEditorSection form={form} /></TabsContent>
                <TabsContent value="steps"><StepEditorSection form={form} /></TabsContent>
                <TabsContent value="video"><MediaUploadSection form={form} /></TabsContent>
              </Tabs>
              <div className="flex justify-end gap-3 pt-4 border-t"><Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button onClick={form.actions.handleSubmit}><CheckCircle2 className="h-4 w-4 mr-2" />{isEdit ? "保存修改" : "创建实验"}</Button></div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

