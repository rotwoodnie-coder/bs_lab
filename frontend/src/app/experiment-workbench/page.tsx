"use client";

import * as React from "react";

import Link from "next/link";

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bs-lab/ui";
import { BookOpenText, CheckCircle2, Clock3, FlaskConical, Layers3, PlayCircle, ShieldCheck, Sparkles } from "@bs-lab/ui/icons";

const LEFT_NAV_ITEMS = ["课程总览", "视频与 OCR", "实验材料", "步骤编排", "安全提示", "引用信息", "提交审核"];
const QUICK_ACTIONS = [
  { label: "课程设计", icon: Sparkles },
  { label: "视频切片", icon: PlayCircle },
  { label: "步骤编排", icon: Layers3 },
  { label: "安全提示", icon: ShieldCheck },
];
const GUIDE_CARDS = [
  { title: "标准实验", value: "电磁铁吸引回形针", icon: FlaskConical },
  { title: "保存状态", value: "已保存", icon: CheckCircle2 },
  { title: "预计时长", value: "25 分钟", icon: Clock3 },
  { title: "当前完成度", value: "92%", icon: BookOpenText },
];

export default function ExperimentWorkbenchPage() {
  return (
    <React.Suspense fallback={<p className="py-6 text-sm text-muted-foreground">加载实验工作台…</p>}>
      <ExperimentWorkbenchShell />
    </React.Suspense>
  );
}

