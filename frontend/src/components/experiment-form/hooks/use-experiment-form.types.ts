import { z } from "zod"
import type React from "react"

import type {
  AIExperimentSuggestion,
  DifficultyLevel,
  Experiment,
  ExperimentStatus,
  ExperimentStep,
  GradeLevel,
  Material,
  SafetyTip,
  SubjectCategory,
  VideoStyle,
} from "@/lib/types"

export type ExperimentFormTabKey = "basic" | "materials" | "steps" | "video"

export const experimentFormSchema = z.object({
  title: z.string().trim().min(1, "请输入实验名称"),
})

export type VideoAIProcessing = {
  hasSubtitle: boolean
  originalLanguage: "zh" | "en" | "unknown"
  targetLanguage: "zh" | "en" | null
  subtitleStatus: "idle" | "extracting" | "translating" | "generating" | "done"
  voiceStatus: "idle" | "extracting" | "translating" | "generating" | "done"
  translatedUrl: string | null
  progress: number
}

export type UploadedVideo = {
  id: string
  name: string
  size: string
  duration: string
  url: string
  thumbnail: string
  uploadedAt: Date
  status: "uploading" | "processing" | "ready" | "error"
  progress?: number
  aiProcessing?: VideoAIProcessing
}

export type ExperimentFormApi = {
  meta: { experiment?: Experiment }
  ui: { activeTab: ExperimentFormTabKey; setActiveTab: (next: ExperimentFormTabKey) => void }
  values: {
    title: string
    description: string
    category: SubjectCategory
    subcategory: string
    difficulty: DifficultyLevel
    selectedGrades: GradeLevel[]
    duration: string
    materials: Material[]
    steps: ExperimentStep[]
    safetyTips: SafetyTip[]
    videoUrl: string
    selectedVideoStyle: VideoStyle
    publishStatus: ExperimentStatus
  }
  setters: {
    setTitle: (v: string) => void
    setDescription: (v: string) => void
    setCategory: (v: SubjectCategory) => void
    setSubcategory: (v: string) => void
    setDifficulty: (v: DifficultyLevel) => void
    setDuration: (v: string) => void
    setSelectedVideoStyle: (v: VideoStyle) => void
    setPublishStatus: (v: ExperimentStatus) => void
    setVideoUrl: (v: string) => void
  }
  actions: {
    handleSubmit: () => void
    validate: () => boolean
    handleAIGenerate: () => Promise<void>
    handleFieldAI: (field: string) => Promise<void>
    handleGenerateVideo: () => Promise<void>
    toggleGrade: (grade: GradeLevel) => void
    addMaterial: () => void
    removeMaterial: (index: number) => void
    updateMaterial: (index: number, field: keyof Material, value: string | boolean) => void
    addStep: () => void
    removeStep: (index: number) => void
    updateStep: (index: number, field: keyof ExperimentStep, value: string) => void
    addSafetyTip: (type: SafetyTip["type"]) => void
    removeSafetyTip: (index: number) => void
    updateSafetyTip: (index: number, content: string) => void
  }
  validation: { errors: { title?: string } }
  video: {
    uploadedVideos: UploadedVideo[]
    isDragging: boolean
    selectedVideoId: string | null
    processingVideoId: string | null
    showAIPanel: string | null
    generatedVideoUrl: string
    isGeneratingVideo: boolean
    videoProgress: number
    setShowAIPanel: (next: string | null) => void
    handleVideoUpload: (files: FileList | null) => void
    removeVideo: (videoId: string) => void
    selectVideoAsMain: (video: UploadedVideo) => void
    startAIVideoProcessing: (videoId: string, targetLang: "zh" | "en") => void
    confirmTranslatedVideo: (video: UploadedVideo) => void
    cancelAIProcessing: (videoId: string) => void
    handleDragOver: (e: React.DragEvent) => void
    handleDragLeave: (e: React.DragEvent) => void
    handleDrop: (e: React.DragEvent) => void
  }
  ai: {
    isGenerating: boolean
    aiSuggestion: AIExperimentSuggestion | null
    fieldGenerating: string | null
  }
}

export type UseExperimentFormArgs = {
  open: boolean
  experiment?: Experiment
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Partial<Experiment>) => void
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB"
}

