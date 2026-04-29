"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage, Button, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from "@bs-lab/ui"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@bs-lab/ui"
import { Users, FileVideo, CheckCheck } from "@bs-lab/ui/icons"
import { Bell, MessageCircle, Heart, Star, Trash2, X } from "@bs-lab/ui/icons"
import type { Message, MessageType } from "@/lib/types"

interface MessagePanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const messageTypeConfig: Record<MessageType, { icon: React.ElementType; color: string; label: string }> = {
  system: { icon: Bell, color: "text-blue-500 bg-blue-50", label: "系统" },
  comment: { icon: MessageCircle, color: "text-green-500 bg-green-50", label: "评论" },
  like: { icon: Heart, color: "text-rose-500 bg-rose-50", label: "点赞" },
  rating: { icon: Star, color: "text-amber-500 bg-amber-50", label: "评分" },
  follow: { icon: Users, color: "text-purple-500 bg-purple-50", label: "关注" },
  work: { icon: FileVideo, color: "text-cyan-500 bg-cyan-50", label: "作品" },
}

export function MessagePanel({ open, onOpenChange }: MessagePanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [activeTab, setActiveTab] = useState("all")

  const unreadCount = messages.filter(m => !m.read).length

  const filteredMessages = activeTab === "all" 
    ? messages 
    : activeTab === "unread" 
      ? messages.filter(m => !m.read)
      : messages.filter(m => m.type === activeTab)

  const markAsRead = (id: string) => {
    setMessages(messages.map(m => m.id === id ? { ...m, read: true } : m))
  }

  const markAllAsRead = () => {
    setMessages(messages.map(m => ({ ...m, read: true })))
  }

  const deleteMessage = (id: string) => {
    setMessages(messages.filter(m => m.id !== id))
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString("zh-CN")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col [&>button]:hidden z-[60]">
        <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              消息中心
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1.5">
                  {unreadCount}
                </Badge>
              )}
            </SheetTitle>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8">
                  <CheckCheck className="h-4 w-4 mr-1" />
                  全部已读
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start px-4 py-2 h-auto flex-wrap gap-1 bg-transparent border-b rounded-none flex-shrink-0">
            <TabsTrigger value="all" className="text-xs h-7 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              全部
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs h-7 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              未读 {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="comment" className="text-xs h-7 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              评论
            </TabsTrigger>
            <TabsTrigger value="like" className="text-xs h-7 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              点赞
            </TabsTrigger>
            <TabsTrigger value="system" className="text-xs h-7 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              系统
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="flex-1 overflow-y-auto m-0 p-0">
            {filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Bell className="h-12 w-12 mb-4 opacity-30" />
                <p>暂无消息</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredMessages.map((message) => {
                  const config = messageTypeConfig[message.type]
                  const Icon = config.icon

                  return (
                    <div
                      key={message.id}
                      className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                        !message.read ? "bg-primary/5" : ""
                      }`}
                      onClick={() => markAsRead(message.id)}
                    >
                      <div className="flex gap-3">
                        {message.fromUser ? (
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={message.fromUser.avatar} alt={message.fromUser.name} />
                            <AvatarFallback>{message.fromUser.name[0]}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {message.fromUser?.name || message.title}
                              </span>
                              {!message.read && (
                                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatTime(message.createdAt)}
                            </span>
                          </div>

                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {message.content}
                          </p>

                          {message.relatedTitle && (
                            <div className="mt-2 flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {config.label}
                              </Badge>
                              <span className="text-xs text-primary truncate">
                                {message.relatedTitle}
                              </span>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteMessage(message.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
