"use client"

import { useState, useRef } from "react"
import { Button, Input, Textarea, Label, Progress, MediaPreview } from "@bs-lab/ui"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@bs-lab/ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bs-lab/ui"
import { FileVideo, RefreshCw, QrCode, ExternalLink, PartyPopper } from "@bs-lab/ui/icons"
import { Video } from "@bs-lab/ui/icons"
import { Upload, CheckCircle2, X, Play, Clock, Loader2, Share2, Copy, MessageCircle, Heart, Bookmark } from "@bs-lab/ui/icons"
import { QRCodeSVG } from "qrcode.react"
import type { Experiment, StudentWork } from "@/lib/types"

interface UploadedVideo {
  id: string
  name: string
  size: string
  duration: string
  url: string
  thumbnail: string
  status: "uploading" | "processing" | "ready" | "error"
  progress: number
}

interface UploadWorkFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  experiments: Experiment[]
  onSubmit: (data: Partial<StudentWork>) => void
}

export function UploadWorkForm({ open, onOpenChange, experiments, onSubmit }: UploadWorkFormProps) {
  const [experimentId, setExperimentId] = useState("")
  const [description, setDescription] = useState("")
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideo | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 发布成功后的分享状态
  const [publishedWork, setPublishedWork] = useState<{
    id: string
    title: string
    shareUrl: string
  } | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  const selectedExperiment = experiments.find(e => e.id === experimentId)

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB"
  }

  const handleVideoUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const file = files[0]
    if (!file.type.startsWith("video/")) {
      alert("请上传视频文件")
      return
    }

    // 检查文件大小 (200MB)
    if (file.size > 200 * 1024 * 1024) {
      alert("视频文件不能超过200MB")
      return
    }

    const newVideo: UploadedVideo = {
      id: `video-${Date.now()}`,
      name: file.name,
      size: formatFileSize(file.size),
      duration: "--:--",
      url: URL.createObjectURL(file),
      thumbnail: "",
      status: "uploading",
      progress: 0,
    }

    setUploadedVideo(newVideo)
    simulateUpload(newVideo.id)
  }

  const simulateUpload = (videoId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5
      if (progress >= 100) {
        clearInterval(interval)
        setUploadedVideo(prev => 
          prev && prev.id === videoId
            ? { ...prev, status: "processing", progress: 100 }
            : prev
        )
        // 模拟处理
        setTimeout(() => {
          setUploadedVideo(prev =>
            prev && prev.id === videoId
              ? { 
                  ...prev, 
                  status: "ready", 
                  duration: `${Math.floor(Math.random() * 5 + 1)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                  thumbnail: selectedExperiment?.thumbnail || `https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=320&h=180&fit=crop`
                }
              : prev
          )
        }, 1000)
      } else {
        setUploadedVideo(prev =>
          prev && prev.id === videoId ? { ...prev, progress } : prev
        )
      }
    }, 150)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleVideoUpload(e.dataTransfer.files)
  }

  const removeVideo = () => {
    setUploadedVideo(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!experimentId || !uploadedVideo || uploadedVideo.status !== "ready") return

    const workId = `work-${Date.now()}`
    
    onSubmit({
      experimentId,
      experimentTitle: selectedExperiment?.title,
      description,
      videoUrl: uploadedVideo.url,
      thumbnail: uploadedVideo.thumbnail || selectedExperiment?.thumbnail,
    })
    
    // 显示发布成功界面
    setPublishedWork({
      id: workId,
      title: selectedExperiment?.title || "我的实验作品",
      shareUrl: `https://science-lab.example.com/work/${workId}`,
    })
  }

  const resetForm = () => {
    setExperimentId("")
    setDescription("")
    setUploadedVideo(null)
    setPublishedWork(null)
    setLinkCopied(false)
  }
  
  const copyShareLink = async () => {
    if (!publishedWork) return
    try {
      await navigator.clipboard.writeText(publishedWork.shareUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      // Fallback
      const input = document.createElement("input")
      input.value = publishedWork.shareUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }
  
  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm()
      onOpenChange(open)
    }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {publishedWork ? (
          // 发布成功 - 分享界面
          <>
            <DialogHeader className="text-center">
              <div className="flex justify-center mb-2">
                <div className="p-3 bg-green-100 rounded-full">
                  <PartyPopper className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <DialogTitle className="text-xl">作品发布成功！</DialogTitle>
              <DialogDescription>
                分享给老师和同学，邀请他们来点赞、评论和收藏吧
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* 作品信息 */}
              <div className="bg-secondary/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  {uploadedVideo && (
                    <div className="w-20 h-14 rounded overflow-hidden bg-muted flex-shrink-0">
                      <MediaPreview
                        kind="video"
                        src={uploadedVideo.url}
                        posterSrc={uploadedVideo.thumbnail}
                        className="size-full object-cover"
                        alt=""
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-medium truncate">{publishedWork.title}</h4>
                    <p className="text-sm text-muted-foreground truncate">{description || "我的实验作品"}</p>
                  </div>
                </div>
              </div>
              
              {/* 二维码 */}
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-white rounded-xl border">
                  <QRCodeSVG 
                    value={publishedWork.shareUrl} 
                    size={160}
                    level="M"
                  />
                </div>
                <p className="text-sm text-muted-foreground">微信扫码查看作品</p>
              </div>
              
              {/* 分享链接 */}
              <div className="space-y-2">
                <Label className="text-sm">分享链接</Label>
                <div className="flex gap-2">
                  <Input 
                    value={publishedWork.shareUrl} 
                    readOnly 
                    className="bg-muted text-sm"
                  />
                  <Button
                    type="button"
                    variant={linkCopied ? "default" : "outline"}
                    onClick={copyShareLink}
                    className="shrink-0"
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
              </div>
              
              {/* 互动提示 */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-primary" />
                  邀请互动
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  分享链接给老师和同学，他们可以进行以下互动：
                </p>
                <div className="flex items-center gap-6 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Heart className="h-4 w-4 text-red-500" />
                    点赞
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    评论
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Bookmark className="h-4 w-4 text-yellow-500" />
                    收藏
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={handleClose}>
                关闭
              </Button>
              <Button onClick={() => window.open(publishedWork.shareUrl, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                查看作品
              </Button>
            </div>
          </>
        ) : (
          // 上传表单
          <>
        <DialogHeader>
          <DialogTitle>上传我的实验作品</DialogTitle>
          <DialogDescription>
            分享你的实验过程，让老师和同学们看到你的精彩表现
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>选择实验</Label>
            <Select value={experimentId} onValueChange={setExperimentId}>
              <SelectTrigger>
                <SelectValue placeholder="选择你完成的实验" />
              </SelectTrigger>
              <SelectContent>
                {experiments?.map((exp) => (
                  <SelectItem key={exp.id} value={exp.id}>
                    <div className="flex items-center gap-2">
                      <span>{exp.title}</span>
                      <span className="text-xs text-muted-foreground">
                        ({exp.category === "physics" ? "物理" : exp.category === "chemistry" ? "化学" : "生物"})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>上传视频</Label>
            
            {!uploadedVideo ? (
              // 上传区域
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                  isDragging 
                    ? "border-primary bg-primary/5" 
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={e => handleVideoUpload(e.target.files)}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className={`p-3 rounded-full ${isDragging ? "bg-primary/10" : "bg-muted"}`}>
                    <Video className={`h-6 w-6 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="font-medium">
                      {isDragging ? "释放文件以上传" : "拖拽视频文件到此处"}
                    </p>
                    <p className="text-sm text-muted-foreground">或点击选择文件上传</p>
                  </div>
                  <p className="text-xs text-muted-foreground">支持 MP4、MOV 格式，最大 200MB</p>
                </div>
              </div>
            ) : (
              // 已上传视频卡片
              <div className="border rounded-lg overflow-hidden">
                {/* 视频预览 */}
                <div className="relative aspect-video bg-muted">
                  {uploadedVideo.status === "ready" ? (
                    <>
                      <MediaPreview
                        kind="video"
                        variant="default"
                        src={uploadedVideo.url}
                        className="size-full object-cover"
                        alt=""
                        videoProps={{
                          poster: uploadedVideo.thumbnail,
                          controls: false,
                          preload: "metadata",
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="gap-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(uploadedVideo.url, "_blank")
                          }}
                        >
                          <Play className="h-4 w-4" />
                          播放预览
                        </Button>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {uploadedVideo.duration}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                      {uploadedVideo.status === "uploading" ? (
                        <>
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <div className="w-48 space-y-2">
                            <Progress value={uploadedVideo.progress} className="h-2" />
                            <p className="text-sm text-muted-foreground text-center">
                              上传中 {Math.round(uploadedVideo.progress)}%
                            </p>
                          </div>
                        </>
                      ) : uploadedVideo.status === "processing" ? (
                        <>
                          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">处理中...</p>
                        </>
                      ) : (
                        <>
                          <FileVideo className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-destructive">上传失败</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                {/* 视频信息 */}
                <div className="p-3 flex items-center justify-between bg-muted/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileVideo className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{uploadedVideo.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{uploadedVideo.size}</span>
                        {uploadedVideo.status === "ready" && (
                          <>
                            <span>|</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {uploadedVideo.duration}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadedVideo.status === "ready" && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={removeVideo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">作品描述</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="分享一下你的实验心得，遇到了什么有趣的现象？"
              rows={4}
            />
          </div>

          <div className="bg-secondary/50 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-2">温馨提示</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>- 确保视频清晰，能看清实验过程</li>
              <li>- 可以配上解说，讲解你的操作��骤</li>
              <li>- 注意保护个人隐私，不要拍到敏感信息</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button 
              type="submit" 
              disabled={!experimentId || !uploadedVideo || uploadedVideo.status !== "ready"}
            >
              <Upload className="h-4 w-4 mr-2" />
              发布作品
            </Button>
          </div>
        </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
