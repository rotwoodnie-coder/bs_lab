import * as React from "react"

import { formatFileSize, type UploadedVideo } from "./use-experiment-form.types"

type UseExperimentFormVideoArgs = {
  setVideoUrl: (url: string) => void
}

export function useExperimentFormVideo({ setVideoUrl }: UseExperimentFormVideoArgs) {
  const [uploadedVideos, setUploadedVideos] = React.useState<UploadedVideo[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const [selectedVideoId, setSelectedVideoId] = React.useState<string | null>(null)
  const [processingVideoId, setProcessingVideoId] = React.useState<string | null>(null)
  const [showAIPanel, setShowAIPanel] = React.useState<string | null>(null)

  const simulateUpload = React.useCallback((videoId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 20
      if (progress >= 100) {
        clearInterval(interval)
        setUploadedVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, status: "processing", progress: 100 } : v)))
        setTimeout(() => {
          setUploadedVideos((prev) =>
            prev.map((v) =>
              v.id === videoId
                ? {
                    ...v,
                    status: "ready",
                    duration: `${Math.floor(Math.random() * 10 + 5)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
                    thumbnail: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000)}?w=320&h=180&fit=crop`,
                  }
                : v
            )
          )
        }, 1500)
      } else {
        setUploadedVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, progress } : v)))
      }
    }, 200)
  }, [])

  const handleVideoUpload = React.useCallback(
    (files: FileList | null) => {
      if (!files) return
      Array.from(files).forEach((file) => {
        if (!file.type.startsWith("video/")) {
          alert("请上传视频文件")
          return
        }
        const newVideo: UploadedVideo = {
          id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: formatFileSize(file.size),
          duration: "--:--",
          url: URL.createObjectURL(file),
          thumbnail: "",
          uploadedAt: new Date(),
          status: "uploading",
          progress: 0,
        }
        setUploadedVideos((prev) => [...prev, newVideo])
        simulateUpload(newVideo.id)
      })
    },
    [simulateUpload]
  )

  const removeVideo = React.useCallback(
    (videoId: string) => {
      setUploadedVideos((prev) => prev.filter((v) => v.id !== videoId))
      if (selectedVideoId === videoId) setSelectedVideoId(null)
    },
    [selectedVideoId]
  )

  const selectVideoAsMain = React.useCallback(
    (video: UploadedVideo) => {
      setSelectedVideoId(video.id)
      setVideoUrl(video.aiProcessing?.translatedUrl || video.url)
    },
    [setVideoUrl]
  )

  const simulateAIProcessing = React.useCallback((videoId: string, targetLang: "zh" | "en") => {
    const stages = [
      { subtitle: "extracting", voice: "idle", progress: 10, delay: 800 },
      { subtitle: "translating", voice: "extracting", progress: 30, delay: 1200 },
      { subtitle: "generating", voice: "translating", progress: 50, delay: 1500 },
      { subtitle: "done", voice: "generating", progress: 75, delay: 1200 },
      { subtitle: "done", voice: "done", progress: 100, delay: 800 },
    ] as const

    let stageIndex = 0
    const processNextStage = () => {
      if (stageIndex >= stages.length) {
        setUploadedVideos((prev) =>
          prev.map((v) =>
            v.id === videoId && v.aiProcessing
              ? {
                  ...v,
                  aiProcessing: {
                    ...v.aiProcessing,
                    subtitleStatus: "done",
                    voiceStatus: "done",
                    progress: 100,
                    translatedUrl: v.url + `?translated=${targetLang}&t=${Date.now()}`,
                  },
                }
              : v
          )
        )
        setProcessingVideoId(null)
        return
      }

      const stage = stages[stageIndex]
      setUploadedVideos((prev) =>
        prev.map((v) =>
          v.id === videoId && v.aiProcessing
            ? {
                ...v,
                aiProcessing: { ...v.aiProcessing, subtitleStatus: stage.subtitle, voiceStatus: stage.voice, progress: stage.progress },
              }
            : v
        )
      )
      stageIndex++
      setTimeout(processNextStage, stage.delay)
    }
    processNextStage()
  }, [])

  const startAIVideoProcessing = React.useCallback(
    (videoId: string, targetLang: "zh" | "en") => {
      setProcessingVideoId(videoId)
      setUploadedVideos((prev) =>
        prev.map((v) =>
          v.id === videoId
            ? {
                ...v,
                aiProcessing: {
                  hasSubtitle: true,
                  originalLanguage: targetLang === "zh" ? "en" : "zh",
                  targetLanguage: targetLang,
                  subtitleStatus: "extracting",
                  voiceStatus: "idle",
                  translatedUrl: null,
                  progress: 0,
                },
              }
            : v
        )
      )
      simulateAIProcessing(videoId, targetLang)
    },
    [simulateAIProcessing]
  )

  const confirmTranslatedVideo = React.useCallback(
    (video: UploadedVideo) => {
      if (!video.aiProcessing?.translatedUrl) return
      setSelectedVideoId(video.id)
      setVideoUrl(video.aiProcessing.translatedUrl)
      setShowAIPanel(null)
    },
    [setVideoUrl]
  )

  const cancelAIProcessing = React.useCallback((videoId: string) => {
    setUploadedVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, aiProcessing: undefined } : v)))
    setProcessingVideoId(null)
    setShowAIPanel(null)
  }, [])

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleVideoUpload(e.dataTransfer.files)
    },
    [handleVideoUpload]
  )

  const reset = React.useCallback(() => {
    setUploadedVideos([])
    setIsDragging(false)
    setSelectedVideoId(null)
    setProcessingVideoId(null)
    setShowAIPanel(null)
  }, [])

  return {
    uploadedVideos,
    isDragging,
    selectedVideoId,
    processingVideoId,
    showAIPanel,
    setShowAIPanel,
    handleVideoUpload,
    removeVideo,
    selectVideoAsMain,
    startAIVideoProcessing,
    confirmTranslatedVideo,
    cancelAIProcessing,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    reset,
  }
}

