"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, Button, Avatar, AvatarFallback, AvatarImage, Badge } from "@bs-lab/ui"
import { Heart, Bookmark, MessageCircle, Share2, Play } from "@bs-lab/ui/icons"
import type { StudentWork } from "@/lib/types"

interface StudentWorkCardProps {
  work: StudentWork
  onLike: (id: string) => void
  onFavorite: (id: string) => void
  onComment: (id: string) => void
  onShare: (work: StudentWork) => void
  onClick: (work: StudentWork) => void
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

export function StudentWorkCard({
  work,
  onLike,
  onFavorite,
  onComment,
  onShare,
  onClick,
}: StudentWorkCardProps) {
  const [isLiked, setIsLiked] = useState(work.isLiked || false)
  const [isFavorited, setIsFavorited] = useState(work.isFavorited || false)
  const [likeCount, setLikeCount] = useState(work.likeCount)
  const [favoriteCount, setFavoriteCount] = useState(work.favoriteCount)

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
    onLike(work.id)
  }

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsFavorited(!isFavorited)
    setFavoriteCount(prev => isFavorited ? prev - 1 : prev + 1)
    onFavorite(work.id)
  }

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <div 
        className="relative aspect-video overflow-hidden cursor-pointer"
        onClick={() => onClick(work)}
      >
        <Image
          src={work.thumbnail}
          alt={work.experimentTitle}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="p-4 bg-white/90 rounded-full">
            <Play className="h-8 w-8 text-primary fill-primary" />
          </div>
        </div>
        <Badge className="absolute top-3 left-3 bg-primary/90">
          {work.experimentTitle}
        </Badge>
      </div>

      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={work.studentAvatar} alt={work.studentName} />
            <AvatarFallback>{work.studentName.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{work.studentName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDisplayDate(work.createdAt)}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {work.description}
        </p>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`h-8 px-2 ${isLiked ? "text-red-500" : "text-muted-foreground"}`}
            >
              <Heart className={`h-4 w-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
              <span className="text-xs">{likeCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavorite}
              className={`h-8 px-2 ${isFavorited ? "text-yellow-500" : "text-muted-foreground"}`}
            >
              <Bookmark className={`h-4 w-4 mr-1 ${isFavorited ? "fill-current" : ""}`} />
              <span className="text-xs">{favoriteCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onComment(work.id)
              }}
              className="h-8 px-2 text-muted-foreground"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              <span className="text-xs">{work.commentCount}</span>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onShare(work)
            }}
            className="h-8 px-2 text-muted-foreground hover:text-primary"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
