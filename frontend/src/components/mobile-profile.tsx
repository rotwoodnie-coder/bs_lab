"use client"

import { useState } from "react"
import { Settings, Award, LogOut, SwitchCamera, School } from "@bs-lab/ui/icons"
import { Video } from "@bs-lab/ui/icons"
import { User, ChevronRight, BookOpen, Heart, Bookmark, Clock, FlaskConical, GraduationCap, Bell } from "@bs-lab/ui/icons"
import { Avatar, AvatarFallback, AvatarImage, Button, Card, Badge } from "@bs-lab/ui"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@bs-lab/ui"
import { useUser } from "@/lib/user-context"

interface MobileProfileProps {
  onOpenFullProfile: () => void
  onOpenMessages?: () => void
}

export function MobileProfile({ onOpenFullProfile, onOpenMessages }: MobileProfileProps) {
  const { user, isTeacher, isStudent, setRole } = useUser()
  const [showSwitchDialog, setShowSwitchDialog] = useState(false)

  // 模拟统计数据
  const studentStats = {
    experiments: 12,
    works: 5,
    favorites: 8,
    studyTime: "26小时",
  }

  const teacherStats = {
    experiments: 24,
    studentWorks: 156,
    totalViews: 12800,
    totalLikes: 3200,
  }

  const handleSwitchRole = (role: "teacher" | "student") => {
    setRole(role)
    setShowSwitchDialog(false)
  }

  return (
    <div className="space-y-4 pb-4">
      {/* 用户信息卡片 */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {user.name.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{user.name}</h2>
              <Badge variant={isTeacher ? "default" : "secondary"} className="text-xs">
                {isTeacher ? "教师" : "学生"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{user.school}</p>
            {isStudent && user.grade && (
              <p className="text-xs text-muted-foreground">{user.grade}</p>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowSwitchDialog(true)}
          >
            <SwitchCamera className="h-5 w-5" />
          </Button>
        </div>
      </Card>

      {/* 统计数据 */}
      <Card className="p-4">
        {isStudent ? (
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-xl font-bold text-primary">{studentStats.experiments}</div>
              <p className="text-xs text-muted-foreground">完成实验</p>
            </div>
            <div>
              <div className="text-xl font-bold text-blue-500">{studentStats.works}</div>
              <p className="text-xs text-muted-foreground">我的作品</p>
            </div>
            <div>
              <div className="text-xl font-bold text-amber-500">{studentStats.favorites}</div>
              <p className="text-xs text-muted-foreground">收藏</p>
            </div>
            <div>
              <div className="text-xl font-bold text-green-500">{studentStats.studyTime}</div>
              <p className="text-xs text-muted-foreground">学习时长</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-xl font-bold text-primary">{teacherStats.experiments}</div>
              <p className="text-xs text-muted-foreground">创建实验</p>
            </div>
            <div>
              <div className="text-xl font-bold text-blue-500">{teacherStats.studentWorks}</div>
              <p className="text-xs text-muted-foreground">学生作品</p>
            </div>
            <div>
              <div className="text-xl font-bold text-amber-500">{teacherStats.totalViews}</div>
              <p className="text-xs text-muted-foreground">总浏览</p>
            </div>
            <div>
              <div className="text-xl font-bold text-rose-500">{teacherStats.totalLikes}</div>
              <p className="text-xs text-muted-foreground">总点赞</p>
            </div>
          </div>
        )}
      </Card>

      {/* 消息入口 */}
      <Card className="divide-y">
        <MenuItem 
          icon={Bell} 
          label="消息通知" 
          badge="3条未读" 
          onClick={onOpenMessages} 
        />
      </Card>

      {/* 功能菜单 */}
      <Card className="divide-y">
        {isStudent ? (
          <>
            <MenuItem icon={FlaskConical} label="我的实验" badge="12" onClick={onOpenFullProfile} />
            <MenuItem icon={Video} label="我的作品" badge="5" onClick={onOpenFullProfile} />
            <MenuItem icon={Bookmark} label="我的收藏" badge="8" onClick={onOpenFullProfile} />
            <MenuItem icon={Heart} label="点赞记录" onClick={onOpenFullProfile} />
            <MenuItem icon={Award} label="我的成就" badge="3个徽章" onClick={onOpenFullProfile} />
            <MenuItem icon={Clock} label="学习记录" onClick={onOpenFullProfile} />
          </>
        ) : (
          <>
            <MenuItem icon={FlaskConical} label="我的实验" badge="24" onClick={onOpenFullProfile} />
            <MenuItem icon={Video} label="学生作品管理" badge="156" onClick={onOpenFullProfile} />
            <MenuItem icon={BookOpen} label="班级管理" onClick={onOpenFullProfile} />
            <MenuItem icon={Award} label="荣誉成就" onClick={onOpenFullProfile} />
          </>
        )}
      </Card>

      {/* 设置 */}
      <Card className="divide-y">
        <MenuItem icon={User} label="个人资料" onClick={onOpenFullProfile} />
        <MenuItem icon={Settings} label="设置" onClick={onOpenFullProfile} />
      </Card>

      {/* 切换身份按钮 */}
      <Button 
        variant="outline" 
        className="w-full h-11"
        onClick={() => setShowSwitchDialog(true)}
      >
        <SwitchCamera className="h-4 w-4 mr-2" />
        切换身份 (当前: {isTeacher ? "教师" : "学生"})
      </Button>

      {/* 身份切换对话框 */}
      <Dialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
        <DialogContent className="w-[90vw] max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>切换身份</DialogTitle>
            <DialogDescription>选择您要切换的身份</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 mt-4">
            <button
              onClick={() => handleSwitchRole("student")}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                isStudent 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className={`p-3 rounded-full ${isStudent ? "bg-primary/10" : "bg-muted"}`}>
                <GraduationCap className={`h-6 w-6 ${isStudent ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">学生身份</span>
                  {isStudent && <Badge variant="default" className="text-xs">当前</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">李小明 · 初二</p>
              </div>
            </button>
            
            <button
              onClick={() => handleSwitchRole("teacher")}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                isTeacher 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className={`p-3 rounded-full ${isTeacher ? "bg-primary/10" : "bg-muted"}`}>
                <School className={`h-6 w-6 ${isTeacher ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">教师身份</span>
                  {isTeacher && <Badge variant="default" className="text-xs">当前</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">王老师 · 北京市第一中学</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 菜单项组件
function MenuItem({ 
  icon: Icon, 
  label, 
  badge,
  onClick 
}: { 
  icon: React.ElementType
  label: string
  badge?: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3.5 w-full text-left hover:bg-muted/50 transition-colors"
    >
      <Icon className="h-5 w-5 text-muted-foreground" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {badge && (
        <span className="text-xs text-muted-foreground">{badge}</span>
      )}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  )
}
