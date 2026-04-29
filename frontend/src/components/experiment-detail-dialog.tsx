"use client"

import { useState } from "react"
import Image from "next/image"
import { Button, Badge, MediaPreview } from "@bs-lab/ui"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@bs-lab/ui"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@bs-lab/ui"
import { Info, Package, MousePointerClick } from "@bs-lab/ui/icons"
import { AlertCircle } from "@bs-lab/ui/icons"
import { Clock, Star, Eye, Heart, Bookmark, Share2, Play, AlertTriangle, CheckCircle2, BadgeCheck, X } from "@bs-lab/ui/icons"
import type { Experiment, ShareInfo, ExperimentRating } from "@/lib/types"
import { useUser } from "@/lib/user-context"
import { RatingDialog } from "@/components/rating-dialog"

interface ExperimentDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  experiment: Experiment | null
  onShare?: (info: ShareInfo) => void
  onStartSimulation?: (experiment: Experiment) => void
  onRate?: (rating: ExperimentRating) => void
}

const categoryLabels = {
  physics: "物理",
  chemistry: "化学",
  biology: "生物",
}

const difficultyColors = {
  简单: "bg-green-100 text-green-700",
  中等: "bg-yellow-100 text-yellow-700",
  困难: "bg-red-100 text-red-700",
}

