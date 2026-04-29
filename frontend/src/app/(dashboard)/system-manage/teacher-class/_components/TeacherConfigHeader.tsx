"use client";

import { Avatar, AvatarFallback } from "@bs-lab/ui";

import type { V2SysUserItem } from "@/lib/v2/v2-sys-api";

function initials(name: string) {
  return (name ?? "?").slice(0, 2);
}

export function TeacherConfigHeader({ teacher }: { teacher: V2SysUserItem }) {
  return (
    <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-4 sm:px-5">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12 shrink-0 ring-2 ring-border/60">
          <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">
            {initials(teacher.userName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold tracking-tight text-foreground">{teacher.userName}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            工号 / 登录名：<span className="font-medium text-foreground">{teacher.loginName}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">正在为该教师配置授课班级与学科</p>
        </div>
      </div>
    </div>
  );
}
