"use client";

import * as React from "react";
import Link from "next/link";
import {
  Badge,
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
  Separator,
  Switch,
} from "@bs-lab/ui";
import { Bell, Footprints, Loader2, Share2, Sparkles } from "@bs-lab/ui/icons";

import {
  AI_GUIDANCE_STYLE_OPTIONS,
  buildAiGuidanceStylePromptConstraint,
  readAiGuidanceStyle,
  writeAiGuidanceStyle,
  type AiGuidanceStyleId,
} from "@/lib/parent/parent-ai-guidance-style";
import {
  buildMentorPromptSuffix,
  inferGradeBandFromLabel,
  readStoredTutorPersona,
} from "@/config/ai-config";
import { useSessionActor } from "@/hooks/use-session-actor";
import { ErrorBoundary } from "@/components/business/error-boundary";
import { useParentLabPage } from "./page.hooks";
import { isSuperUserRole } from "@/lib/rbac/management-access";
import { UserRole } from "@/types/auth";
import { ScienceRadar } from "./_components/ScienceRadar";

const MOCK_BADGES = [
  { id: "b1", label: "香料初级", unlocked: true },
  { id: "b2", label: "安全小卫士", unlocked: true },
  { id: "b3", label: "想法达人", unlocked: false },
];

export default function ParentLabPage() {
  return (
    <ErrorBoundary>
      <ParentLabPageInner />
    </ErrorBoundary>
  );
}

