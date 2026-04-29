"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button, Card, CardContent, Badge, Progress } from "@bs-lab/ui"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@bs-lab/ui"
import { Pause, RotateCcw, Circle, Beaker, Info, Trophy, Lightbulb, MousePointerClick, Hand, Volume2, VolumeX } from "@bs-lab/ui/icons"
import { Play, ChevronRight, ChevronLeft, CheckCircle2, FlaskConical, AlertTriangle, Sparkles, Clock, X, Eye } from "@bs-lab/ui/icons"
import type { Experiment, ExperimentStep, Material, SafetyTip } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ExperimentInteractive } from "./experiment-interactive"

interface ExperimentSimulationProps {
  experiment: Experiment
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExperimentSimulation({ 
  experiment, 
  open, 
  onOpenChange 
}: ExperimentSimulationProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [showMaterials, setShowMaterials] = useState(true)
  const [showSafetyTips, setShowSafetyTips] = useState(false)
  const [stepProgress, setStepProgress] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showCongrats, setShowCongrats] = useState(false)

  const totalSteps = experiment.steps.length
  const progress = (completedSteps.length / totalSteps) * 100
  const currentStepData = experiment.steps[currentStep]

  // 重置状态
  useEffect(() => {
    if (open) {
      setCurrentStep(0)
      setCompletedSteps([])
      setIsPlaying(false)
      setShowMaterials(true)
      setShowSafetyTips(false)
      setStepProgress(0)
      setShowCongrats(false)
    }
  }, [open])

  // 步骤进度动画
  useEffect(() => {
    if (isPlaying && stepProgress < 100) {
      const timer = setTimeout(() => {
        setStepProgress(prev => Math.min(prev + 2, 100))
      }, 100)
      return () => clearTimeout(timer)
    }
    if (stepProgress >= 100 && isPlaying) {
      setIsPlaying(false)
      handleCompleteStep()
    }
  }, [isPlaying, stepProgress])

