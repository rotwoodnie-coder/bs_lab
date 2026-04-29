import * as React from "react"

import { getAIExperimentSuggestion } from "@/lib/ai-experiment-templates"
import type { DifficultyLevel, ExperimentStatus, ExperimentStep, GradeLevel, Material, SafetyTip, SubjectCategory, VideoStyle } from "@/lib/types"

import { useExperimentFormVideo } from "./use-experiment-form.video"
import { experimentFormSchema, type ExperimentFormApi, type UseExperimentFormArgs } from "./use-experiment-form.types"

export type { ExperimentFormApi, ExperimentFormTabKey, UploadedVideo, UseExperimentFormArgs } from "./use-experiment-form.types"

export function useExperimentForm({ open, experiment, onOpenChange, onSubmit }: UseExperimentFormArgs): ExperimentFormApi {
  const [activeTab, setActiveTab] = React.useState<"basic" | "materials" | "steps" | "video">("basic")

  const [title, setTitle] = React.useState(experiment?.title || "")
  const [description, setDescription] = React.useState(experiment?.description || "")
  const [category, setCategory] = React.useState<SubjectCategory>(experiment?.category || "physics")
  const [subcategory, setSubcategory] = React.useState(experiment?.subcategory || "")
  const [difficulty, setDifficulty] = React.useState<DifficultyLevel>(experiment?.difficulty || "中等")
  const [selectedGrades, setSelectedGrades] = React.useState<GradeLevel[]>(experiment?.grades || [])
  const [duration, setDuration] = React.useState(experiment?.duration || "")
  const [materials, setMaterials] = React.useState<Material[]>(experiment?.materials || [{ name: "", quantity: "", optional: false }])
  const [steps, setSteps] = React.useState<ExperimentStep[]>(experiment?.steps || [{ order: 1, title: "", description: "" }])
  const [safetyTips, setSafetyTips] = React.useState<SafetyTip[]>(experiment?.safetyTips || [])
  const [videoUrl, setVideoUrl] = React.useState(experiment?.videoUrl || "")
  const [selectedVideoStyle, setSelectedVideoStyle] = React.useState<VideoStyle>("documentary")
  const [publishStatus, setPublishStatus] = React.useState<ExperimentStatus>(experiment?.status || "draft")

  const [isGenerating, setIsGenerating] = React.useState(false)
  const [isGeneratingVideo, setIsGeneratingVideo] = React.useState(false)
  const [aiSuggestion, setAiSuggestion] = React.useState<ReturnType<typeof getAIExperimentSuggestion> | null>(null)
  const [videoProgress, setVideoProgress] = React.useState(0)
  const [generatedVideoUrl, setGeneratedVideoUrl] = React.useState("")
  const [fieldGenerating, setFieldGenerating] = React.useState<string | null>(null)
  const [errors, setErrors] = React.useState<{ title?: string }>({})

  const videoState = useExperimentFormVideo({ setVideoUrl })

  React.useEffect(() => {
    if (!open) return
    if (experiment) {
      setTitle(experiment.title || "")
      setDescription(experiment.description || "")
      setCategory(experiment.category || "physics")
      setSubcategory(experiment.subcategory || "")
      setDifficulty(experiment.difficulty || "中等")
      setSelectedGrades(experiment.grades || [])
      setDuration(experiment.duration || "")
      setMaterials(experiment.materials?.length ? experiment.materials : [{ name: "", quantity: "", optional: false }])
      setSteps(experiment.steps?.length ? experiment.steps : [{ order: 1, title: "", description: "" }])
      setSafetyTips(experiment.safetyTips || [])
      setVideoUrl(experiment.videoUrl || "")
      setPublishStatus(experiment.status || "draft")
    } else {
      setTitle("")
      setDescription("")
      setCategory("physics")
      setSubcategory("")
      setDifficulty("中等")
      setSelectedGrades([])
      setDuration("")
      setMaterials([{ name: "", quantity: "", optional: false }])
      setSteps([{ order: 1, title: "", description: "" }])
      setSafetyTips([])
      setVideoUrl("")
      setPublishStatus("draft")
      setAiSuggestion(null)
      setGeneratedVideoUrl("")
      videoState.reset()
    }
    setActiveTab("basic")
    setErrors({})
  }, [open, experiment, videoState])

  const validate = React.useCallback(() => {
    const parsed = experimentFormSchema.safeParse({ title })
    if (parsed.success) return (setErrors({}), true)
    const titleError = parsed.error.issues.find((i) => i.path[0] === "title")?.message
    setErrors({ title: titleError })
    return false
  }, [title])

  const handleAIGenerate = React.useCallback(async () => {
    if (!title.trim()) return alert("请先输入实验主题或名称")
    setIsGenerating(true)
    await new Promise((r) => setTimeout(r, 1500))
    try {
      const s = getAIExperimentSuggestion(title)
      setAiSuggestion(s)
      s.title && setTitle(s.title)
      s.description && setDescription(s.description)
      s.category && setCategory(s.category as SubjectCategory)
      s.subcategory && setSubcategory(s.subcategory)
      s.difficulty && setDifficulty(s.difficulty)
      s.grades && setSelectedGrades(s.grades as GradeLevel[])
      s.duration && setDuration(s.duration)
      s.materials && setMaterials(s.materials)
      s.steps && setSteps(s.steps)
      s.safetyTips && setSafetyTips(s.safetyTips)
    } catch (e) {
      console.error("生成失败:", e)
      alert("生成失败，请稍后重试")
    } finally {
      setIsGenerating(false)
    }
  }, [title])

  const handleFieldAI = React.useCallback(async (field: string) => {
    setFieldGenerating(field)
    await new Promise((r) => setTimeout(r, 800))
    try {
      const s = getAIExperimentSuggestion(title || category)
      if (field === "title") setTitle(s.title)
      if (field === "description") setDescription(s.description)
      if (field === "materials") setMaterials(s.materials)
      if (field === "steps") setSteps(s.steps)
      if (field === "safetyTips") setSafetyTips(s.safetyTips)
      if (field === "subject") setCategory(s.category as SubjectCategory)
      if (field === "grades") setSelectedGrades(s.grades as GradeLevel[])
    } catch (e) {
      console.error("优化失败:", e)
      alert("优化失败，请稍后重试")
    } finally {
      setFieldGenerating(null)
    }
  }, [title, category])

  const handleGenerateVideo = React.useCallback(async () => {
    if (!title || !description || steps.length === 0) return alert("请先完善实验的基本信息和步骤")
    setIsGeneratingVideo(true)
    setVideoProgress(0)
    try {
      const timer = setInterval(() => setVideoProgress((p) => (p >= 90 ? (clearInterval(timer), 90) : p + Math.random() * 15)), 500)
      const response = await fetch("/api/ai/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, steps, style: selectedVideoStyle }),
      })
      clearInterval(timer)
      if (!response.ok) throw new Error("视频生成失败")
      const { videoUrl: generatedUrl } = (await response.json()) as { videoUrl: string }
      setVideoProgress(100)
      setGeneratedVideoUrl(generatedUrl)
      setVideoUrl(generatedUrl)
    } catch (e) {
      console.error("视频生成失败:", e)
      alert("视频生成失败，请稍后重试")
    } finally {
      setTimeout(() => {
        setIsGeneratingVideo(false)
        setVideoProgress(0)
      }, 1000)
    }
  }, [title, description, steps, selectedVideoStyle])

  const handleSubmit = React.useCallback(() => {
    if (!validate()) return alert("请输入实验名称")
    onSubmit({
      ...experiment,
      title,
      description,
      category,
      subcategory,
      difficulty,
      grades: selectedGrades,
      duration,
      materials: materials.filter((m) => m.name.trim()),
      steps: steps.filter((s) => s.title.trim() || s.description.trim()),
      safetyTips: safetyTips.filter((t) => t.content.trim()),
      videoUrl,
      status: publishStatus,
    })
    onOpenChange(false)
  }, [validate, onSubmit, experiment, title, description, category, subcategory, difficulty, selectedGrades, duration, materials, steps, safetyTips, videoUrl, publishStatus, onOpenChange])

  const updateMaterial = (index: number, field: keyof Material, value: string | boolean) =>
    setMaterials((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)))
  const updateStep = (index: number, field: keyof ExperimentStep, value: string) =>
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  const updateSafetyTip = (index: number, content: string) =>
    setSafetyTips((prev) => prev.map((t, i) => (i === index ? { ...t, content } : t)))

  return {
    meta: { experiment },
    ui: { activeTab, setActiveTab },
    values: { title, description, category, subcategory, difficulty, selectedGrades, duration, materials, steps, safetyTips, videoUrl, selectedVideoStyle, publishStatus },
    setters: { setTitle, setDescription, setCategory, setSubcategory, setDifficulty, setDuration, setSelectedVideoStyle, setPublishStatus, setVideoUrl },
    actions: {
      handleSubmit,
      validate,
      handleAIGenerate,
      handleFieldAI,
      handleGenerateVideo,
      toggleGrade: (grade) => setSelectedGrades((prev) => (prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade])),
      addMaterial: () => setMaterials((prev) => [...prev, { name: "", quantity: "", optional: false }]),
      removeMaterial: (index) => setMaterials((prev) => prev.filter((_, i) => i !== index)),
      updateMaterial,
      addStep: () => setSteps((prev) => [...prev, { order: prev.length + 1, title: "", description: "" }]),
      removeStep: (index) => setSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }))),
      updateStep,
      addSafetyTip: (type) => setSafetyTips((prev) => [...prev, { type, content: "" }]),
      removeSafetyTip: (index) => setSafetyTips((prev) => prev.filter((_, i) => i !== index)),
      updateSafetyTip,
    },
    validation: { errors },
    video: {
      ...videoState,
      generatedVideoUrl,
      isGeneratingVideo,
      videoProgress,
    },
    ai: { isGenerating, aiSuggestion, fieldGenerating },
  }
}