function ExperimentWorkbenchShell() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1680px] gap-6 xl:grid-cols-[240px_minmax(0,1fr)_280px]">
        <aside className="hidden xl:flex xl:flex-col xl:gap-6">
          <Card className="border-border bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">科学实验·管理台</CardTitle>
              <CardDescription>工作台总览</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {LEFT_NAV_ITEMS.map((item, idx) => (
                <div
                  key={item}
                  className={
                    idx === 0
                      ? "rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground"
                      : "rounded-xl border border-border bg-slate-50 px-3 py-2 text-sm text-muted-foreground"
                  }
                >
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">快捷入口</CardTitle>
              <CardDescription>按流程快速推进</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {QUICK_ACTIONS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-left text-sm text-foreground shadow-sm transition hover:bg-slate-50"
                  >
                    <Icon className="size-4 text-primary" />
                    {item.label}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-border bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">个人中心</CardTitle>
              <CardDescription>教师账号</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">教</div>
              <div>
                <p className="text-sm font-medium text-foreground">实验教研员</p>
                <p className="text-xs text-muted-foreground">工作台模式</p>
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="min-w-0 space-y-6">
          <Card className="border-border bg-white shadow-sm">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {GUIDE_CARDS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.title} className="rounded-2xl border border-border bg-slate-50 p-4 shadow-sm">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Icon className="size-4" />
                            {item.title}
                          </div>
                          <p className="mt-1 text-sm font-medium text-foreground">{item.value}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">实验课程设计工作台</h1>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                      在这里完成标准实验视频预览、媒体库选择、本地上传、OCR 识别、步骤编排、安全提示与提交审核。
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-[28px] border border-border bg-white shadow-sm">
                    <div className="grid gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:p-6">
                      <div className="space-y-4">
                        <div className="relative aspect-video overflow-hidden rounded-[24px] border border-border bg-slate-950 shadow-sm">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg">
                                <PlayCircle className="size-7 text-white" />
                              </div>
                            </div>
                          </div>
                          <div className="absolute left-4 top-4 rounded-full bg-black/35 px-3 py-1 text-xs text-white">核心视频展示区</div>
                          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                            <div>
                              <p className="text-lg font-semibold text-white">当前实验视频</p>
                              <p className="text-sm text-white/70">这里接入可播放视频、poster 和加载状态</p>
                            </div>
                            <Badge className="rounded-full bg-white/10 text-white">待接入</Badge>
                          </div>
                        </div>

                        <div className="relative overflow-hidden rounded-2xl border border-border bg-slate-50 p-3 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-medium text-muted-foreground">视频控制</span>
                            <span className="text-[11px] text-muted-foreground">媒体库 / 上传 / OCR</span>
                          </div>
                          <div className="absolute bottom-3 right-3 flex gap-2">
                            <button type="button" className="flex size-8 items-center justify-center rounded-full border border-border bg-white text-[10px] font-medium text-foreground shadow-sm hover:bg-slate-50" aria-label="媒体库">M</button>
                            <button type="button" className="flex size-8 items-center justify-center rounded-full border border-border bg-white text-[10px] font-medium text-foreground shadow-sm hover:bg-slate-50" aria-label="上传">U</button>
                            <button type="button" className="flex size-8 items-center justify-center rounded-full border border-border bg-white text-[10px] font-medium text-foreground shadow-sm hover:bg-slate-50" aria-label="OCR">O</button>
                          </div>
                          <p className="mt-8 text-xs leading-5 text-muted-foreground">
                            视频未加载时，点击视频区即可上传视频。
                          </p>
                        </div>

                        <div className="grid gap-3 rounded-2xl border border-border bg-slate-50 p-4 shadow-sm sm:grid-cols-2">
                          {[
                            { label: "视频用途", value: "课堂导入 / 示范 / 课后复看" },
                            { label: "课程模式", value: "选题式编排" },
                            { label: "适配层级", value: "小学中高年级" },
                            { label: "操作建议", value: "先选模板，再做轻量补充" },
                          ].map((item) => (
                            <div key={item.label} className="rounded-xl border border-border bg-white p-3">
                              <p className="text-xs text-muted-foreground">{item.label}</p>
                              <p className="mt-1 text-sm font-medium text-foreground">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Card className="border-border bg-white shadow-sm">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">视频状态</CardTitle>
                            <CardDescription>保持沉浸感的悬浮控制栏</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <p>播放：待接入</p>
                            <p>加载：待接入</p>
                            <p>缩略图：待接入</p>
                          </CardContent>
                        </Card>

                        <Card className="border-border bg-white shadow-sm">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">编辑说明</CardTitle>
                            <CardDescription>简洁展示，不增加负担</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p>• 视频和 OCR 保留。</p>
                            <p>• 引用信息不做大卡片。</p>
                            <p>• 功能不丢，视觉先回到参考图。</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>

                  <Card className="border-border bg-white shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">OCR 识别结果</CardTitle>
                      <CardDescription>独立文本区，保持简洁</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <textarea
                        className="min-h-[180px] w-full rounded-2xl border border-border bg-white p-4 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground shadow-sm"
                        placeholder="选择视频后，系统会从封面提取文字。结果以 text 形式展示在这里。"
                      />
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card className="border-border bg-white shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">工作台提示</CardTitle>
                      <CardDescription>先选视频，再做 OCR</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button type="button" className="w-full rounded-2xl">开始设计</Button>
                      <Button type="button" variant="outline" className="w-full rounded-2xl" asChild>
                        <Link href="/experiment-manage">返回列表</Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-white shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">辅助面板</CardTitle>
                      <CardDescription>三个小图标操作</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "媒体库", short: "M" },
                          { label: "上传", short: "U" },
                          { label: "OCR", short: "O" },
                        ].map((item) => (
                          <button
                            key={item.label}
                            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-white text-sm text-foreground shadow-sm hover:bg-slate-50"
                          >
                            <span className="flex size-8 items-center justify-center rounded-full border border-border bg-slate-50 text-xs font-semibold">
                              {item.short}
                            </span>
                            <span className="text-xs text-muted-foreground">{item.label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="rounded-2xl border border-border bg-slate-50 p-3 text-xs leading-5 text-muted-foreground shadow-sm">
                        点击视频区时，如果还没有加载视频，就直接进入上传。
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