  const handleCompleteStep = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep])
    }
    
    // 检查是否完成所有步骤
    if (completedSteps.length + 1 >= totalSteps) {
      setTimeout(() => setShowCongrats(true), 500)
    }
  }

  const handleNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1)
      setStepProgress(0)
      setIsPlaying(false)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      setStepProgress(0)
      setIsPlaying(false)
    }
  }

  const handleStartStep = () => {
    setIsPlaying(true)
    setStepProgress(0)
  }

  const handlePauseStep = () => {
    setIsPlaying(false)
  }

  const handleReset = () => {
    setCurrentStep(0)
    setCompletedSteps([])
    setStepProgress(0)
    setIsPlaying(false)
    setShowCongrats(false)
  }

  const handleGoToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex)
    setStepProgress(0)
    setIsPlaying(false)
  }

  const [showSidebar, setShowSidebar] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl xl:max-w-7xl w-[95vw] max-h-[90vh] lg:max-h-[95vh] overflow-hidden p-0" aria-describedby="simulation-description">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-3 lg:p-4 border-b">
          <div className="flex items-center justify-between gap-3 lg:gap-4">
            <div className="flex items-center gap-2 lg:gap-3 min-w-0">
              <div className="p-2 lg:p-2.5 bg-primary rounded-lg lg:rounded-xl shadow-lg shadow-primary/25 flex-shrink-0">
                <FlaskConical className="h-5 w-5 lg:h-6 lg:w-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base lg:text-xl font-bold truncate">
                  {experiment.title}
                </DialogTitle>
                <DialogDescription id="simulation-description" className="text-xs lg:text-sm mt-0.5">
                  <span className="hidden sm:inline">按照步骤进行交互式实验操作练习</span>
                  <span className="sm:hidden">模拟操作</span>
                </DialogDescription>
              </div>
            </div>
            
            {/* PC端进度条 */}
            <div className="hidden lg:flex items-center gap-3 flex-1 max-w-md mx-4">
              <Progress value={progress} className="flex-1 h-2.5" />
              <span className="text-sm font-medium text-primary whitespace-nowrap">
                {completedSteps.length}/{totalSteps} 完成
              </span>
            </div>
            
            <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
              {/* 移动端显示材料/安全按钮 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden h-8 px-2 text-xs"
              >
                <Beaker className="h-4 w-4 mr-1" />
                材料
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="h-8 w-8"
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* 移动端进度条 */}
          <div className="lg:hidden mt-3 flex items-center gap-2">
            <Progress value={progress} className="flex-1 h-2" />
            <span className="text-xs font-medium text-primary whitespace-nowrap">
              {completedSteps.length}/{totalSteps}
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(90vh-120px)] lg:h-[calc(95vh-100px)] overflow-hidden relative">
          {/* 左侧 - 步骤列表 (移动端为抽屉) */}
          <div className={cn(
            "lg:w-72 xl:w-80 lg:border-r bg-muted/30 overflow-y-auto lg:relative lg:block",
            "fixed inset-y-0 left-0 w-72 z-50 bg-background shadow-xl transition-transform duration-300 lg:shadow-none lg:translate-x-0",
            showSidebar ? "translate-x-0" : "-translate-x-full"
          )}>
            {/* 移动端关闭按钮 */}
            <div className="lg:hidden flex items-center justify-between p-3 border-b">
              <span className="font-semibold">实验信息</span>
              <Button variant="ghost" size="icon" onClick={() => setShowSidebar(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* 材料和安全提示切换 */}
            <div className="p-3 border-b bg-background/50 sticky top-0 z-10">
              <div className="flex gap-2">
                <Button
                  variant={showMaterials ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => { setShowMaterials(true); setShowSafetyTips(false) }}
                >
                  <Beaker className="h-3 w-3 mr-1" />
                  材料
                </Button>
                <Button
                  variant={showSafetyTips ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => { setShowMaterials(false); setShowSafetyTips(true) }}
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  安全
                </Button>
              </div>
            </div>

            {/* 材料列表 */}
            {showMaterials && (
              <div className="p-3 space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  实验材料清单
                </h4>
                {experiment.materials?.map((material, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 p-2 bg-background rounded-lg text-sm"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {index + 1}
                    </div>
                    <span className="flex-1">{material.name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {material.quantity}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* 安全提示 */}
            {showSafetyTips && (
              <div className="p-3 space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  安全注意事项
                </h4>
                {experiment.safetyTips?.map((tip, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "p-2.5 rounded-lg text-sm flex items-start gap-2",
                      tip.type === "danger" && "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
                      tip.type === "warning" && "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400",
                      tip.type === "info" && "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                    )}
                  >
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{tip.content}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 步骤导航 */}
            <div className="p-3 border-t">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                实验步骤
              </h4>
              <div className="space-y-1">
                {experiment.steps.map((step, index) => (
                  <button
                    key={index}
                    onClick={() => handleGoToStep(index)}
                    className={cn(
                      "w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-all",
                      currentStep === index 
                        ? "bg-primary text-primary-foreground" 
                        : completedSteps.includes(index)
                        ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                        : "hover:bg-muted"
                    )}
                  >
                    {completedSteps.includes(index) ? (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="truncate">步骤 {index + 1}: {step.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* 移动端遮罩层 */}
          {showSidebar && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setShowSidebar(false)}
            />
          )}

          {/* 右侧 - 模拟操作区 */}
          <div className="flex-1 flex flex-col overflow-hidden w-full">
            {/* 当前步骤内容 */}
            <div className="flex-1 overflow-y-auto p-3 lg:p-5">
              {showCongrats ? (
                // 完成祝贺
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-6 max-w-md">
                    <div className="inline-flex p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                      <Trophy className="h-16 w-16 text-yellow-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">恭喜完成实验!</h2>
                      <p className="text-muted-foreground mt-2">
                        你已经成功完成了"{experiment.title}"的所有操作步骤
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>{totalSteps} 个步骤全部完成</span>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <Button variant="outline" onClick={handleReset}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        重新练习
                      </Button>
                      <Button onClick={() => onOpenChange(false)}>
                        完成学习
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col lg:flex-row lg:gap-6">
                  {/* 左侧 - 步骤信息 (PC端) */}
                  <div className="lg:w-72 xl:w-80 flex-shrink-0 space-y-4 mb-4 lg:mb-0 lg:overflow-y-auto lg:pr-2">
                    {/* 步骤标题 */}
                    <div className="flex items-center gap-2 md:gap-3 p-3 lg:p-4 bg-muted/50 rounded-xl">
                      <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-primary text-primary-foreground font-bold text-base lg:text-lg flex-shrink-0">
                        {currentStep + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base lg:text-lg font-bold">{currentStepData?.title}</h3>
                        <p className="text-xs lg:text-sm text-muted-foreground">
                          第 {currentStep + 1} 步，共 {totalSteps} 步
                        </p>
                      </div>
                    </div>
                    
                    {/* 步骤描述 */}
                    <div className="hidden lg:block p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        操作说明
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                        {currentStepData?.description}
                      </p>
                    </div>
                    
                    {/* 完成状态 */}
                    {completedSteps.includes(currentStep) && (
                      <div className="hidden lg:flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">此步骤已完成</span>
                      </div>
                    )}
                    
                    {/* 移动端完成标记 */}
                    {completedSteps.includes(currentStep) && (
                      <Badge className="lg:hidden bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        已完成
                      </Badge>
                    )}
                  </div>

                  {/* 右侧 - 拖拽式交互操作区 */}
                  <div className="flex-1 min-w-0">
                    <ExperimentInteractive
                      experimentId={experiment.id}
                      experimentTitle={experiment.title}
                      category={experiment.category}
                      stepOrder={currentStepData?.order || currentStep + 1}
                      stepTitle={currentStepData?.title || ""}
                      stepDescription={currentStepData?.description || ""}
                      onComplete={handleCompleteStep}
                      onReset={() => setStepProgress(0)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 底部导航栏 */}
            {!showCongrats && (
              <div className="border-t bg-background p-3 md:p-4">
                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevStep}
                    disabled={currentStep === 0}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">上一步</span>
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    {completedSteps.includes(currentStep) && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        已完成
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      步骤 {currentStep + 1} / {totalSteps}
                    </span>
                  </div>
                  
                  <Button
                    variant={completedSteps.includes(currentStep) ? "default" : "outline"}
                    size="sm"
                    onClick={handleNextStep}
                    disabled={currentStep === totalSteps - 1}
                    className="gap-1"
                  >
                    <span className="hidden sm:inline">下一步</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
