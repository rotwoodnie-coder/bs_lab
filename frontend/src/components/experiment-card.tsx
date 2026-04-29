"use client"

import { Play, Clock, Star, BookOpen, BadgeCheck } from "@bs-lab/ui/icons"
import { cn } from "@/lib/utils"
import type { TeacherInfo } from "@/lib/types"

interface ExperimentCardProps {
  id: string
  title: string
  description: string
  thumbnail: string
  duration: string
  difficulty: "简单" | "中等" | "困难"
  rating: number
  category: string
  grades: string[]
  teacher?: TeacherInfo
  onClick?: () => void
}

export function ExperimentCard({
  title,
  description,
  thumbnail,
  duration,
  difficulty,
  rating,
  category,
  grades,
  teacher,
  onClick,
}: ExperimentCardProps) {
  const difficultyColor = {
    简单: "bg-green-100 text-green-700",
    中等: "bg-yellow-100 text-yellow-700",
    困难: "bg-red-100 text-red-700",
  }

  return (
    <div 
      className="group bg-card rounded-xl border border-border overflow-hidden transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-video bg-muted overflow-hidden">
        <img
          src={thumbnail}
          alt={title}
          loading="eager"
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="h-6 w-6 ml-1" />
          </button>
        </div>
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
            {category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", difficultyColor[difficulty])}>
            {difficulty}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground text-lg line-clamp-1 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{description}</p>

        {/* 老师信息 */}
        {teacher && (
          <div className="flex items-center gap-2 mt-3">
            <img 
              src={teacher.avatar} 
              alt={teacher.name}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-sm text-muted-foreground">{teacher.name}</span>
            {teacher.verified && (
              <BadgeCheck className="h-4 w-4 text-primary" />
            )}
            {teacher.title && (
              <span className="text-xs text-muted-foreground">· {teacher.title}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {duration}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {grades.length > 2 ? `${grades[0]}等${grades.length}个年级` : grades.join("、")}
            </span>
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium">{rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
