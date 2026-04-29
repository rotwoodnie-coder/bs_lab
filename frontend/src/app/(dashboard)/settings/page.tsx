"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  sonnerToast,
  Switch,
} from "@bs-lab/ui";

import type { AppThemeMode } from "@/lib/app-theme";
import { getStoredTheme, setStoredTheme } from "@/lib/app-theme";

export default function SettingsPage() {
  const [themeMode, setThemeMode] = React.useState<AppThemeMode>("system");
  const [notifyEmail, setNotifyEmail] = React.useState(true);
  const [notifySystem, setNotifySystem] = React.useState(true);
  const [notifyBooking, setNotifyBooking] = React.useState(false);
  const [resetOpen, setResetOpen] = React.useState(false);

  React.useEffect(() => {
    setThemeMode(getStoredTheme());
  }, []);

  const handleThemeChange = (value: string) => {
    const next = value as AppThemeMode;
    setThemeMode(next);
    setStoredTheme(next);
    sonnerToast.message("界面主题已更新", {
      description: next === "system" ? "已跟随系统外观" : next === "dark" ? "已切换为暗色" : "已切换为亮色",
    });
  };

  const pushNotifyToast = () => {
    sonnerToast.success("设置已更新");
  };

  const handleResetConfirm = () => {
    setResetOpen(false);
    setThemeMode("system");
    setStoredTheme("system");
    setNotifyEmail(true);
    setNotifySystem(true);
    setNotifyBooking(false);
    window.setTimeout(() => {
      sonnerToast.message("已恢复默认设置（模拟）");
    }, 400);
  };

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">系统设置</h1>
        <p className="text-sm text-muted-foreground">界面偏好与通知开关均为本地状态，无后端。</p>
      </header>

      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle>界面偏好</CardTitle>
          <CardDescription>与全站 `html.dark` 类联动，与 `globals.css` 主题变量一致。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="theme-select">主题</Label>
          <Select value={themeMode} onValueChange={handleThemeChange}>
            <SelectTrigger id="theme-select" className="w-full max-w-xs">
              <SelectValue placeholder="选择主题" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">亮色</SelectItem>
              <SelectItem value="dark">暗色</SelectItem>
              <SelectItem value="system">跟随系统</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            切换后立即生效；「跟随系统」会监听系统深色偏好变化。
          </p>
        </CardContent>
      </Card>

      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle>通知</CardTitle>
          <CardDescription>开关状态仅保存在本页内存中（原型）。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="sw-email" className="text-base">
                邮件通知
              </Label>
              <p className="text-xs text-muted-foreground">重要公告与周报摘要</p>
            </div>
            <Switch
              id="sw-email"
              checked={notifyEmail}
              onCheckedChange={(v) => {
                setNotifyEmail(v);
                pushNotifyToast();
              }}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="sw-system" className="text-base">
                系统消息
              </Label>
              <p className="text-xs text-muted-foreground">站内信与流程提醒</p>
            </div>
            <Switch
              id="sw-system"
              checked={notifySystem}
              onCheckedChange={(v) => {
                setNotifySystem(v);
                pushNotifyToast();
              }}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="sw-booking" className="text-base">
                实验预约提醒
              </Label>
              <p className="text-xs text-muted-foreground">开课与设备时段前推送</p>
            </div>
            <Switch
              id="sw-booking"
              checked={notifyBooking}
              onCheckedChange={(v) => {
                setNotifyBooking(v);
                pushNotifyToast();
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={() => setResetOpen(true)}>
          恢复默认设置
        </Button>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>恢复默认设置？</AlertDialogTitle>
            <AlertDialogDescription>
              将主题设为「跟随系统」、通知开关恢复为默认，并立即应用到界面（模拟）。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">取消</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={handleResetConfirm}>
              确定恢复
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
