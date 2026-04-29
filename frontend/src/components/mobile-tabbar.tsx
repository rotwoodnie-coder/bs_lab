"use client"

import { Home, FlaskConical, Upload, Sparkles, User } from "@bs-lab/ui/icons"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/user-context"

interface MobileTabBarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onAIClick?: () => void
}

export function MobileTabBar({ 
  activeTab, 
  onTabChange,
  onAIClick,
}: MobileTabBarProps) {
  const { isTeacher } = useUser()
  
  const tabs = [
    { id: "home", icon: Home, label: "首页" },
    { id: "experiments", icon: FlaskConical, label: "实验" },
    { id: "ai", icon: Sparkles, label: "AI助手", isSpecial: true },
    { id: "works", icon: Upload, label: "作品" },
    { id: "profile", icon: User, label: "我的" },
  ]

  const handleTabClick = (tabId: string) => {
    if (tabId === "ai") {
      onAIClick?.()
    } else {
      onTabChange(tabId)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-safe-bottom">
      <div className="flex h-14 min-h-11 items-end justify-around px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          
          if (tab.isSpecial) {
            // AI助手特殊样式 - 凸起的圆形按钮
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className="flex min-h-11 min-w-11 flex-col items-center justify-center -mt-4 touch-manipulation"
              >
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-[10px] text-primary mt-1 font-medium">{tab.label}</span>
              </button>
            )
          }
          
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "flex min-h-11 min-w-[60px] flex-col items-center justify-center px-3 py-2 touch-manipulation transition-colors",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-transform",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-[10px] mt-1",
                isActive ? "font-medium" : "font-normal"
              )}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-4 h-0.5 bg-primary rounded-full mt-0.5" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
