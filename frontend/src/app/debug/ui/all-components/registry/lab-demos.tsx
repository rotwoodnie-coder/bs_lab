"use client";

import { motion } from "framer-motion";
import * as React from "react";

import { getLabCustomPropsDoc } from "../living-docs";
import {
  BentoCard,
  BentoCardSocialActions,
  Button,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  SafetyGuard,
  ScrollAreaWithTopEdge,
  Skeleton,
  StatMetric,
  sonnerToast,
  useToast,
} from "./lab-ui";
import { PropsDocBlock } from "./props-doc-block";

const labBentoStaggerParent = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.04 },
  },
} as const;

export function RadixToastDemo() {
  const { toast: pushToast } = useToast();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() =>
          pushToast({
            title: "Radix Toast",
            description: "来自 @bs-lab/ui 的 Radix Toast（useToast）",
          })
        }
      >
        推送 Radix Toast
      </Button>
      <Button
        type="button"
        size="sm"
        variant="destructive"
        onClick={() =>
          pushToast({
            variant: "destructive",
            title: "错误样式",
            description: "destructive variant 下边框与对比色自检",
          })
        }
      >
        destructive
      </Button>
    </div>
  );
}

export function LabBentoCardDemo() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        默认内边距统一为 p-6；带 footer 时正文与底栏间距为 mt-5。
      </p>
      <motion.div
        className="grid gap-5 sm:grid-cols-2"
        variants={labBentoStaggerParent}
        initial="hidden"
        animate="show"
      >
        <BentoCard staggerIndex={0}>
          <p className="text-sm font-medium text-foreground">指标卡</p>
          <p className="mt-2 text-xs text-muted-foreground">staggerIndex=0，最先入场。</p>
        </BentoCard>
        <BentoCard staggerIndex={1}>
          <p className="text-sm font-medium text-foreground">任务卡</p>
          <p className="mt-2 text-xs text-muted-foreground">staggerIndex=1，紧随其后。</p>
        </BentoCard>
        <BentoCard
          staggerIndex={2}
          className="sm:col-span-2"
          footer={<BentoCardSocialActions viewsCount={1200} likesCount={42} commentsCount={7} />}
        >
          <p className="text-sm font-medium text-foreground">带社交底栏</p>
          <p className="mt-2 text-xs text-muted-foreground">footer 传入 BentoCardSocialActions 示意。</p>
        </BentoCard>
      </motion.div>
    </div>
  );
}

export function LabStatMetricDemo() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-6 text-2xl text-foreground">
        <StatMetric value={128} durationMs={900} viewMode="portal" />
        <StatMetric value={97.4} durationMs={900} decimals={1} viewMode="management" suffix="%" />
      </div>
    </div>
  );
}

export function LabCommandDialogDemo() {
  const [open, setOpen] = React.useState(false);
  const [chrome, setChrome] = React.useState<"portal" | "management">("portal");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-md border border-border bg-muted/30 p-1 text-xs">
        <Button
          type="button"
          size="sm"
          variant={chrome === "portal" ? "secondary" : "ghost"}
          className="h-8 px-2"
          onClick={() => setChrome("portal")}
        >
          portal
        </Button>
        <Button
          type="button"
          size="sm"
          variant={chrome === "management" ? "secondary" : "ghost"}
          className="h-8 px-2"
          onClick={() => setChrome("management")}
        >
          management
        </Button>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        打开 CommandDialog
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="CommandDialog "
        description="paletteChrome 与顶栏 ⌘K 一致"
        paletteChrome={chrome}
      >
        <CommandInput placeholder="输入关键词过滤…" />
        <CommandList>
          <CommandEmpty>无匹配</CommandEmpty>
          <CommandGroup heading="示例">
            <CommandItem
              onSelect={() => {
                setOpen(false);
                sonnerToast.message("已选择示例项");
              }}
            >
              示例导航项
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}

export function LabScrollAreaTopEdgeDemo() {
  return (
    <div className="space-y-3">
      <PropsDocBlock text={getLabCustomPropsDoc("scroll-area-top-edge") ?? ""} />
      <p className="text-xs text-muted-foreground">
        向下滚动列表，顶部会出现渐变与内阴影提示；与评审工作台左右栏行为一致。
      </p>
      <ScrollAreaWithTopEdge
        className="h-48 rounded-lg border border-border bg-card"
        fadeFromClassName="from-card/95 via-card/50"
      >
        <ul className="space-y-2 p-3 pr-4">
          {Array.from({ length: 16 }, (_, i) => (
            <li
              key={i}
              className="rounded-md border border-border/60 bg-muted/25 px-3 py-2 text-sm text-foreground"
            >
              滚动项 {i + 1} — 评审预览 / 表单等长列表的顶缘提示
            </li>
          ))}
        </ul>
      </ScrollAreaWithTopEdge>
    </div>
  );
}

export function LabSafetyGuardDemo() {
  const [open, setOpen] = React.useState(false);
  const [ack, setAck] = React.useState(false);
  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setAck(false);
          setOpen(true);
        }}
      >
        打开 SafetyGuard 
      </Button>
      <SafetyGuard
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setAck(false);
        }}
        title="安全确认（）"
        description="用于高危操作前的强制阅读与勾选确认。"
        acknowledgeId="lab-safety-ack-ui"
        acknowledgeLabel="我已阅读上述安全提示，并确认在教师监督下开展实验。"
        acknowledgeChecked={ack}
        onAcknowledgeChange={setAck}
        onConfirm={() => {
          setOpen(false);
          setAck(false);
          sonnerToast.success("已确认（）");
        }}
      >
        <p className="text-sm text-muted-foreground">
          此处可放置化学品清单、防护要求等长文案；底部必须勾选后方可继续。
        </p>
      </SafetyGuard>
    </div>
  );
}

export function SimulationPlayerSkeletonLab() {
  return (
    <div className="max-w-2xl space-y-2">
      <div className="flex aspect-video w-full flex-col gap-2 overflow-hidden rounded-lg border border-border bg-muted p-4">
        <Skeleton className="min-h-0 flex-1 rounded-md" />
        <span className="sr-only">模拟器加载中</span>
      </div>
      <p className="text-xs text-muted-foreground">
        结构与{" "}
        <code className="text-foreground">frontend/src/components/business/simulation-player</code>{" "}
        在 iframe 未就绪时的骨架层一致。
      </p>
    </div>
  );
}
