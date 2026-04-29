"use client";

import * as React from "react";
import { Button, Calendar, DateRangePicker, RichMediaEditor, sonnerToast } from "./lab-ui";
import type { LabSectionConfig, UiLabContext } from "../lab-types";
import {
  LabBentoCardDemo,
  LabSafetyGuardDemo,
  LabStatMetricDemo,
  RadixToastDemo,
  SimulationPlayerSkeletonLab,
} from "./lab-demos";

function RichMediaEditorLabDemo() {
  const [value, setValue] = React.useState({ text: "示例内容", embeds: [] as Array<{ id: string; kind: "image" | "video"; src: string; caption?: string }> });
  return (
    <div className="space-y-2">
      <RichMediaEditor
        value={value}
        onChange={setValue}
        onUploadMedia={async (kind, file) => {
          const src = URL.createObjectURL(file);
          return { src, caption: kind === "image" ? "图片示例" : "视频示例" };
        }}
      />
      <p className="text-xs text-muted-foreground">此处为 UI Lab ，业务页请接入统一媒体库上传逻辑。</p>
    </div>
  );
}

export function getUiLabSectionsPart2(): LabSectionConfig[] {
  return [
    {
      id: "section-time",
      title: "时间选择",
      description: "日历单选与日期区间选择（DateRangePicker 受控）。",
      items: [
        {
          kind: "custom",
          id: "calendar-range",
          label: "Calendar / DateRangePicker",
          render: (ctx: UiLabContext) => (
            <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Calendar（单选）</p>
                <Calendar mode="single" selected={ctx.calDate} onSelect={ctx.setCalDate} />
              </div>
              <div className="min-w-0 space-y-3 lg:w-[min(100%,360px)]">
                <p className="text-sm font-medium text-muted-foreground">DateRangePicker（受控）</p>
                <DateRangePicker
                  date={ctx.range}
                  onDateChange={ctx.setRange}
                  numberOfMonths={2}
                />
                <p className="text-xs text-muted-foreground">
                  range 由页面 state 持有，便于与表单或请求参数同步。
                </p>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      id: "section-feedback",
      title: "反馈与提醒",
      description:
        "双模设计系统件（BentoCard / StatusPulse / StatMetric / SafetyGuard）+ Toast / Sonner、模拟器骨架、Alert、进度与 Skeleton。",
      stackClassName: "space-y-8",
      items: [
        {
          kind: "custom",
          id: "rich-media-editor",
          label: "RichMediaEditor",
          render: () => <RichMediaEditorLabDemo />,
        },
        {
          kind: "custom",
          id: "lab-bento-card",
          label: "BentoCard + API",
          render: () => <LabBentoCardDemo />,
        },
        { kind: "showcase", name: "StatusPulse" },
        {
          kind: "custom",
          id: "lab-stat-metric",
          label: "StatMetric + API",
          render: () => <LabStatMetricDemo />,
        },
        {
          kind: "custom",
          id: "lab-safety-guard",
          label: "SafetyGuard + API",
          render: () => <LabSafetyGuardDemo />,
        },
        {
          kind: "custom",
          id: "toast-radix",
          label: "Toast（Radix）+ Toaster",
          render: () => <RadixToastDemo />,
        },
        {
          kind: "custom",
          id: "sonner",
          label: "Sonner（sonnerToast）",
          render: () => (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  sonnerToast.success("操作成功", { description: "SonnerToaster 已挂载" })
                }
              >
                Sonner success
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => sonnerToast.message("提示", { description: "中性消息" })}
              >
                Sonner message
              </Button>
            </div>
          ),
        },
        {
          kind: "custom",
          id: "simulation-player-skeleton",
          label: "SimulationPlayer · 加载骨架屏",
          render: () => <SimulationPlayerSkeletonLab />,
        },
        { kind: "showcase", name: "Alert" },
        { kind: "showcase", name: "Progress" },
        { kind: "showcase", name: "Skeleton" },
      ],
    },
  ];
}
