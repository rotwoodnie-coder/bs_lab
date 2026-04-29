"use client"

import { useUser } from "@/lib/user-context"
import { Button } from "@bs-lab/ui"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@bs-lab/ui"
import { Avatar, AvatarFallback, AvatarImage } from "@bs-lab/ui"
import { ChevronDown, GraduationCap, UserCircle } from "@bs-lab/ui/icons"

export function RoleSwitcher() {
  const { user, setRole, isTeacher } = useUser()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-sm">
            <span className="font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">
              {isTeacher ? "老师" : "学生"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => setRole("teacher")}
          className="flex items-center gap-2"
        >
          <GraduationCap className="h-4 w-4" />
          <span>切换为老师</span>
          {isTeacher && <span className="ml-auto text-primary">当前</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setRole("student")}
          className="flex items-center gap-2"
        >
          <UserCircle className="h-4 w-4" />
          <span>切换为学生</span>
          {!isTeacher && <span className="ml-auto text-primary">当前</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
