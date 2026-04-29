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
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  sonnerToast,
} from "@bs-lab/ui";
import { Camera, FileText, Loader2, SendHorizontal } from "@bs-lab/ui/icons";

import { ErrorBoundary } from "@/components/business/error-boundary";
import { useSessionDetailPage } from "./page.hooks";
import { useSessionActor } from "@/hooks/use-session-actor";
import { isSuperUserRole } from "@/lib/rbac/management-access";
import { UserRole } from "@/types/auth";
import { buildAiGuideReply, type AiGuideStyle, type AiGuideUserRole } from "@/lib/ai-guide-mock";

const GUIDE_OPTIONS: { id: string; label: string }[] = [
  { id: "gentle", label: "温和" },
  { id: "rigorous", label: "严谨" },
  { id: "playful", label: "趣味" },
];

function mapSessionStyleToAi(s: string): AiGuideStyle {
  return s as AiGuideStyle;
}

export default function ParentSessionDetailPage() {
  return (
    <ErrorBoundary>
      <ParentSessionDetailPageInner />
    </ErrorBoundary>
  );
}

function ParentSessionDetailPageInner() {
  const { role } = useSessionActor();
  const {
    loading,
    session,
    report,
    sessionId,
    router,
    onGuideStyleChange,
    onAttestChange,
    onMaterialShortageChange,
    onErrorIncrement,
    onGenerateReport,
  } = useSessionDetailPage();

  const [aiRole, setAiRole] = React.useState<AiGuideUserRole>("parent");
  const [aiInput, setAiInput] = React.useState("");
  const [aiBlocks, setAiBlocks] = React.useState<{ id: string; role: AiGuideUserRole; cards: ReturnType<typeof buildAiGuideReply> }[]>([]);

  const guideStyle = session?.guideStyle ?? "gentle";

  const sendAi = () => {
    const cards = buildAiGuideReply({
      role: aiRole,
      guideStyle: mapSessionStyleToAi(guideStyle),
      userMessage: aiInput,
    });
    setAiBlocks((prev) => [...prev, { id: `ai-${Date.now()}`, role: aiRole, cards }]);
    setAiInput("");
  };

  if (role !== UserRole.PARENT && !isSuperUserRole(role)) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        仅家长可查看辅导会话。
        <div className="mt-4">
          <Link href="/" className="text-primary underline-offset-4 hover:underline">返回首页</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg py-8 text-center text-sm text-muted-foreground">
        <Loader2 className="mx-auto mb-2 size-5 animate-spin" aria-hidden />
        加载中…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-1">
        <p className="text-sm text-muted-foreground">未找到会话或无权访问。</p>
        <Button type="button" variant="outline" asChild>
          <Link href="/parent/tasks">返回任务中心</Link>
        </Button>
      </div>
    );
  }

  const assignmentTitle = session.expName || session.expId;

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <header className="space-y-1">
        <Badge variant="secondary" className="font-mono text-[10px]">
          sessionId：{session.sessionId}
        </Badge>
        {session.taskId ? (
          <Badge variant="outline" className="ml-2 font-mono text-[10px]">
            taskId：{session.taskId}
          </Badge>
        ) : null}
        <h1 className="text-lg font-semibold text-foreground">辅导会话</h1>
        <p className="text-sm text-muted-foreground">{assignmentTitle}</p>
      </header>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">AI 导师</CardTitle>
          <CardDescription className="text-xs">
            切换对象与引导风格后发送消息，卡片内容会随风格变化（无真实模型调用）。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant={aiRole === "student" ? "default" : "outline"} onClick={() => setAiRole("student")}>学生视角</Button>
            <Button type="button" size="sm" variant={aiRole === "parent" ? "default" : "outline"} onClick={() => setAiRole("parent")}>家长视角</Button>
          </div>
          <div className="grid gap-2">
            <Label className="text-xs">引导风格</Label>
            <Select value={guideStyle} onValueChange={onGuideStyleChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="风格" />
              </SelectTrigger>
              <SelectContent>
                {GUIDE_OPTIONS.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Input value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="输入想法或陪同确认的问题…" className="text-sm" />
            <Button type="button" size="icon" variant="secondary" className="shrink-0" onClick={sendAi}>
              <SendHorizontal className="size-4" aria-hidden />
            </Button>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border/80 bg-muted/10 p-2">
            {aiBlocks.length === 0 ? (
              <p className="text-xs text-muted-foreground">发送一条消息，查看分角色、分风格卡片。</p>
            ) : (
              aiBlocks.map((block) => (
                <div key={block.id} className="space-y-1 rounded-md border border-border/60 bg-background/80 p-2">
                  <p className="text-[10px] font-medium text-muted-foreground">{block.role === "student" ? "学生" : "家长"} · 当前风格 {guideStyle}</p>
                  {block.cards.map((c, i) => (
                    <div key={`${block.id}-${i}`} className="rounded border border-border/50 bg-muted/20 px-2 py-1.5 text-xs">
                      <p className="font-medium text-foreground">{c.title}</p>
                      <p className="mt-0.5 text-muted-foreground">{c.body}</p>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">实验步骤 · 抓拍</CardTitle>
          <CardDescription className="text-xs">素材抓拍（当前为本地模拟）。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="rounded-lg border border-border/80 bg-muted/15 p-3">
            <p className="text-xs font-medium text-muted-foreground">步骤 1</p>
            <p className="mt-1 text-foreground">确认材料与安全要点。</p>
          </div>
          <div className="rounded-lg border border-primary/25 bg-primary/5 p-3">
            <p className="text-xs font-medium text-primary">步骤 2 · 当前</p>
            <p className="mt-1 text-foreground">观察颜色 / 状态变化，可拍照记录。</p>
            <Button type="button" size="sm" className="mt-3 gap-2" variant="secondary" onClick={() => sonnerToast.message("拍照功能待接入")}>
              <Camera className="size-4" aria-hidden />
              拍照记录
            </Button>
          </div>
          <div className="rounded-lg border border-border/80 bg-muted/10 p-3 opacity-80">
            <p className="text-xs font-medium text-muted-foreground">步骤 3</p>
            <p className="mt-1 text-foreground">整理一句结论，准备生成报告。</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">实验收尾 · 背书与反馈</CardTitle>
          <CardDescription className="text-xs">背书后教师端可将本条目标记为「基本合格」。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <Checkbox
              id="parent-attest"
              className="mt-0.5"
              checked={Boolean(session.parentAttestedAt)}
              disabled={Boolean(session.parentAttestedAt)}
              onCheckedChange={(v) => { if (v === true) onAttestChange(true); }}
            />
            <Label htmlFor="parent-attest" className="cursor-pointer font-normal leading-relaxed text-foreground">
              确认孩子已完成本实验，本人已陪同并背书（数字确认）
            </Label>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox
              id="material-shortage"
              className="mt-0.5"
              checked={Boolean(session.materialShortageReported)}
              onCheckedChange={(v) => { onMaterialShortageChange(v === true); }}
            />
            <Label htmlFor="material-shortage" className="cursor-pointer font-normal leading-relaxed text-foreground">
              家中材料较难凑齐（将汇总到教师学情看板）
            </Label>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onErrorIncrement}>
            模拟一次错误预警
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="size-4" aria-hidden />
            亲子报告
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!report ? (
            <Button type="button" onClick={onGenerateReport}>生成报告</Button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-gradient-to-br from-primary/10 via-background to-muted/30 p-4">
                <p className="text-center text-xs font-medium text-muted-foreground">摘要预览</p>
                <p className="mt-2 text-center text-sm font-semibold text-foreground">{report.summary}</p>
                <Separator className="my-3" />
                <div className="grid gap-2 text-xs text-muted-foreground">
                  <p><span className="font-medium text-foreground">亮点：</span>{report.strengths.join("、")}</p>
                  <p><span className="font-medium text-foreground">AI 点评 · 可提升：</span>{report.improvements.join("、")}</p>
                  <p><span className="font-medium text-foreground">教师评语：</span>{report.teacherComment ?? "—"}</p>
                </div>
              </div>
              <Button type="button" variant="secondary" size="sm" className="w-full" asChild>
                <Link href={`/parent/reports/${session.sessionId}`}>查看科学成就卡</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
