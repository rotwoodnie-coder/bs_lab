"use client"

import { ChevronLeft, Bell, Search, MoreHorizontal } from "@bs-lab/ui/icons"
import { Button, Input, Avatar, AvatarFallback, AvatarImage } from "@bs-lab/ui"
import { useUser } from "@/lib/user-context"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface MobileHeaderProps {
  title?: string
  showBack?: boolean
  showSearch?: boolean
  showAvatar?: boolean
  onBack?: () => void
  onAvatarClick?: () => void
  onBellClick?: () => void
  searchValue?: string
  onSearchChange?: (value: string) => void
  transparent?: boolean
  className?: string
}

export function MobileHeader({
  title,
  showBack = false,
  showSearch = false,
  showAvatar = true,
  onBack,
  onAvatarClick,
  onBellClick,
  searchValue = "",
  onSearchChange,
  transparent = false,
  className,
}: MobileHeaderProps) {
  const { isTeacher } = useUser()
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex items-center h-11 px-3 gap-2",
        transparent ? "bg-transparent" : "bg-background border-b",
        className
      )}
    >
      {/* 左侧 */}
      <div className="flex items-center gap-1 shrink-0">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -ml-1"
            onClick={onBack}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        {showAvatar && !showBack && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -ml-1"
            onClick={onAvatarClick}
          >
            <Avatar className="h-7 w-7 border border-border">
              <AvatarImage
                src={isTeacher
                  ? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
                  : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face"
                }
                alt={isTeacher ? "\u5F20\u8001\u5E08" : "\u5C0F\u660E"}
              />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {isTeacher ? "\u5F20" : "\u660E"}
              </AvatarFallback>
            </Avatar>
          </Button>
        )}
      </div>

      {/* 中间 - 标题或搜索框 */}
      <div className="flex-1 min-w-0">
        {showSearch ? (
          <div className={cn(
            "relative transition-all",
            isSearchFocused && "scale-[1.02]"
          )}>
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={"\u641C\u7D22\u5B9E\u9A8C..."}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="h-8 pl-8 pr-3 bg-muted/50 border-0 rounded-full text-sm"
            />
          </div>
        ) : (
          <h1 className="text-base font-semibold text-center truncate">{title}</h1>
        )}
      </div>

      {/* 右侧 */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 relative" onClick={onBellClick}>
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </Button>
      </div>
    </header>
  )
}
