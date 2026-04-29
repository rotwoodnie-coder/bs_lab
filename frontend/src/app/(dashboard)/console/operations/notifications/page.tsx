"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  sonnerToast,
  Switch,
  Textarea,
} from "@bs-lab/ui";

import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

export default function ConsolePlatformNotificationsPage() {
  const [smtpHost, setSmtpHost] = React.useState("smtp.edu.sh.cn");
  const [smtpPort, setSmtpPort] = React.useState("587");
  const [smsUrl, setSmsUrl] = React.useState("https://sms-gateway.example/send");
  const [announcement, setAnnouncement] = React.useState("本周六 22:00–24:00 平台进行维护，实验提交入口将短暂关闭。");

  return (
    <div className={cn(DASHBOARD_MAIN_CONTAINER_CLASS, "flex flex-col gap-6")}>
      <PageHeader
        title="系统通知配置"
            description="邮箱 SMTP、短信网关与系统公告"
      />
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">系统通知配置</CardTitle>
          <CardDescription>邮箱 SMTP、短信网关与系统公告</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">邮件通道总开关</p>
                <p className="text-xs text-muted-foreground">L 档：全局壳层、强调触控</p>
              </div>
              <Switch size="lg" defaultChecked />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP 主机</Label>
                <Input id="smtp-host" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">端口</Label>
                <Input id="smtp-port" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} />
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">短信网关</p>
                <p className="text-xs text-muted-foreground">M 档：表单默认</p>
              </div>
              <Switch size="md" defaultChecked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sms">网关 URL</Label>
              <Input id="sms" value={smsUrl} onChange={(e) => setSmsUrl(e.target.value)} />
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">行内预览通知</p>
                <p className="text-xs text-muted-foreground">S 档：表格行内紧凑开关</p>
              </div>
              <Switch size="sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ann">系统公告（全站横幅）</Label>
              <Textarea id="ann" rows={4} value={announcement} onChange={(e) => setAnnouncement(e.target.value)} />
            </div>
          </section>

          <Button
            type="button"
            size="sm"
            className="gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90"
            onClick={() => sonnerToast.success("通知配置已保存")}>
            保存配置
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
