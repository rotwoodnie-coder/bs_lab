"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, Button, Badge } from "@bs-lab/ui"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bs-lab/ui"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@bs-lab/ui"
import { Clock, Star, Eye, MoreVertical, Edit, Trash2, Copy, AlertTriangle } from "@bs-lab/ui/icons"
import type { Experiment } from "@/lib/types"

interface ExperimentManageCardProps {
  experiment: Experiment
  onEdit: (experiment: Experiment) => void
  onDelete: (id: string) => void
  onDuplicate: (experiment: Experiment) => void
  onClick: (experiment: Experiment) => void
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

export function ExperimentManageCard({
  experiment,
  onEdit,
  onDelete,
  onDuplicate,
  onClick,
}: ExperimentManageCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = () => {
    onDelete(experiment.id)
    setShowDeleteDialog(false)
  }

  return (
    <>
    <Card 
      className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={() => onClick(experiment)}
    >
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={experiment.thumbnail}
          alt={experiment.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <Badge className={difficultyColors[experiment.difficulty]}>
            {experiment.difficulty}
          </Badge>
          <Badge variant="secondary" className="bg-white/90 text-foreground">
            {categoryLabels[experiment.category]}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {experiment.title}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(experiment); }}>
                <Edit className="h-4 w-4 mr-2" />
                编辑实验
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(experiment); }}>
                <Copy className="h-4 w-4 mr-2" />
                复制实验
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除实验
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
          {experiment.description}
        </p>

        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{experiment.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{experiment.rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{experiment.viewCount}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <span className="text-xs text-muted-foreground">
            {experiment.grades?.length > 2 
              ? `${experiment.grades[0]}等${experiment.grades.length}个年级` 
              : experiment.grades?.join("、") || "未设置"} · {experiment.subcategory}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDisplayDate(experiment.createdAt)}
          </span>
        </div>
      </CardContent>
    </Card>

    {/* 删除确认对话框 */}
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>确认删除实验</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            确定要删除实验 <span className="font-medium text-foreground">"{experiment.title}"</span> 吗？
            此操作无法撤销，实验的所有数据将被永久删除。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            确认删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
