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
import { School, Award, TrendingUp, ThumbsUp, Settings, Edit3, Camera, Save, BarChart3, Trophy, Target, Flame, Zap, Image, Plus, ExternalLink } from "@bs-lab/ui/icons"
import { Shield, Video } from "@bs-lab/ui/icons"
import { User, GraduationCap, FlaskConical, Eye, Star, Heart, Bell, ChevronRight, Clock, BookOpen, CheckCircle2, Trash2, Lock, Unlock, Share2, MoreHorizontal, Play, X, Upload } from "@bs-lab/ui/icons"
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
import type { ShareInfo } from "@/lib/types"
import type { StudentWork } from "@/lib/types"

interface StudentProfileProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentWorks: StudentWork[]
  onShare?: (info: ShareInfo) => void
}

// 扩展StudentWork类型以支持隐私设置
interface ManagedWork extends StudentWork {
  isPrivate?: boolean
}

export function StudentProfile({ open, onOpenChange, studentWorks, onShare }: StudentProfileProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditing, setIsEditing] = useState(false)
  
  // 作品管理状态
  const [works, setWorks] = useState<ManagedWork[]>(
    studentWorks?.map(w => ({ ...w, isPrivate: false }))
  )
  const [selectedWork, setSelectedWork] = useState<ManagedWork | null>(null)
  const [deleteWorkId, setDeleteWorkId] = useState<string | null>(null)
  const [editingWork, setEditingWork] = useState<ManagedWork | null>(null)
  const [previewWork, setPreviewWork] = useState<ManagedWork | null>(null)
  
  // 模拟学生数据
  const [studentInfo, setStudentInfo] = useState({
    name: "小明",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face",
    school: "北京市第一中学",
    grade: "初二3班",
    studentId: "2024001",
    bio: "热爱科学实验，喜欢探索未知世界。最喜欢物理和化学实验！",
    joinDate: "2024-02-15",
  })

  // 学习统计
  const learningStats = {
    totalWorks: studentWorks.length,
    totalLikes: studentWorks.reduce((acc, work) => acc + (work.likeCount || 0), 0),
    totalFavorites: studentWorks.reduce((acc, work) => acc + (work.favoriteCount || 0), 0),
    totalComments: studentWorks.reduce((acc, work) => acc + (work.commentCount || 0), 0),
    experimentsCompleted: 15,
    learningDays: 45,
    currentStreak: 7,
    longestStreak: 12,
  }

  // 学习进度
  const learningProgress = {
    physics: { completed: 8, total: 15, percentage: 53 },
    chemistry: { completed: 5, total: 12, percentage: 42 },
    biology: { completed: 2, total: 10, percentage: 20 },
  }

  // 作品管理函数
  const toggleWorkPrivacy = (workId: string) => {
    setWorks(works.map(w => 
      w.id === workId ? { ...w, isPrivate: !w.isPrivate } : w
    ))
  }
  
  const deleteWork = (workId: string) => {
    setWorks(works.filter(w => w.id !== workId))
    setDeleteWorkId(null)
  }
  
  const updateWork = (workId: string, updates: Partial<ManagedWork>) => {
    setWorks(works.map(w => 
      w.id === workId ? { ...w, ...updates } : w
    ))
    setEditingWork(null)
  }
  
  const shareWork = (work: ManagedWork) => {
    if (onShare) {
      onShare({
        url: `https://experiment.example.com/works/${work.id}`,
        title: work.experimentTitle,
        description: work.description,
        thumbnail: work.thumbnail
      })
    }
  }

  // 设置状态
  const [settings, setSettings] = useState({
    emailNotification: true,
    likeNotification: true,
    commentNotification: true,
    publicProfile: true,
    showProgress: true,
  })

  // 成就系统
  const achievements = [
    { id: 1, name: "初出茅庐", description: "完成第一个实验", icon: FlaskConical, unlocked: true, date: "2024-02-20" },
    { id: 2, name: "勤学好问", description: "连续学习7天", icon: Flame, unlocked: learningStats.currentStreak >= 7, progress: Math.min(learningStats.currentStreak / 7 * 100, 100) },
    { id: 3, name: "小有名气", description: "作品获得50个赞", icon: ThumbsUp, unlocked: learningStats.totalLikes >= 50, progress: Math.min(learningStats.totalLikes / 50 * 100, 100) },
    { id: 4, name: "实验达人", description: "完成10个实验", icon: Trophy, unlocked: learningStats.experimentsCompleted >= 10, progress: Math.min(learningStats.experimentsCompleted / 10 * 100, 100) },
    { id: 5, name: "全能学霸", description: "三科都完成5个实验", icon: Star, unlocked: false, progress: 35 },
    { id: 6, name: "持之以恒", description: "连续学习30天", icon: Target, unlocked: false, progress: Math.min(learningStats.longestStreak / 30 * 100, 100) },
  ]

  // 学习日历数据（最近30天）
  const learningCalendar = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
    hasLearned: Math.random() > 0.3,
  }))

  // 最近活动
  const recentActivities = [
    { type: "work", content: "提交了「水的沸腾实验」作品", time: "1小时前" },
    { type: "complete", content: "完成了「光的折射」实验学习", time: "3小时前" },
    { type: "like", content: "作品获得了8个新点赞", time: "昨天" },
    { type: "achievement", content: "解锁成就「勤学好问」", time: "2天前" },
  ]

  const level = Math.floor(learningStats.experimentsCompleted / 3) + 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] lg:max-w-[1400px] xl:max-w-[1700px] 2xl:max-w-[1900px] w-[98vw] h-[94vh] max-h-[94vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>学生个人中心</DialogTitle>
          <DialogDescription>查看学习进度和个人信息</DialogDescription>
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
            <div className="p-6 border-b bg-gradient-to-b from-blue-500/10 to-transparent">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                    <AvatarImage src={studentInfo.avatar} alt={studentInfo.name} />
                    <AvatarFallback className="text-2xl">{studentInfo.name[0]}</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button size="icon" variant="secondary" className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full">
                      <Camera className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
                    Lv.{level}
                  </div>
                </div>
                <h2 className="text-lg font-bold mt-3">{studentInfo.name}</h2>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    <GraduationCap className="h-3 w-3 mr-0.5" />
                    {studentInfo.grade}
                  </Badge>
                  {learningStats.currentStreak >= 7 && (
                    <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300">
                      <Flame className="h-3 w-3 mr-0.5" />
                      {learningStats.currentStreak}天
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{studentInfo.school}</p>
              </div>
              
              {/* 统计 */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-background/60 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-primary">{learningStats.experimentsCompleted}</p>
                  <p className="text-[10px] text-muted-foreground">完成</p>
                </div>
                <div className="bg-background/60 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-blue-500">{learningStats.totalWorks}</p>
                  <p className="text-[10px] text-muted-foreground">作品</p>
                </div>
                <div className="bg-background/60 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-rose-500">{learningStats.totalLikes}</p>
                  <p className="text-[10px] text-muted-foreground">点赞</p>
                </div>
                <div className="bg-background/60 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-amber-500">{learningStats.learningDays}</p>
                  <p className="text-[10px] text-muted-foreground">天数</p>
                </div>
              </div>
            </div>
            
            {/* 导航菜单 */}
            <nav className="flex-1 p-3 space-y-1">
              {[
                { value: "overview", icon: BarChart3, label: "学习概览" },
                { value: "works", icon: Image, label: "我的作品", badge: works.length },
                { value: "progress", icon: TrendingUp, label: "学习进度" },
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
          <div className="lg:hidden bg-gradient-to-r from-blue-500/20 via-purple-500/10 to-transparent p-4 border-b flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-14 w-14 border-2 border-background shadow">
                  <AvatarImage src={studentInfo.avatar} alt={studentInfo.name} />
                  <AvatarFallback>{studentInfo.name[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full">
                  Lv.{level}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold truncate">{studentInfo.name}</h2>
                  <Badge variant="secondary" className="text-xs">{studentInfo.grade}</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{studentInfo.school}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{learningStats.experimentsCompleted}</p>
                <p className="text-[10px] text-muted-foreground">完成</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-500">{learningStats.totalWorks}</p>
                <p className="text-[10px] text-muted-foreground">作品</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-rose-500">{learningStats.totalLikes}</p>
                <p className="text-[10px] text-muted-foreground">点赞</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-500">{learningStats.learningDays}</p>
                <p className="text-[10px] text-muted-foreground">天数</p>
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
                  { value: "works", icon: Image, label: "作品" },
                  { value: "progress", icon: TrendingUp, label: "进度" },
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
                  {activeTab === "overview" && "学习概览"}
                  {activeTab === "works" && "我的作品"}
                  {activeTab === "progress" && "学习进度"}
                  {activeTab === "achievements" && "我的成就"}
                  {activeTab === "settings" && "账号设置"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "overview" && "查看你的学习记录和最近活动"}
                  {activeTab === "works" && `共 ${works.length} 个作品，管理和分享你的实验成果`}
                  {activeTab === "progress" && "各学科学习进度一览"}
                  {activeTab === "achievements" && "查看已解锁的成就和进度"}
                  {activeTab === "settings" && "管理通知和隐私设置"}
                </p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 lg:p-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                <TabsList className="hidden">
                  <TabsTrigger value="overview">概览</TabsTrigger>
                  <TabsTrigger value="works">作品</TabsTrigger>
                  <TabsTrigger value="progress">进度</TabsTrigger>
                  <TabsTrigger value="achievements">成就</TabsTrigger>
                  <TabsTrigger value="settings">设置</TabsTrigger>
                </TabsList>
                
                {/* 概览 */}
                <TabsContent value="overview" className="mt-0 space-y-6 min-h-[350px]">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* 学习日历 */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          学习日历
                        </CardTitle>
                        <CardDescription>最近30天的学习记录</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-10 gap-1">
                          {learningCalendar.map((day, index) => (
                            <div
                              key={index}
                              className={`aspect-square rounded-sm ${
                                day.hasLearned 
                                  ? "bg-primary" 
                                  : "bg-muted"
                              }`}
                              title={day.date.toLocaleDateString()}
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                          <span>少</span>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-sm bg-muted" />
                            <div className="w-3 h-3 rounded-sm bg-primary/40" />
                            <div className="w-3 h-3 rounded-sm bg-primary/70" />
                            <div className="w-3 h-3 rounded-sm bg-primary" />
                          </div>
                          <span>多</span>
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
                              <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${
                                activity.type === "achievement" ? "bg-amber-500" :
                                activity.type === "like" ? "bg-rose-500" :
                                activity.type === "complete" ? "bg-green-500" : "bg-primary"
                              }`} />
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

                  {/* 我的作品 */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Video className="h-4 w-4 text-primary" />
                          我的作品
                        </CardTitle>
                        <Button variant="ghost" size="sm" className="text-xs">
                          查看全部
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {studentWorks.length > 0 ? (
                        <div className="space-y-3">
                          {studentWorks.slice(0, 3).map((work) => (
                            <div key={work.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="h-12 w-16 rounded bg-muted overflow-hidden flex-shrink-0">
                                <img src={work.thumbnail} alt={work.experimentTitle} className="h-full w-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{work.experimentTitle}</p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{work.likeCount}</span>
                                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{work.favoriteCount}</span>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">还没有提交作品</p>
                          <p className="text-xs mt-1">完成实验后上传你的作品吧！</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* 我的作品管理 */}
                <TabsContent value="works" className="mt-0 space-y-4 min-h-[350px]">
                  {/* 作品网格 */}
                  {works.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {works.map((work) => (
                        <Card key={work.id} className={`overflow-hidden group ${work.isPrivate ? "opacity-75" : ""}`}>
                          <div className="relative aspect-video bg-muted">
                            <img 
                              src={work.thumbnail} 
                              alt={work.experimentTitle}
                              className="w-full h-full object-cover"
                            />
                            {/* 播放按钮覆盖层 */}
                            <div 
                              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              onClick={() => setPreviewWork(work)}
                            >
                              <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                                <Play className="h-6 w-6 text-primary fill-primary" />
                              </div>
                            </div>
                            {/* 隐私标识 */}
                            {work.isPrivate && (
                              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                私密
                              </div>
                            )}
                            {/* 操作菜单 */}
                            <div className="absolute top-2 right-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="secondary" size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setPreviewWork(work)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    查看
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setEditingWork(work)}>
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    编辑
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => shareWork(work)}>
                                    <Share2 className="h-4 w-4 mr-2" />
                                    分享
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => toggleWorkPrivacy(work.id)}>
                                    {work.isPrivate ? (
                                      <>
                                        <Unlock className="h-4 w-4 mr-2" />
                                        设为公开
                                      </>
                                    ) : (
                                      <>
                                        <Lock className="h-4 w-4 mr-2" />
                                        设为私密
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteWorkId(work.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    删除
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <CardContent className="p-3">
                            <h4 className="font-medium text-sm truncate">{work.experimentTitle}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{work.description}</p>
                            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                              <span>{new Date(work.createdAt).toLocaleDateString()}</span>
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <ThumbsUp className="h-3 w-3" />
                                  {work.likeCount}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {work.favoriteCount}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                          <Image className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-medium">还没有作品</h3>
                          <p className="text-sm text-muted-foreground mt-1">完成实验后上传你的作品吧</p>
                        </div>
                        <Button>
                          <Upload className="h-4 w-4 mr-2" />
                          上传第一个作品
                        </Button>
                      </div>
                    </Card>
                  )}
                </TabsContent>

                {/* 学习进度 */}
                <TabsContent value="progress" className="mt-0 space-y-6 min-h-[350px]">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">学科进度</CardTitle>
                      <CardDescription>各学科实验完成情况</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* 物理 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="font-medium">物理</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{learningProgress.physics.completed}/{learningProgress.physics.total}</span>
                        </div>
                        <Progress value={learningProgress.physics.percentage} className="h-2" />
                      </div>

                      {/* 化学 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                              <FlaskConical className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="font-medium">化学</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{learningProgress.chemistry.completed}/{learningProgress.chemistry.total}</span>
                        </div>
                        <Progress value={learningProgress.chemistry.percentage} className="h-2" />
                      </div>

                      {/* 生物 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                              <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="font-medium">生物</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{learningProgress.biology.completed}/{learningProgress.biology.total}</span>
                        </div>
                        <Progress value={learningProgress.biology.percentage} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* 学习统计 */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                            <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{learningStats.currentStreak} 天</p>
                            <p className="text-xs text-muted-foreground">当前连续学习</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                            <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{learningStats.longestStreak} 天</p>
                            <p className="text-xs text-muted-foreground">最长连续记录</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* 成就 */}
                <TabsContent value="achievements" className="mt-0 space-y-6 min-h-[350px]">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      <span className="font-medium">已解锁 {achievements.filter(a => a.unlocked).length}/{achievements.length}</span>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {achievements.map((achievement) => (
                      <Card key={achievement.id} className={achievement.unlocked ? "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20" : "opacity-70"}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${achievement.unlocked ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" : "bg-muted text-muted-foreground"}`}>
                              <achievement.icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{achievement.name}</h4>
                                {achievement.unlocked && (
                                  <CheckCircle2 className="h-4 w-4 text-amber-500" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{achievement.description}</p>
                              {!achievement.unlocked && achievement.progress !== undefined && (
                                <>
                                  <Progress value={achievement.progress} className="h-1.5 mt-2" />
                                  <p className="text-[10px] text-muted-foreground mt-1">{Math.round(achievement.progress)}% 完成</p>
                                </>
                              )}
                              {achievement.unlocked && achievement.date && (
                                <p className="text-[10px] text-muted-foreground mt-1">解锁于 {achievement.date}</p>
                              )}
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
                      <CardTitle className="text-base">个人资料</CardTitle>
                      <CardDescription>管理您的基本信息</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">姓名</Label>
                          <Input id="name" value={studentInfo.name} disabled={!isEditing} onChange={(e) => setStudentInfo({...studentInfo, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="grade">班级</Label>
                          <Input id="grade" value={studentInfo.grade} disabled={!isEditing} onChange={(e) => setStudentInfo({...studentInfo, grade: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="school">学校</Label>
                          <Input id="school" value={studentInfo.school} disabled={!isEditing} onChange={(e) => setStudentInfo({...studentInfo, school: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="studentId">学号</Label>
                          <Input id="studentId" value={studentInfo.studentId} disabled onChange={(e) => setStudentInfo({...studentInfo, studentId: e.target.value})} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">个人简介</Label>
                        <Textarea id="bio" value={studentInfo.bio} disabled={!isEditing} rows={3} onChange={(e) => setStudentInfo({...studentInfo, bio: e.target.value})} />
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
                          <p className="font-medium text-sm">点赞通知</p>
                          <p className="text-xs text-muted-foreground">作品被点赞时通知</p>
                        </div>
                        <Switch checked={settings.likeNotification} onCheckedChange={(checked) => setSettings({...settings, likeNotification: checked})} />
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
                          <p className="text-xs text-muted-foreground">允许其他同学查看您的资料</p>
                        </div>
                        <Switch checked={settings.publicProfile} onCheckedChange={(checked) => setSettings({...settings, publicProfile: checked})} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">显示学习进度</p>
                          <p className="text-xs text-muted-foreground">在排行榜显示您的学习进度</p>
                        </div>
                        <Switch checked={settings.showProgress} onCheckedChange={(checked) => setSettings({...settings, showProgress: checked})} />
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
      <AlertDialog open={!!deleteWorkId} onOpenChange={(open) => !open && setDeleteWorkId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除作品</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销，作品将被永久删除。确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteWorkId && deleteWork(deleteWorkId)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 编辑作品对话框 */}
      <Dialog open={!!editingWork} onOpenChange={(open) => !open && setEditingWork(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑作品</DialogTitle>
            <DialogDescription>修改作品描述和隐私设置</DialogDescription>
          </DialogHeader>
          {editingWork && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src={editingWork.thumbnail} alt="" className="w-20 h-14 object-cover rounded" />
                <div>
                  <p className="font-medium">{editingWork.experimentTitle}</p>
                  <p className="text-xs text-muted-foreground">{new Date(editingWork.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="work-description">作品描述</Label>
                <Textarea 
                  id="work-description"
                  value={editingWork.description} 
                  onChange={(e) => setEditingWork({ ...editingWork, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  {editingWork.isPrivate ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  <div>
                    <p className="text-sm font-medium">{editingWork.isPrivate ? "私密作品" : "公开作品"}</p>
                    <p className="text-xs text-muted-foreground">
                      {editingWork.isPrivate ? "仅自己可见" : "所有人可见"}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={!editingWork.isPrivate}
                  onCheckedChange={(checked) => setEditingWork({ ...editingWork, isPrivate: !checked })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingWork(null)}>取消</Button>
                <Button onClick={() => updateWork(editingWork.id, { 
                  description: editingWork.description, 
                  isPrivate: editingWork.isPrivate 
                })}>
                  <Save className="h-4 w-4 mr-2" />
                  保存
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* 预览作品对话框 */}
      <Dialog open={!!previewWork} onOpenChange={(open) => !open && setPreviewWork(null)}>
        <DialogContent className="max-w-[95vw] lg:max-w-[1400px] xl:max-w-[1600px] 2xl:max-w-[1800px] w-[95vw] h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>预览作品</DialogTitle>
            <DialogDescription>查看作品详情</DialogDescription>
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
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  创建于 {new Date(previewWork.createdAt).toLocaleDateString()}
                </div>
                <div className="flex gap-3 pt-4">
                  <Button size="lg" className="flex-1" variant="outline" onClick={() => shareWork(previewWork)}>
                    <Share2 className="h-5 w-5 mr-2" />
                    分享作品
                  </Button>
                  <Button size="lg" className="flex-1" onClick={() => {
                    const workToEdit = previewWork
                    setPreviewWork(null)
                    if (workToEdit) {
                      setEditingWork(workToEdit)
                    }
                  }}>
                    <Edit3 className="h-5 w-5 mr-2" />
                    编辑作品
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
