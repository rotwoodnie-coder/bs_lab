"use client";

import * as React from "react";
import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bs-lab/ui";
import {
  Bell,
  FlaskConical,
  Home,
  LayoutDashboard,
  Library,
  LogOut,
  Sparkles,
  Users,
} from "@bs-lab/ui/icons";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";

const NAV = [
  { id: "home", label: "首页", icon: <Home /> },
  { id: "library", label: "实验库", icon: <Library /> },
  { id: "class", label: "班级", icon: <Users /> },
  { id: "insight", label: "数据", icon: <LayoutDashboard /> },
] as const;

export default function DebugLayoutPage() {
  const [active, setActive] = React.useState<string>("home");

  const logoSlot = (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary md:size-10 md:rounded-xl">
        <FlaskConical className="size-5 text-primary-foreground md:size-6" />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-semibold text-foreground md:text-base">BS Lab</p>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">Layout shell 预览</p>
      </div>
    </div>
  );

  const userSlot = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="rounded-full" aria-label="用户菜单">
          <Avatar className="size-8 border border-border md:size-9">
            <AvatarFallback className="bg-muted text-xs text-muted-foreground"></AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-muted-foreground">账号</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>个人中心（占位）</DropdownMenuItem>
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 size-4" />
          退出（无操作）
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const headerTrailingSlot = (
    <div className="flex items-center gap-1">
      <Button type="button" variant="ghost" size="icon" aria-label="通知（占位）">
        <Bell className="size-5" />
      </Button>
      <Button type="button" variant="ghost" size="icon" aria-label="助手（占位）">
        <Sparkles className="size-5 text-primary" />
      </Button>
    </div>
  );

  const activeLabel = NAV.find((n) => n.id === active)?.label ?? "—";

  return (
    <AppShell
      logoSlot={logoSlot}
      userSlot={userSlot}
      headerTrailingSlot={headerTrailingSlot}
      navItems={[...NAV]}
      activeNavId={active}
      onNavSelect={setActive}
      mobileHeaderTitle="布局壳预览"
    >
      <div className="mx-auto max-w-3xl space-y-4">
        <p className="text-sm text-muted-foreground">
          将视口宽度拖过 <code className="text-foreground">lg (1024px)</code>{" "}
          断点：以下为顶栏 + 抽屉导航；以上为顶栏 + 可折叠侧栏。1920px 以上默认展开
          260px，否则默认 80px 图标轨；手动折叠/展开写入{" "}
          <code className="text-foreground">localStorage</code>，本会话内暂停自动随分辨率切换。
        </p>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <p className="text-lg font-medium text-foreground">当前导航</p>
          <p className="mt-1 text-sm text-muted-foreground">
            已选：<span className="font-medium text-foreground">{activeLabel}</span>（
            <code className="text-foreground">{active}</code>）
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="/debug/ui/all-components">返回组件沙盘</Link>
        </Button>
      </div>
    </AppShell>
  );
}
