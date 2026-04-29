"use client"

import { useState } from "react"
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Avatar, AvatarFallback, AvatarImage, Progress, Tabs, TabsContent, TabsList, TabsTrigger, Input, Label, Textarea, Switch, MediaPreview } from "@bs-lab/ui"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@bs-lab/ui"
import { Calendar } from "@bs-lab/ui"
import { Mail, Phone, School, Award, TrendingUp, Users, ThumbsUp, Settings, Palette, Edit3, Camera, Save, BarChart3, FileText, Plus, ExternalLink } from "@bs-lab/ui/icons"
import { Shield, Video } from "@bs-lab/ui/icons"
import { User, BookOpen, FlaskConical, Eye, Star, Bell, ChevronRight, Clock, Sparkles, Trash2, Share2, MoreHorizontal, Play, X, Heart, MessageSquare } from "@bs-lab/ui/icons"
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
import type { Experiment, ShareInfo, StudentWork } from "@/lib/types"

interface TeacherProfileProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  experiments: Experiment[]
  studentWorks?: StudentWork[]
  onShare?: (info: ShareInfo) => void
  onEditExperiment?: (experiment: Experiment) => void
  onDeleteExperiment?: (id: string) => void
  onCreateExperiment?: () => void
}

export function TeacherProfile({ 
  open, 
  onOpenChange, 
  experiments, 
  studentWorks = [],
  onShare,
  onEditExperiment,
  onDeleteExperiment,
  onCreateExperiment
}: TeacherProfileProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditing, setIsEditing] = useState(false)
  
  // 删除确认状态
  const [deleteExpId, setDeleteExpId] = useState<string | null>(null)
  // 预览视频状态
  const [previewWork, setPreviewWork] = useState<StudentWork | null>(null)
  // 预览实验状态
  const [previewExperiment, setPreviewExperiment] = useState<Experiment | null>(null)
  
  // 模拟老师数据
  const [teacherInfo, setTeacherInfo] = useState({
    name: "张老师",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    email: "zhang.teacher@school.edu.cn",
    phone: "138****5678",
    school: "北京市第一中学",
    department: "物理教研组",
    title: "高级教师",
    bio: "从事物理教学15年，专注于创新实验教学方法，致力于激发学生对科学的兴趣。",
    joinDate: "2020-09-01",
  })

  // 统计数据
  const stats = {
    totalExperiments: experiments.length,
    totalViews: experiments.reduce((acc, exp) => acc + (exp.viewCount || 0), 0),
    totalLikes: experiments.reduce((acc, exp) => acc + (exp.likeCount || 0), 0),
    totalFavorites: experiments.reduce((acc, exp) => acc + (exp.favoriteCount || 0), 0),
    avgRating: experiments.length > 0 
      ? (experiments.reduce((acc, exp) => acc + (exp.rating || 0), 0) / experiments.length).toFixed(1)
      : "0.0",
  }

  // 设置状态
  const [settings, setSettings] = useState({
    emailNotification: true,
    workNotification: true,
    commentNotification: true,
    darkMode: false,
    publicProfile: true,
  })

  // 成就数据
  const achievements = [
    { id: 1, name: "实验达人", description: "创建10个以上实验", icon: FlaskConical, unlocked: stats.totalExperiments >= 10, progress: Math.min(stats.totalExperiments / 10 * 100, 100) },
    { id: 2, name: "人气教师", description: "获得1000次浏览", icon: Eye, unlocked: stats.totalViews >= 1000, progress: Math.min(stats.totalViews / 1000 * 100, 100) },
    { id: 3, name: "优质内容", description: "获得100个点赞", icon: ThumbsUp, unlocked: stats.totalLikes >= 100, progress: Math.min(stats.totalLikes / 100 * 100, 100) },
    { id: 4, name: "五星好评", description: "平均评分达到4.5", icon: Star, unlocked: parseFloat(stats.avgRating) >= 4.5, progress: Math.min(parseFloat(stats.avgRating) / 4.5 * 100, 100) },
  ]

  // 最近活动
  const recentActivities = [
    { type: "create", content: "创建了实验「水的沸腾与蒸发」", time: "2小时前" },
    { type: "update", content: "更新了实验「光的折射」的步骤", time: "昨天" },
    { type: "comment", content: "回复了学生小明的提问", time: "2天前" },
    { type: "like", content: "收到了15个新点赞", time: "3天前" },
  ]

  // 模拟互动学生作品数据
  const interactedStudentWorks: (StudentWork & { interactionType: "comment" | "like"; interactionTime: string })[] = [
    {
      id: "sw1",
      experimentId: "exp1",
      experimentTitle: "水的沸腾实验",
      studentId: "student-001",
      studentName: "小明",
      studentAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
      videoUrl: "https://example.com/video1.mp4",
      thumbnail: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop",
      description: "今天的实验非常成功，水在100度时开始沸腾！",
      likeCount: 28,
      favoriteCount: 12,
      commentCount: 6,
      createdAt: "2024-01-15",
      interactionType: "comment",
      interactionTime: "2小时前"
    },
    {
      id: "sw2",
      experimentId: "exp2",
      experimentTitle: "光的折射实验",
      studentId: "student-002",
      studentName: "小红",
      studentAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
      videoUrl: "https://example.com/video2.mp4",
      thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
      description: "观察到了光在水中的折射现象，筷子看起来弯曲了。",
      likeCount: 35,
      favoriteCount: 18,
      commentCount: 9,
      createdAt: "2024-01-14",
      interactionType: "like",
      interactionTime: "昨天"
    },
    {
      id: "sw3",
      experimentId: "exp3",
      experimentTitle: "植物光合作用",
      studentId: "student-003",
      studentName: "小华",
      studentAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      videoUrl: "https://example.com/video3.mp4",
      thumbnail: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=300&fit=crop",
      description: "用碘液验证了叶片在阳光下产生了淀粉！",
      likeCount: 42,
      favoriteCount: 22,
      commentCount: 12,
      createdAt: "2024-01-13",
      interactionType: "comment",
      interactionTime: "2天前"
    }
  ]

  // 分享实验
  const shareExperiment = (exp: Experiment) => {
    if (onShare) {
      onShare({
        url: `https://experiment.example.com/exp/${exp.id}`,
        title: exp.title,
        description: exp.description,
        thumbnail: exp.thumbnail
      })
    }
  }

  // 分享学生作品
  const shareStudentWork = (work: StudentWork) => {
    if (onShare) {
      onShare({
        url: `https://experiment.example.com/works/${work.id}`,
        title: `${work.studentName}的${work.experimentTitle}`,
        description: work.description,
        thumbnail: work.thumbnail
      })
    }
  }

  // 删除实验
  const handleDeleteExperiment = () => {
    if (deleteExpId && onDeleteExperiment) {
      onDeleteExperiment(deleteExpId)
      setDeleteExpId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] lg:max-w-[1400px] xl:max-w-[1700px] 2xl:max-w-[1900px] w-[98vw] h-[94vh] max-h-[94vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>老师个人中心</DialogTitle>
          <DialogDescription>查看和管理您的个人信息与设置</DialogDescription>
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
        
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
          {/* PC端左侧导航栏 */}
          <div className="hidden lg:flex lg:flex-col lg:w-72 xl:w-80 border-r bg-muted/30">
            {/* 用户信息 */}
            <div className="p-6 border-b bg-gradient-to-b from-primary/10 to-transparent">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                    <AvatarImage src={teacherInfo.avatar} alt={teacherInfo.name} />
                    <AvatarFallback className="text-2xl">{teacherInfo.name[0]}</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button size="icon" variant="secondary" className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full">
                      <Camera className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <h2 className="text-lg font-bold mt-3">{teacherInfo.name}</h2>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="secondary" className="text-xs">{teacherInfo.title}</Badge>
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                    <Award className="h-3 w-3 mr-0.5" />
                    认证
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{teacherInfo.school}</p>
              </div>
              
              {/* 统计 */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-background/60 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-primary">{stats.totalExperiments}</p>
                  <p className="text-[10px] text-muted-foreground">实验</p>
                </div>
                <div className="bg-background/60 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-blue-500">{stats.totalViews}</p>
                  <p className="text-[10px] text-muted-foreground">浏览</p>
                </div>
                <div className="bg-background/60 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-rose-500">{stats.totalLikes}</p>
                  <p className="text-[10px] text-muted-foreground">点赞</p>
                </div>
                <div className="bg-background/60 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-amber-500">{stats.avgRating}</p>
                  <p className="text-[10px] text-muted-foreground">评分</p>
                </div>
              </div>
            </div>
            
            {/* 导航菜单 */}
            <nav className="flex-1 p-3 space-y-1">
              {[
                { value: "overview", icon: BarChart3, label: "数据概览" },
                { value: "experiments", icon: FlaskConical, label: "我的实验", badge: experiments.length },
                { value: "student-works", icon: Video, label: "学生作品", badge: interactedStudentWorks.length },
                { value: "profile", icon: User, label: "个人资料" },
                { value: "achievements", icon: Award, label: "我的成就" },
                { value: "settings", icon: Settings, label: "账号设置" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setActiveTab(item.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.value 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {"badge" in item && item.badge !== undefined && (
                    <Badge variant={activeTab === item.value ? "secondary" : "outline"} className="text-xs h-5 px-1.5">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
            
            <div className="p-3 border-t">
              <Button variant="outline" size="sm" className="w-full" onClick={() => setIsEditing(!isEditing)}>
                <Edit3 className="h-4 w-4 mr-2" />
                {isEditing ? "取消编辑" : "编辑资料"}
              </Button>
            </div>
          </div>
          
          {/* 移动端头部 */}
          <div className="lg:hidden bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4 border-b flex-shrink-0">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 border-2 border-background shadow">
                <AvatarImage src={teacherInfo.avatar} alt={teacherInfo.name} />
                <AvatarFallback>{teacherInfo.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold truncate">{teacherInfo.name}</h2>
                  <Badge variant="secondary" className="text-xs">{teacherInfo.title}</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{teacherInfo.school}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{stats.totalExperiments}</p>
                <p className="text-[10px] text-muted-foreground">实验</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-500">{stats.totalViews}</p>
                <p className="text-[10px] text-muted-foreground">浏览</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-rose-500">{stats.totalLikes}</p>
                <p className="text-[10px] text-muted-foreground">点赞</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-500">{stats.avgRating}</p>
                <p className="text-[10px] text-muted-foreground">评分</p>
              </div>
            </div>
          </div>
          
          {/* 右侧内容区 */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* 移动端标签栏 */}
            <div className="lg:hidden border-b flex-shrink-0">
              <div className="flex overflow-x-auto">
                {[
                  { value: "overview", icon: BarChart3, label: "概览" },
                  { value: "experiments", icon: FlaskConical, label: "实验" },
                  { value: "student-works", icon: Users, label: "作品" },
                  { value: "profile", icon: User, label: "资料" },
                  { value: "achievements", icon: Award, label: "成就" },
                  { value: "settings", icon: Settings, label: "设置" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setActiveTab(item.value)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === item.value 
                        ? "border-primary text-primary" 
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* PC端标题栏 */}
            <div className="hidden lg:flex items-center justify-between px-8 py-4 border-b bg-muted/20 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold">
                  {activeTab === "overview" && "数据概览"}
                  {activeTab === "experiments" && "我的实验"}
                  {activeTab === "student-works" && "学生作品"}
                  {activeTab === "profile" && "个人资料"}
                  {activeTab === "achievements" && "我的成就"}
                  {activeTab === "settings" && "账号设置"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "overview" && "查看您的教学数据和最近活动"}
                  {activeTab === "experiments" && `共 ${experiments.length} 个实验，管理和分享您的实验内容`}
                  {activeTab === "student-works" && `共 ${interactedStudentWorks.length} 个互动作品，查看学生的实验成果`}
                  {activeTab === "profile" && "管理您的个人信息"}
                  {activeTab === "achievements" && "查看已解锁的成就和进度"}
                  {activeTab === "settings" && "管理通知和隐私设置"}
                </p>
              </div>
              {activeTab === "experiments" && (
                <Button onClick={onCreateExperiment}>
                  <Plus className="h-4 w-4 mr-2" />
                  创建实验
                </Button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 lg:p-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                <TabsList className="hidden">
                  <TabsTrigger value="overview">概览</TabsTrigger>
                  <TabsTrigger value="experiments">实验</TabsTrigger>
                  <TabsTrigger value="student-works">学生</TabsTrigger>
                  <TabsTrigger value="profile">资料</TabsTrigger>
                  <TabsTrigger value="achievements">成就</TabsTrigger>
                  <TabsTrigger value="settings">设置</TabsTrigger>
                </TabsList>
                {/* 概览 */}
                <TabsContent value="overview" className="mt-0 space-y-6 min-h-[350px]">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* 数据趋势 */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          数据趋势
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">本周浏览量</span>
                            <span className="text-sm font-medium text-green-500">+23%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">本周点赞数</span>
                            <span className="text-sm font-medium text-green-500">+15%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">新增收藏</span>
                            <span className="text-sm font-medium text-green-500">+8%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">学生作品</span>
                            <span className="text-sm font-medium text-blue-500">12 个</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 最近活动 */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          最近活动
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {recentActivities.map((activity, index) => (
                            <div key={index} className="flex items-start gap-3 text-sm">
                              <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-foreground truncate">{activity.content}</p>
                                <p className="text-xs text-muted-foreground">{activity.time}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 热门实验 */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-primary" />
                        热门实验
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {experiments?.slice(0, 3).map((exp, index) => (
                          <div key={exp.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="h-12 w-16 rounded bg-muted overflow-hidden flex-shrink-0">
                              <img src={exp.thumbnail} alt={exp.title} className="h-full w-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{exp.title}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{exp.viewCount || 0}</span>
                                <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{exp.likeCount || 0}</span>
                                <span className="flex items-center gap-1"><Star className="h-3 w-3" />{exp.rating || 0}</span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* 我的实验 */}
                <TabsContent value="experiments" className="mt-0 space-y-4 min-h-[350px]">
                  {experiments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {experiments?.map((exp) => (
                        <Card key={exp.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setPreviewExperiment(exp)}>
                          <div className="relative aspect-video bg-muted">
                            <img 
                              src={exp.thumbnail} 
                              alt={exp.title}
                              className="w-full h-full object-cover"
                            />
                            {/* 悬浮查看提示 */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                                <Eye className="h-6 w-6 text-primary" />
                              </div>
                            </div>
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {exp.category === "physics" ? "物理" : exp.category === "chemistry" ? "化学" : "生物"}
                              </Badge>
                              {/* 发布状态徽��� */}
                              {exp.status === "draft" && (
                                <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300">
                                  草稿
                                </Badge>
                              )}
                              {exp.status === "pending" && (
                                <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300">
                                  待审核
                                </Badge>
                              )}
                              {exp.status === "published" && (
                                <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300">
                                  已发布
                                </Badge>
                              )}
                              {exp.status === "rejected" && (
                                <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300">
                                  已拒绝
                                </Badge>
                              )}
                            </div>
                            <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="secondary" size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setPreviewExperiment(exp)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    查看详情
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onEditExperiment?.(exp)}>
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    编辑实验
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => shareExperiment(exp)}>
                                    <Share2 className="h-4 w-4 mr-2" />
                                    分享实验
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteExpId(exp.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    删除实验
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <CardContent className="p-3">
                            <h4 className="font-medium text-sm truncate">{exp.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{exp.description}</p>
                            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {exp.viewCount || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <ThumbsUp className="h-3 w-3" />
                                  {exp.likeCount || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  {exp.rating || 0}
                                </span>
                              </div>
                              <Badge variant="outline" className="text-[10px]">{exp.difficulty}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                          <FlaskConical className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-medium">还没有实验</h3>
                          <p className="text-sm text-muted-foreground mt-1">创建您的第一个实验吧</p>
                        </div>
                        <Button onClick={onCreateExperiment}>
                          <Plus className="h-4 w-4 mr-2" />
                          创建实验
                        </Button>
                      </div>
                    </Card>
                  )}
                </TabsContent>

                {/* 学生作品 */}
                <TabsContent value="student-works" className="mt-0 space-y-4 min-h-[350px]">
                  {interactedStudentWorks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {interactedStudentWorks?.map((work) => (
                        <Card key={work.id} className="overflow-hidden group">
                          <div className="relative aspect-video bg-muted">
                            <img 
                              src={work.thumbnail} 
                              alt={work.experimentTitle}
                              className="w-full h-full object-cover"
                            />
                            <div 
                              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              onClick={() => setPreviewWork(work)}
                            >
                              <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                                <Play className="h-6 w-6 text-primary fill-primary" />
                              </div>
                            </div>
                            <div className="absolute top-2 left-2">
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${work.interactionType === "comment" ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"}`}
                              >
                                {work.interactionType === "comment" ? (
                                  <><MessageSquare className="h-3 w-3 mr-1" />已评论</>
                                ) : (
                                  <><Heart className="h-3 w-3 mr-1" />已点赞</>
                                )}
                              </Badge>
                            </div>
                            <div className="absolute top-2 right-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="secondary" size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setPreviewWork(work)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    查看
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => shareStudentWork(work)}>
                                    <Share2 className="h-4 w-4 mr-2" />
                                    分享
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    查看实验
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <img 
                                src={work.studentAvatar} 
                                alt={work.studentName}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                              <span className="text-sm font-medium">{work.studentName}</span>
                              <span className="text-xs text-muted-foreground ml-auto">{work.interactionTime}</span>
                            </div>
                            <h4 className="font-medium text-sm truncate">{work.experimentTitle}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{work.description}</p>
                            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" />
                                {work.likeCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {work.favoriteCount}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-medium">还没有互动作品</h3>
                          <p className="text-sm text-muted-foreground mt-1">去给学生的作品点赞或评论吧</p>
                        </div>
                      </div>
                    </Card>
                  )}
                </TabsContent>

                {/* 个人资料 */}
                <TabsContent value="profile" className="mt-0 space-y-6 min-h-[350px]">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">基本信息</CardTitle>
                      <CardDescription>管理您的个人基本信息</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">姓名</Label>
                          <Input id="name" value={teacherInfo.name} disabled={!isEditing} onChange={(e) => setTeacherInfo({...teacherInfo, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="title">职称</Label>
                          <Input id="title" value={teacherInfo.title} disabled={!isEditing} onChange={(e) => setTeacherInfo({...teacherInfo, title: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">邮箱</Label>
                          <Input id="email" type="email" value={teacherInfo.email} disabled={!isEditing} onChange={(e) => setTeacherInfo({...teacherInfo, email: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">手机号</Label>
                          <Input id="phone" value={teacherInfo.phone} disabled={!isEditing} onChange={(e) => setTeacherInfo({...teacherInfo, phone: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="school">学��</Label>
                          <Input id="school" value={teacherInfo.school} disabled={!isEditing} onChange={(e) => setTeacherInfo({...teacherInfo, school: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="department">部门</Label>
                          <Input id="department" value={teacherInfo.department} disabled={!isEditing} onChange={(e) => setTeacherInfo({...teacherInfo, department: e.target.value})} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">个人简介</Label>
                        <Textarea id="bio" value={teacherInfo.bio} disabled={!isEditing} rows={3} onChange={(e) => setTeacherInfo({...teacherInfo, bio: e.target.value})} />
                      </div>
                      {isEditing && (
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsEditing(false)}>取消</Button>
                          <Button onClick={() => setIsEditing(false)}>
                            <Save className="h-4 w-4 mr-2" />
                            保存更改
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* 成就 */}
                <TabsContent value="achievements" className="mt-0 space-y-6 min-h-[350px]">
                  <div className="grid sm:grid-cols-2 gap-4">
                      {achievements?.map((achievement) => (
                      <Card key={achievement.id} className={achievement.unlocked ? "border-primary/50 bg-primary/5" : "opacity-70"}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${achievement.unlocked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                              <achievement.icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{achievement.name}</h4>
                                {achievement.unlocked && <Badge variant="secondary" className="text-[10px]">已解锁</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{achievement.description}</p>
                              <Progress value={achievement.progress} className="h-1.5 mt-2" />
                              <p className="text-[10px] text-muted-foreground mt-1">{Math.round(achievement.progress)}% 完成</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* 设置 */}
                <TabsContent value="settings" className="mt-0 space-y-6 min-h-[350px]">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        通知设置
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">邮件通知</p>
                          <p className="text-xs text-muted-foreground">接收重要更新的邮件通知</p>
                        </div>
                        <Switch checked={settings.emailNotification} onCheckedChange={(checked) => setSettings({...settings, emailNotification: checked})} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">作品通知</p>
                          <p className="text-xs text-muted-foreground">学生提交作品时通知</p>
                        </div>
                        <Switch checked={settings.workNotification} onCheckedChange={(checked) => setSettings({...settings, workNotification: checked})} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">评论通知</p>
                          <p className="text-xs text-muted-foreground">收到新评论时通知</p>
                        </div>
                        <Switch checked={settings.commentNotification} onCheckedChange={(checked) => setSettings({...settings, commentNotification: checked})} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        隐私设置
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">公开个人资料</p>
                          <p className="text-xs text-muted-foreground">允许其他用户查看您的资料</p>
                        </div>
                        <Switch checked={settings.publicProfile} onCheckedChange={(checked) => setSettings({...settings, publicProfile: checked})} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
      
      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteExpId} onOpenChange={(open) => !open && setDeleteExpId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除实验</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销，实验及其所有数据将被永久删除。确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteExperiment}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 预览学生作品对话框 */}
      <Dialog open={!!previewWork} onOpenChange={(open) => !open && setPreviewWork(null)}>
        <DialogContent className="max-w-[95vw] lg:max-w-[1400px] xl:max-w-[1600px] 2xl:max-w-[1800px] w-[95vw] h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>预览作品</DialogTitle>
            <DialogDescription>查看学生作品详情</DialogDescription>
          </DialogHeader>
          {previewWork && (
            <div className="flex flex-col lg:flex-row h-full">
              {/* 视频区域 */}
              <div className="lg:flex-1 bg-black aspect-video lg:aspect-auto lg:h-full flex items-center justify-center relative">
                <MediaPreview
                  kind="video"
                  variant="default"
                  src={previewWork.videoUrl}
                  className="size-full object-contain"
                  alt={previewWork.experimentTitle}
                  videoProps={{
                    poster: previewWork.thumbnail,
                    controls: true,
                    playsInline: true,
                    preload: "metadata",
                  }}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70"
                  onClick={() => setPreviewWork(null)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              {/* 信息区域 */}
              <div className="lg:w-[420px] xl:w-[480px] p-6 lg:p-8 space-y-6 border-t lg:border-t-0 lg:border-l overflow-y-auto">
                <div className="flex items-center gap-3">
                  <img 
                    src={previewWork.studentAvatar} 
                    alt={previewWork.studentName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">{previewWork.studentName}</p>
                    <p className="text-xs text-muted-foreground">{previewWork.createdAt}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-2xl">{previewWork.experimentTitle}</h3>
                  <p className="text-base text-muted-foreground mt-3 leading-relaxed">{previewWork.description}</p>
                </div>
                
                {/* 统计数据 */}
                <div className="grid grid-cols-2 gap-4 py-4 border-y">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-rose-500">
                      <ThumbsUp className="h-5 w-5" />
                      {previewWork.likeCount}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">点赞</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-amber-500">
                      <Heart className="h-5 w-5" />
                      {previewWork.favoriteCount}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">收藏</p>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button size="lg" className="flex-1" variant="outline" onClick={() => shareStudentWork(previewWork)}>
                    <Share2 className="h-5 w-5 mr-2" />
                    分享
                  </Button>
                  <Button size="lg" className="flex-1">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    评论
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* 实验预览对话框 */}
      <Dialog open={!!previewExperiment} onOpenChange={(open) => !open && setPreviewExperiment(null)}>
        <DialogContent className="max-w-[95vw] lg:max-w-[1400px] xl:max-w-[1600px] 2xl:max-w-[1800px] w-[95vw] h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>实验详情</DialogTitle>
            <DialogDescription>查看实验详细信息</DialogDescription>
          </DialogHeader>
          {previewExperiment && (
            <div className="flex flex-col lg:flex-row h-full">
              {/* 左侧预览区 */}
              <div className="lg:flex-1 bg-muted/30 lg:h-full flex flex-col">
                <div className="relative flex-1 flex items-center justify-center p-4 lg:p-8">
                  <img 
                    src={previewExperiment.thumbnail} 
                    alt={previewExperiment.title}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => setPreviewExperiment(null)}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                  <div className="absolute top-4 left-4">
                    <Badge className="text-sm px-3 py-1">
                      {previewExperiment.category === "physics" ? "物理" : previewExperiment.category === "chemistry" ? "化学" : "生物"}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* 右侧信息区 */}
              <div className="lg:w-[420px] xl:w-[480px] p-6 lg:p-8 space-y-6 border-t lg:border-t-0 lg:border-l overflow-y-auto">
                <div>
                  <h2 className="font-bold text-2xl">{previewExperiment.title}</h2>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Badge variant="outline">{previewExperiment.difficulty}</Badge>
                    <Badge variant="secondary">{previewExperiment.duration}</Badge>
                    {/* 发布状态 */}
                    {previewExperiment.status === "draft" && (
                      <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300">
                        草稿
                      </Badge>
                    )}
                    {previewExperiment.status === "pending" && (
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300">
                        待审核
                      </Badge>
                    )}
                    {previewExperiment.status === "published" && (
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300">
                        已发布
                      </Badge>
                    )}
                    {previewExperiment.status === "rejected" && (
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300">
                        已拒绝
                      </Badge>
                    )}
                  </div>
                  {previewExperiment.status === "rejected" && previewExperiment.rejectReason && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                      <p className="text-sm text-red-700 dark:text-red-400">
                        <span className="font-medium">拒绝原因：</span>{previewExperiment.rejectReason}
                      </p>
                    </div>
                  )}
                </div>
                
                <p className="text-base text-muted-foreground leading-relaxed">{previewExperiment.description}</p>
                
                {/* 发布老师信息 */}
                {previewExperiment.teacher && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <img 
                      src={previewExperiment.teacher.avatar} 
                      alt={previewExperiment.teacher.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{previewExperiment.teacher.name}</span>
                        {previewExperiment.teacher.verified && (
                          <Badge variant="secondary" className="text-xs h-5 px-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            已认证
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {previewExperiment.teacher.title && `${previewExperiment.teacher.title}`}
                        {previewExperiment.teacher.title && previewExperiment.teacher.school && " · "}
                        {previewExperiment.teacher.school}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* 统计数据 */}
                <div className="grid grid-cols-3 gap-4 py-4 border-y">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
                      <Eye className="h-5 w-5" />
                      {previewExperiment.viewCount || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">浏览</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-rose-500">
                      <ThumbsUp className="h-5 w-5" />
                      {previewExperiment.likeCount || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">点赞</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-amber-500">
                      <Star className="h-5 w-5" />
                      {previewExperiment.rating || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">评分</p>
                  </div>
                </div>
                
                {/* 实验步骤预览 */}
                {previewExperiment.steps && previewExperiment.steps.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">实验步骤</h3>
                    <div className="space-y-2">
                      {previewExperiment.steps.slice(0, 4).map((step, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </div>
                          <p className="text-sm">{step.title || step.description}</p>
                        </div>
                      ))}
                      {previewExperiment.steps.length > 4 && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          还有 {previewExperiment.steps.length - 4} 个步骤...
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 操作按钮 */}
                <div className="flex gap-3 pt-4">
                  <Button size="lg" className="flex-1" variant="outline" onClick={() => shareExperiment(previewExperiment)}>
                    <Share2 className="h-5 w-5 mr-2" />
                    分享
                  </Button>
                  <Button size="lg" className="flex-1" onClick={() => {
                    const expToEdit = previewExperiment
                    setPreviewExperiment(null)
                    if (expToEdit) {
                      onEditExperiment?.(expToEdit)
                    }
                  }}>
                    <Edit3 className="h-5 w-5 mr-2" />
                    编辑
                  </Button>
                </div>
                <Button 
                  size="lg" 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => {
                    const expId = previewExperiment.id
                    setPreviewExperiment(null)
                    setDeleteExpId(expId)
                  }}
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  删除实验
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
