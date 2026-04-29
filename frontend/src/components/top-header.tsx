"use client"

import { Search, Bot, Bell } from "@bs-lab/ui/icons"
import { Avatar, AvatarFallback, AvatarImage, Button } from "@bs-lab/ui"

interface TopHeaderProps {
  onAIClick: () => void
}

export function TopHeader({ onAIClick }: TopHeaderProps) {
  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索实验..."
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          onClick={onAIClick}
          variant="outline"
          className="flex items-center gap-2 bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/30 text-primary"
        >
          <Bot className="h-4 w-4" />
          <span>AI 助手</span>
        </Button>

        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">王老师</p>
            <p className="text-xs text-muted-foreground">科学教师</p>
          </div>
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" />
            <AvatarFallback className="bg-primary text-primary-foreground">王</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
