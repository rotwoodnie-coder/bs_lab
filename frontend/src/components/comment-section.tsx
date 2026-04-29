"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage, Button, Textarea, Badge } from "@bs-lab/ui"
import { Heart, Send } from "@bs-lab/ui/icons"
import type { Comment } from "@/lib/types"
import { useUser } from "@/lib/user-context"

interface CommentSectionProps {
  comments: Comment[]
  onAddComment: (content: string, comment: Comment) => void
}

const formatDisplayDate = (value: unknown): string => {
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString("zh-CN")
  }

  if (value && typeof value === "object" && "getTime" in value) {
    const getTime = (value as { getTime?: unknown }).getTime
    if (typeof getTime === "function") {
      const time = getTime.call(value)
      return Number.isNaN(time) ? String(value) : new Date(time).toLocaleDateString("zh-CN")
    }
  }

  return String(value)
}

export function CommentSection({ comments, onAddComment }: CommentSectionProps) {
  const { user } = useUser()
  const [newComment, setNewComment] = useState("")
  const [localComments, setLocalComments] = useState<Comment[]>(comments ?? [])
  
  // 同步外部 comments 变化
  useEffect(() => {
    setLocalComments(comments ?? [])
  }, [comments])

  const handleSubmit = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      workId: "",
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      userRole: user.role,
      content: newComment,
      createdAt: new Date().toLocaleDateString("zh-CN"),
      likes: 0,
    }

    setLocalComments([comment, ...localComments])
    onAddComment(newComment, comment)
    setNewComment("")
  }

  return (
    <div className="space-y-6">
      {/* 评论输入 */}
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="写下你的评论..."
            rows={2}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button 
              size="sm" 
              onClick={handleSubmit}
              disabled={!newComment.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              发送
            </Button>
          </div>
        </div>
      </div>

      {/* 评论列表 */}
      <div className="space-y-4">
        {localComments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            还没有评论，快来抢沙发吧~
          </p>
        ) : (
          localComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  )
}

function CommentItem({ comment }: { comment: Comment }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(comment.likes)

  const handleLike = () => {
    setLiked(!liked)
    setLikeCount(prev => liked ? prev - 1 : prev + 1)
  }

  return (
    <div className="flex gap-3">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={comment.userAvatar} alt={comment.userName} />
        <AvatarFallback>{comment.userName.slice(0, 1)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{comment.userName}</span>
          {comment.userRole === "teacher" && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              老师
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDisplayDate(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm text-foreground">{comment.content}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={`h-7 px-2 mt-1 ${liked ? "text-red-500" : "text-muted-foreground"}`}
        >
          <Heart className={`h-3.5 w-3.5 mr-1 ${liked ? "fill-current" : ""}`} />
          <span className="text-xs">{likeCount > 0 ? likeCount : "赞"}</span>
        </Button>
      </div>
    </div>
  )
}
