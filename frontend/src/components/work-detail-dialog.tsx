"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Button, Badge, Avatar, AvatarFallback, AvatarImage, MediaPreview } from "@bs-lab/ui"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@bs-lab/ui"
import { Heart, Bookmark, Share2, Play, MessageCircle, Copy, CheckCircle2, X, UserPlus, UserCheck } from "@bs-lab/ui/icons"
import { QRCodeSVG } from "qrcode.react"
import type { StudentWork, Comment } from "@/lib/types"
import { CommentSection } from "./comment-section"
import { useUser } from "@/lib/user-context"

interface WorkDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  work: StudentWork | null
}

export function WorkDetailDialog({
  open,
  onOpenChange,
  work,
}: WorkDetailDialogProps) {
  const { user } = useUser()
  const [isLiked, setIsLiked] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [showSharePanel, setShowSharePanel] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [isPlayingVideo, setIsPlayingVideo] = useState(false)
  const copyResetTimerRef = React.useRef<number | null>(null)
  const mountedRef = React.useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current)
        copyResetTimerRef.current = null
      }
    }
  }, [])

  // 当 work 变化时重置所有状态
  useEffect(() => {
    if (work) {
      setIsLiked(work.isLiked || false)
      setIsFavorited(work.isFavorited || false)
      setLikeCount(work.likeCount || 0)
      setFavoriteCount(work.favoriteCount || 0)
      setIsPlayingVideo(false)
      setShowSharePanel(false)
      setLinkCopied(false)
      setIsFollowing(false)
    }
  }, [work, user.id])

  if (!work) return null

  const shareUrl = `https://science-lab.example.com/work/${work.id}`

  const handleShare = () => {
    setShowSharePanel(true)
  }
  
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setLinkCopied(true)
      if (copyResetTimerRef.current !== null) window.clearTimeout(copyResetTimerRef.current)
      copyResetTimerRef.current = window.setTimeout(() => {
        if (!mountedRef.current) return
        setLinkCopied(false)
      }, 2000)
    } catch {
      const input = document.createElement("input")
      input.value = shareUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setLinkCopied(true)
      if (copyResetTimerRef.current !== null) window.clearTimeout(copyResetTimerRef.current)
      copyResetTimerRef.current = window.setTimeout(() => {
        if (!mountedRef.current) return
        setLinkCopied(false)
      }, 2000)
    }
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
  }

  const handleFavorite = () => {
    setIsFavorited(!isFavorited)
    setFavoriteCount(prev => isFavorited ? prev - 1 : prev + 1)
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
  }

  const handleAddComment = (content: string, comment: Comment) => {
    setComments(prev => [comment, ...prev])
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) setIsPlayingVideo(false)
      onOpenChange(open)
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>作品详情</DialogTitle>
          <DialogDescription>查看学生作品详情和评论</DialogDescription>
        </DialogHeader>
        
        {/* 关闭按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-50 rounded-full bg-background/80 hover:bg-background shadow-md"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-5 w-5" />
        </Button>
        
        {/* 视频区域 */}
        <div className="relative aspect-video bg-black">
          {isPlayingVideo && work.videoUrl ? (
            <MediaPreview
              kind="video"
              variant="default"
              src={work.videoUrl}
              className="size-full object-contain"
              alt={work.experimentTitle}
              videoProps={{
                poster: work.thumbnail,
                controls: true,
                autoPlay: true,
                playsInline: true,
              }}
            />
          ) : (
            <>
              <Image
                src={work.thumbnail}
                alt={work.experimentTitle}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Button
                  size="lg"
                  className="rounded-full h-16 w-16 bg-white/90 hover:bg-white text-primary"
                  onClick={() => setIsPlayingVideo(true)}
                >
                  <Play className="h-8 w-8 fill-current ml-1" />
                </Button>
              </div>
              <Badge className="absolute top-4 left-4 bg-primary/90">
                {work.experimentTitle}
              </Badge>
            </>
          )}
        </div>

        <div className="p-6">
          {/* 作者信息 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={work.studentAvatar} alt={work.studentName} />
                <AvatarFallback>{work.studentName.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{work.studentName}</h3>
                <p className="text-sm text-muted-foreground">{work.createdAt}</p>
              </div>
            </div>
            {user.id !== work.studentId && (
              <Button 
                variant={isFollowing ? "secondary" : "outline"} 
                size="sm"
                onClick={handleFollow}
                className={isFollowing ? "text-primary" : ""}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="h-4 w-4 mr-1" />
                    已关注
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1" />
                    关注
                  </>
                )}
              </Button>
            )}
          </div>

          {/* 作品描述 */}
          <p className="text-foreground mb-6">{work.description}</p>

          {/* 互动栏 */}
          <div className="flex items-center justify-between py-4 border-y mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`${isLiked ? "text-red-500" : ""}`}
              >
                <Heart className={`h-5 w-5 mr-2 ${isLiked ? "fill-current" : ""}`} />
                <span>{likeCount}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFavorite}
                className={`${isFavorited ? "text-yellow-500" : ""}`}
              >
                <Bookmark className={`h-5 w-5 mr-2 ${isFavorited ? "fill-current" : ""}`} />
                <span>{favoriteCount}</span>
              </Button>
              <Button variant="ghost" size="sm">
                <MessageCircle className="h-5 w-5 mr-2" />
                <span>{work.commentCount}</span>
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-5 w-5 mr-2" />
              分享
            </Button>
          </div>

          {/* 评论区 */}
          <div>
            <h4 className="font-semibold mb-4">评论 ({work.commentCount})</h4>
            <CommentSection
              comments={comments}
              onAddComment={handleAddComment}
            />
          </div>
        </div>
        
        {/* 分享面板 */}
        {showSharePanel && (
          <div className="absolute inset-0 bg-background/95 flex items-center justify-center p-6 z-10">
            <div className="max-w-sm w-full space-y-6 text-center">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">分享作品</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSharePanel(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-1">{work.studentName}的实验作品</p>
                <p className="text-xs text-muted-foreground">{work.experimentTitle}</p>
              </div>
              
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-xl border">
                  <QRCodeSVG value={shareUrl} size={160} level="M" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">微信扫码查看作品</p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-muted rounded-md border-0"
                />
                <Button
                  onClick={copyShareLink}
                  variant={linkCopied ? "default" : "outline"}
                >
                  {linkCopied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      复制
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                分享给老师和同学，邀请他们点赞、评论和收藏
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
