"use client"

import { useState } from "react"
import { Star, MessageSquare } from "@bs-lab/ui/icons"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@bs-lab/ui"
import { Button, Textarea } from "@bs-lab/ui"
import { cn } from "@/lib/utils"
import type { Experiment, ExperimentRating } from "@/lib/types"

interface RatingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  experiment: Experiment | null
  onSubmit: (rating: ExperimentRating) => void
  existingRating?: ExperimentRating | null
}

export function RatingDialog({
  open,
  onOpenChange,
  experiment,
  onSubmit,
  existingRating,
}: RatingDialogProps) {
  const [rating, setRating] = useState(existingRating?.rating || 0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState(existingRating?.comment || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0 || !experiment) return
    
    setIsSubmitting(true)
    
    // 模拟提交延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const newRating: ExperimentRating = {
      id: existingRating?.id || `rating-${Date.now()}`,
      experimentId: experiment.id,
      userId: "student-001", // 模拟当前用户
      userName: "小明",
      userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
      rating,
      comment: comment.trim() || undefined,
      createdAt: new Date().toISOString(),
    }
    
    onSubmit(newRating)
    setIsSubmitting(false)
    onOpenChange(false)
    
    // 重置状态
    setRating(0)
    setComment("")
  }

  const ratingLabels = ["", "很差", "较差", "一般", "不错", "很棒"]

  if (!experiment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{existingRating ? "修改评分" : "为实验评分"}</DialogTitle>
          <DialogDescription>
            为「{experiment.title}」评分，帮助其他同学了解这个实验
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 星级评分 */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 transition-transform hover:scale-110"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      (hoveredRating || rating) >= star
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    )}
                  />
                </button>
              ))}
            </div>
            <p className={cn(
              "text-sm font-medium transition-colors",
              rating > 0 ? "text-amber-600" : "text-muted-foreground"
            )}>
              {rating > 0 ? ratingLabels[rating] : "点击星星评分"}
            </p>
          </div>

          {/* 评价内容 */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              评价内容（选填）
            </label>
            <Textarea
              placeholder="分享您对这个实验的看法..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/200
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
          >
            {isSubmitting ? "提交中..." : existingRating ? "更新评分" : "提交评分"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