export function ExperimentDetailDialog({
  open,
  onOpenChange,
  experiment,
  onShare,
  onStartSimulation,
  onRate,
}: ExperimentDetailDialogProps) {
  const { isStudent } = useUser()
  const [isLiked, setIsLiked] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const [isPlayingVideo, setIsPlayingVideo] = useState(false)
  
  if (!experiment) return null
  
  // 检查当前用户是否已评分
  const currentUserRating = experiment.ratings?.find(r => r.userId === "student-001")

  const handleShare = () => {
    onShare?.({
      url: `https://science-lab.example.com/experiment/${experiment.id}`,
      title: experiment.title,
      description: experiment.description,
      thumbnail: experiment.thumbnail,
    })
  }

  const getSafetyIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "danger":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getSafetyBg = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-yellow-50 border-yellow-200"
      case "danger":
        return "bg-red-50 border-red-200"
      default:
        return "bg-blue-50 border-blue-200"
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) setIsPlayingVideo(false)
      onOpenChange(open)
    }}>
      <DialogContent className="max-w-[95vw] lg:max-w-[1400px] xl:max-w-[1600px] 2xl:max-w-[1800px] w-[95vw] h-[90vh] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* 关闭按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-50 rounded-full bg-background/80 hover:bg-background shadow-md"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
          {/* 左侧 - 视频/封面区域 */}
          <div className="shrink-0 lg:flex-1 bg-black flex flex-col h-[30vh] lg:h-auto">
            <div className="relative flex-1 flex items-center justify-center">
              {isPlayingVideo && experiment.videoUrl ? (
                <MediaPreview
                  kind="video"
                  variant="default"
                  src={experiment.videoUrl}
                  className="size-full object-contain"
                  alt={experiment.title}
                  videoProps={{ controls: true, autoPlay: true, playsInline: true }}
                />
              ) : (
                <>
                  <Image
                    src={experiment.thumbnail}
                    alt={experiment.title}
                    fill
                    priority
                    className="object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Button
                      size="lg"
                      className="rounded-full h-14 w-14 lg:h-24 lg:w-24 bg-white/90 hover:bg-white text-primary shadow-xl"
                      onClick={() => setIsPlayingVideo(true)}
                    >
                      <Play className="h-7 w-7 lg:h-12 lg:w-12 fill-current ml-1" />
                    </Button>
                  </div>
                  <div className="absolute bottom-4 left-4 lg:bottom-6 lg:left-6 flex gap-2">
                    <Badge className={`${difficultyColors[experiment.difficulty]} text-xs lg:text-sm px-2 lg:px-3 py-0.5 lg:py-1`}>
                      {experiment.difficulty}
                    </Badge>
                    <Badge variant="secondary" className="bg-white/90 text-foreground text-xs lg:text-sm px-2 lg:px-3 py-0.5 lg:py-1">
                      {categoryLabels[experiment.category]}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 右侧 - 信息区域 */}
          <div className="flex-1 lg:flex-none lg:w-[420px] xl:w-[480px] overflow-y-auto p-4 lg:p-8 border-t lg:border-t-0 lg:border-l">
            <DialogHeader className="mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle className="text-2xl font-bold">{experiment.title}</DialogTitle>
                  <DialogDescription className="sr-only">查看实验详情和操作步骤</DialogDescription>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Badge variant="outline">{experiment.difficulty}</Badge>
                    <Badge variant="secondary">{experiment.duration}</Badge>
                    <Badge variant="outline" className="text-xs">
                      {experiment.grades?.length > 2 
                        ? `${experiment.grades[0]}等${experiment.grades.length}个年级` 
                        : experiment.grades?.join("、") || "未设置"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isStudent && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsLiked(!isLiked)}
                        className={isLiked ? "text-red-500" : ""}
                      >
                        <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsFavorited(!isFavorited)}
                        className={isFavorited ? "text-yellow-500" : ""}
                      >
                        <Bookmark className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="icon" onClick={handleShare}>
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <p className="text-base text-muted-foreground leading-relaxed mb-6">{experiment.description}</p>

            {/* 统计数据 */}
            <div className="grid grid-cols-3 gap-4 py-4 mb-6 border-y">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
                  <Eye className="h-5 w-5" />
                  {experiment.viewCount || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">浏览</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-rose-500">
                  <Heart className="h-5 w-5" />
                  {experiment.likeCount || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">点赞</p>
              </div>
              <button 
                className="text-center hover:bg-secondary/50 rounded-lg transition-colors py-2 -my-2"
                onClick={() => isStudent && setShowRatingDialog(true)}
                disabled={!isStudent}
              >
                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-amber-500">
                  <Star className={`h-5 w-5 ${currentUserRating ? "fill-amber-400" : ""}`} />
                  {experiment.rating?.toFixed(1) || "0.0"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {experiment.ratingCount || 0}人评分
                  {isStudent && <span className="text-primary ml-1">{currentUserRating ? "已评" : "去评"}</span>}
                </p>
              </button>
            </div>

            {/* 发布老师信息 */}
            {experiment.teacher && (
              <div className="flex items-center gap-3 p-3 mb-6 bg-secondary/30 rounded-lg">
                <img 
                  src={experiment.teacher.avatar} 
                  alt={experiment.teacher.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{experiment.teacher.name}</span>
                    {experiment.teacher.verified && (
                      <BadgeCheck className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {experiment.teacher.title && `${experiment.teacher.title}`}
                    {experiment.teacher.title && experiment.teacher.school && " · "}
                    {experiment.teacher.school}
                  </p>
                </div>
              </div>
            )}

            {/* 标签页内容 */}
            <Tabs defaultValue="steps" className="w-full">
              <TabsList className="w-full justify-start mb-4">
                <TabsTrigger value="steps">实验步骤</TabsTrigger>
                <TabsTrigger value="materials">实验材料</TabsTrigger>
                <TabsTrigger value="safety">安全提示</TabsTrigger>
                <TabsTrigger value="ratings">评价({experiment.ratingCount || 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="steps" className="space-y-4 min-h-[200px]">
                {experiment.steps?.map((step) => (
                  <div
                    key={step.order}
                    className="flex gap-4 p-4 bg-secondary/30 rounded-lg"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium shrink-0">
                      {step.order}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                      {step.tips && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-primary/5 rounded text-sm">
                          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-primary">{step.tips}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="materials" className="space-y-3 min-h-[200px]">
                <div className="grid gap-3 sm:grid-cols-2">
                  {experiment.materials?.map((material, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg"
                    >
                      <div className="p-2 bg-primary/10 rounded">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{material.name}</span>
                          {material.optional && (
                            <Badge variant="outline" className="text-xs">可选</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {material.quantity}
                        </span>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="safety" className="space-y-3 min-h-[200px]">
                {experiment.safetyTips?.map((tip, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-4 rounded-lg border ${getSafetyBg(tip.type)}`}
                  >
                    {getSafetyIcon(tip.type)}
                    <p className="text-sm">{tip.content}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="ratings" className="space-y-4 min-h-[200px]">
                {isStudent && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowRatingDialog(true)}
                  >
                    <Star className={`h-4 w-4 mr-2 ${currentUserRating ? "fill-amber-400 text-amber-400" : ""}`} />
                    {currentUserRating ? "修改我的评分" : "写评价"}
                  </Button>
                )}
                
                {experiment.ratings && experiment.ratings.length > 0 ? (
                  <div className="space-y-3">
                    {experiment.ratings?.map((rating) => (
                      <div key={rating.id} className="p-3 bg-secondary/30 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <img 
                            src={rating.userAvatar} 
                            alt={rating.userName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{rating.userName}</p>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${
                                    star <= rating.rating 
                                      ? "fill-amber-400 text-amber-400" 
                                      : "text-muted-foreground/30"
                                  }`}
                                />
                              ))}
                              <span className="text-xs text-muted-foreground ml-2">
                                {new Date(rating.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        {rating.comment && (
                          <p className="text-sm text-muted-foreground">{rating.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>暂无评价</p>
                    {isStudent && <p className="text-sm mt-1">成为第一个评价的人吧</p>}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* 底部操作 */}
            <div className="sticky bottom-0 mt-6 flex gap-3 border-t bg-background pb-safe-bottom pt-6">
              <Button 
                className="flex-1" 
                size="lg"
                onClick={() => onStartSimulation?.(experiment)}
              >
                <MousePointerClick className="h-4 w-4 mr-2" />
                {isStudent ? "模拟操作练习" : "预览模拟实验"}
              </Button>
              <Button variant="outline" size="lg" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                分享
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* 评分对话框 */}
      <RatingDialog
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
        experiment={experiment}
        existingRating={currentUserRating}
        onSubmit={(rating) => {
          onRate?.(rating)
          setShowRatingDialog(false)
        }}
      />
    </Dialog>
  )
}
