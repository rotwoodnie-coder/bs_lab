'use client'

import { Badge, Button, Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@bs-lab/ui'
import { AlertCircle, AlertTriangle, Ban, Beaker, BookOpen, Clock, FileEdit, Globe, Gauge, Info, Loader2, Send, ShieldAlert, Target, Trash2, Users, Wand2 } from '@bs-lab/ui/icons'
import type { DifficultyLevel, GradeLevel, SafetyTip, SubjectCategory } from '@/lib/types'
import type { ExperimentFormApi } from '@/hooks/use-experiment-form'

const GRADE_OPTIONS: GradeLevel[] = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级', '十年级', '十一年级', '十二年级']
const SUBCATEGORIES: Record<SubjectCategory, string[]> = {
  physics: ['力学', '光学', '电学', '热学', '声学', '磁学'],
  chemistry: ['无机化学', '有机化学', '分析化学', '物质变化', '酸碱盐'],
  biology: ['植物学', '动物学', '微生物', '人体生理', '生态环境', '细胞生物'],
}

function AIButton({ form, field }: { form: ExperimentFormApi; field: string }) {
  const loading = form.ai.fieldGenerating === field
  return (
    <Button type="button" variant="ghost" size="sm" onClick={() => form.actions.handleFieldAI(field)} disabled={loading || form.ai.isGenerating} className="h-7 px-2 text-primary hover:text-primary hover:bg-primary/10">
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
      <span className="ml-1 text-xs">AI优化</span>
    </Button>
  )
}

export function BasicInfoSection({ form }: { form: ExperimentFormApi }) {
  const { experiment } = form.meta
  const { title, description, category, subcategory, difficulty, selectedGrades, duration, safetyTips, publishStatus } = form.values

  return (
    <div className="space-y-4 mt-4 min-h-[400px]">
      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between"><Label htmlFor="title">实验名称 *</Label><AIButton form={form} field="title" /></div>
            <Input id="title" value={title} onChange={(e) => form.setters.setTitle(e.target.value)} placeholder="输入实验名称或主题，如：水的沸腾实验" />
            {form.validation.errors.title ? <p className="text-xs text-destructive">{form.validation.errors.title}</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium"><Beaker className="h-4 w-4 text-muted-foreground" />学科</Label>
              <Select value={category} onValueChange={(v: SubjectCategory) => { form.setters.setCategory(v); form.setters.setSubcategory('') }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="physics">物理</SelectItem><SelectItem value="chemistry">化学</SelectItem><SelectItem value="biology">生物</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium"><Target className="h-4 w-4 text-muted-foreground" />子分类</Label>
              <Select value={subcategory} onValueChange={form.setters.setSubcategory}>
                <SelectTrigger><SelectValue placeholder="选择" /></SelectTrigger>
                <SelectContent>{SUBCATEGORIES[category].map((sub) => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium"><Gauge className="h-4 w-4 text-muted-foreground" />难度</Label>
              <Select value={difficulty} onValueChange={(v: DifficultyLevel) => form.setters.setDifficulty(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="简单">简单</SelectItem><SelectItem value="中等">中等</SelectItem><SelectItem value="困难">困难</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2 text-sm font-medium"><Clock className="h-4 w-4 text-muted-foreground" />时长</Label>
              <Input id="duration" value={duration} onChange={(e) => form.setters.setDuration(e.target.value)} placeholder="如：30分钟" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between"><Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium"><BookOpen className="h-4 w-4 text-muted-foreground" />实验简介</Label><AIButton form={form} field="description" /></div>
            <Textarea id="description" value={description} onChange={(e) => form.setters.setDescription(e.target.value)} placeholder="简要描述实验目的和内容..." rows={4} className="resize-none" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><Label className="flex items-center gap-2 text-sm font-medium"><Users className="h-4 w-4 text-muted-foreground" />适合年级（可多选）</Label><AIButton form={form} field="grades" /></div>
            <div className="flex flex-wrap gap-1.5">{GRADE_OPTIONS.map((g) => <Badge key={g} variant={selectedGrades.includes(g) ? 'default' : 'outline'} onClick={() => form.actions.toggleGrade(g)}>{g}</Badge>)}</div>
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t">
        <div className="flex items-center justify-between"><Label className="flex items-center gap-2 text-sm font-medium"><ShieldAlert className="h-4 w-4 text-muted-foreground" />安全提示</Label><AIButton form={form} field="safetyTips" /></div>
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3">
          {safetyTips.map((tip: SafetyTip, idx: number) => (
            <div key={idx} className="flex items-start gap-2">
              <div className={`mt-2.5 ${tip.type === 'danger' ? 'text-red-500' : tip.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'}`}>{tip.type === 'danger' ? <AlertCircle className="h-4 w-4" /> : tip.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}</div>
              <Input value={tip.content} onChange={(e) => form.actions.updateSafetyTip(idx, e.target.value)} placeholder="输入安全提示内容..." className="flex-1" />
              <Button type="button" variant="ghost" size="icon" onClick={() => form.actions.removeSafetyTip(idx)} className="h-9 w-9 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => form.actions.addSafetyTip('info')}><Info className="h-3.5 w-3.5 text-blue-500" />提示</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => form.actions.addSafetyTip('warning')}><AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />注意</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => form.actions.addSafetyTip('danger')}><AlertCircle className="h-3.5 w-3.5 text-red-500" />危险</Button>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t">
        <Label className="flex items-center gap-2 text-sm font-medium"><Send className="h-4 w-4 text-muted-foreground" />发布状态</Label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Card className={`p-3 cursor-pointer transition-all ${publishStatus === 'draft' ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`} onClick={() => form.setters.setPublishStatus('draft')}><div className="flex items-center gap-2"><FileEdit className="h-4 w-4 text-gray-500" /><span className="text-sm font-medium">草稿</span></div></Card>
          <Card className={`p-3 cursor-pointer transition-all ${publishStatus === 'pending' ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`} onClick={() => form.setters.setPublishStatus('pending')}><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-yellow-500" /><span className="text-sm font-medium">提交审核</span></div></Card>
          <Card className={`p-3 cursor-pointer transition-all ${publishStatus === 'published' ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'} ${!experiment?.status || experiment.status === 'draft' ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => { if (experiment?.status === 'published' || experiment?.status === 'pending') form.setters.setPublishStatus('published') }}><div className="flex items-center gap-2"><Globe className="h-4 w-4 text-green-500" /><span className="text-sm font-medium">已发布</span></div></Card>
          <Card className={`p-3 ${publishStatus === 'rejected' ? 'ring-2 ring-destructive border-destructive' : ''} ${experiment?.status !== 'rejected' ? 'opacity-50' : ''}`}><div className="flex items-center gap-2"><Ban className="h-4 w-4 text-red-500" /><span className="text-sm font-medium">已拒绝</span></div></Card>
        </div>
      </div>
    </div>
  )
}