function ParentLabPageInner() {
  const { role } = useSessionActor();
  const { loading, sessions, firstBinding, firstBindingDisplay } = useParentLabPage();
  const [guidanceStyle, setGuidanceStyle] = React.useState<AiGuidanceStyleId>(() => readAiGuidanceStyle());
  const [personaHint, setPersonaHint] = React.useState("");
  const [accompanyConfirm, setAccompanyConfirm] = React.useState(false);

  React.useEffect(() => {
    setPersonaHint(
      buildMentorPromptSuffix(
        readStoredTutorPersona(),
        inferGradeBandFromLabel(firstBindingDisplay?.gradeLabel?.trim() ? firstBindingDisplay.gradeLabel : "四年级"),
      ),
    );
  }, [firstBindingDisplay?.gradeLabel]);

  if (role !== UserRole.PARENT && !isSuperUserRole(role)) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        当前页面面向家长角色。请使用家长账号登录后查看。
        <div className="mt-4">
          <Link href="/" className="text-primary underline-offset-4 hover:underline">返回首页</Link>
        </div>
      </div>
    );
  }

  const childLine = firstBindingDisplay
    ? `${firstBindingDisplay.displayName} · ${firstBindingDisplay.gradeLabel}`
    : "尚未绑定孩子（任务中心将提示绑定）";
  const mentorLine = firstBindingDisplay
    ? `这周推荐在家完成「柠檬与酸碱指示」小实验，步骤短、材料厨房可得；请先确认护目镜与通风。`
    : `绑定孩子年级后，我会按年龄推荐难度与安全提示。`;

  const styleConstraint = buildAiGuidanceStylePromptConstraint(guidanceStyle);

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <header className="space-y-2">
        <h1 className="text-lg font-semibold text-foreground">家庭实验室</h1>
        <p className="text-sm text-muted-foreground">四阶联动主工作台：精准适配 → 科学指导 → 同步记录 → 社交分享。</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" className="gap-1" asChild>
            <Link href="/parent/tasks">
              <Bell className="size-3.5" aria-hidden />
              任务中心
            </Link>
          </Button>
          {!firstBinding ? (
            <Button type="button" size="sm" variant="secondary" asChild>
              <Link href="/profile/family">绑定孩子</Link>
            </Button>
          ) : null}
        </div>
      </header>

      <Card className="border-primary/25 bg-primary/5 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">精准适配 · 动态调优</CardTitle>
          <CardDescription className="text-xs">调节「引导节奏」：不评价孩子性格，仅影响 AI 提示密度与讲解深度。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-guidance-style" className="text-xs text-muted-foreground">引导节奏</Label>
            <Select value={guidanceStyle} onValueChange={(v) => { const next = v as AiGuidanceStyleId; writeAiGuidanceStyle(next); setGuidanceStyle(next); }}>
              <SelectTrigger id="ai-guidance-style" className="w-full">
                <SelectValue placeholder="选择档位" />
              </SelectTrigger>
              <SelectContent>
                {AI_GUIDANCE_STYLE_OPTIONS.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {AI_GUIDANCE_STYLE_OPTIONS.find((o) => o.id === guidanceStyle)?.description}
            </p>
          </div>
          <Separator />
          <div className="rounded-md border border-border/60 bg-background/80 p-3 text-[11px] leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Prompt 约束</p>
            <p className="mt-2 whitespace-pre-wrap">{styleConstraint}</p>
            <p className="mt-2 whitespace-pre-wrap text-[10px] opacity-90">{personaHint}</p>
          </div>
          <Separator />
          <div className="space-y-2 text-sm leading-relaxed text-foreground">
            <p className="text-xs font-medium text-muted-foreground">AI 导师开场</p>
            <p className="text-xs text-muted-foreground">{childLine}</p>
            <p>{mentorLine}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">① 精准适配</CardTitle>
          <CardDescription className="text-xs">年级与难度</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary">{firstBindingDisplay?.gradeLabel ?? "未绑定 · 无年级"}</Badge>
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href="/resources">去实验工坊选实验</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">② 科学指导</CardTitle>
          <CardDescription className="text-xs">视频与分步说明</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="secondary" size="sm" className="w-full" asChild>
            <Link href="/resources">打开示范视频与图解</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">③ 同步记录 · 实验素材采集</CardTitle>
          <CardDescription className="text-xs">SessionId 贯穿任务 → 会话 → 报告，素材通过会话内的抓拍功能记录。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-row items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/10 px-3 py-2">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">陪同确认（弱背书）</p>
              <p className="text-xs text-muted-foreground">表示家长已陪同完成本次家庭实验记录；与 sessionId 在报告链路中可追溯关联。</p>
            </div>
            <Switch checked={accompanyConfirm} onCheckedChange={setAccompanyConfirm} aria-label="陪同确认" />
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              加载中…
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无会话。请从「任务中心」开始辅导。</p>
          ) : (
            <ul className="space-y-2">
              {sessions.slice(0, 5).map((s) => (
                <li key={s.sessionId}>
                  <Button type="button" variant="outline" size="sm" className="h-auto w-full justify-between gap-2 py-2 font-normal" asChild>
                    <Link href={`/parent/sessions/${s.sessionId}`}>
                      <span className="flex min-w-0 flex-col items-start text-left">
                        <span className="truncate text-xs text-muted-foreground">{s.expName || s.expId}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">sessionId：{s.sessionId}</span>
                      </span>
                      <Footprints className="size-4 shrink-0 opacity-60" aria-hidden />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <Button type="button" variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/parent/tasks">前往任务中心</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">④ 社交分享 · 科学成就卡</CardTitle>
          <CardDescription className="text-xs">班级/家庭组邀请与分享图带动「拍同款」回流；雷达图替代排名，突出荣誉感。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScienceRadar />
          <div className="rounded-xl bg-gradient-to-br from-violet-500/15 via-background to-amber-500/10 p-4 ring-1 ring-border">
            <p className="text-center text-xs font-medium text-muted-foreground">成就卡视觉区</p>
            <p className="mt-1 text-center text-lg font-semibold text-foreground">
              {firstBindingDisplay?.displayName ?? "孩子"} 的科学探究瞬间
            </p>
            <Separator className="my-3" />
            <Button type="button" className="mt-4 w-full gap-2" variant="secondary" size="sm" disabled>
              <Share2 className="size-4" aria-hidden />
              生成分享图
            </Button>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">成长勋章墙</p>
            <div className="flex flex-wrap gap-2">
              {MOCK_BADGES.map((b) => (
                <Badge key={b.id} variant={b.unlocked ? "default" : "outline"} className="gap-1 py-1.5">
                  {b.unlocked ? <Sparkles className="size-3" /> : null}
                  {b.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
