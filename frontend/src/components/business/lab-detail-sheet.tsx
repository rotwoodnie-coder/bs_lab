"use client";

import * as React from "react";
import {
  ScrollArea,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@bs-lab/ui";
import { cn } from "@/lib/utils";

export type LabScheduleSlot = {
  id: string;
  timeRange: string;
  title: string;
  state: "past" | "current" | "upcoming";
};

export type LabSensorTargets = {
  tempC: number;
  humidityPct: number;
  pm25: number;
};

export type LabDetailModel = {
  id: string;
  name: string;
  cameraLabel: string;
  schedule: LabScheduleSlot[];
  sensors: LabSensorTargets;
};

function useAnimatedSensorValues(target: LabSensorTargets | null, active: boolean) {
  const [values, setValues] = React.useState({ tempC: 0, humidityPct: 0, pm25: 0 });

  React.useEffect(() => {
    if (!active || !target) {
      setValues({ tempC: 0, humidityPct: 0, pm25: 0 });
      return;
    }

    const durationMs = 1000;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const ease = 1 - (1 - t) ** 2;
      setValues({
        tempC: target.tempC * ease,
        humidityPct: target.humidityPct * ease,
        pm25: target.pm25 * ease,
      });
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target]);

  return values;
}

function SensorRing({
  label,
  value,
  unit,
  max,
  className,
}: {
  label: string;
  value: number;
  unit: string;
  max: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const rest = 100 - pct;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative size-[4.5rem]">
        <svg className="size-full -rotate-90" viewBox="0 0 36 36" aria-hidden>
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            className="stroke-muted"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            className="stroke-primary transition-[stroke-dasharray] duration-150"
            strokeWidth="3"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${pct} ${rest}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {label === "温度" ? value.toFixed(1) : Math.round(value)}
          </span>
          <span className="text-[10px] text-muted-foreground">{unit}</span>
        </div>
      </div>
      <span className="text-center text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export type LabDetailSheetProps = {
  lab: LabDetailModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LabDetailSheet({ lab, open, onOpenChange }: LabDetailSheetProps) {
  const sensors = useAnimatedSensorValues(lab?.sensors ?? null, open && !!lab);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full max-h-screen w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border px-6 py-4 text-left">
          <SheetTitle>{lab?.name ?? "实验室"}</SheetTitle>
          <SheetDescription>实时视频与环境监测为数据，非真实设备流。</SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-6 px-6 py-4">
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                视频预览
              </h3>
              <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-foreground/90 text-center">
                  <div className="flex items-center gap-2">
                    <span className="relative flex size-2.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-75" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-destructive" />
                    </span>
                    <span className="text-xs font-medium text-primary-foreground">REC</span>
                  </div>
                  <p className="px-4 text-sm text-primary-foreground/90">
                    {lab?.cameraLabel ?? "CAM-01"} 实时流调取中…
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                环境监测
              </h3>
              <div className="flex justify-between gap-2 rounded-xl border border-border bg-muted/30 px-2 py-4">
                <SensorRing label="温度" value={sensors.tempC} unit="°C" max={40} />
                <SensorRing label="湿度" value={sensors.humidityPct} unit="%" max={100} />
                <SensorRing label="PM2.5" value={sensors.pm25} unit="μg/m³" max={150} />
              </div>
            </section>

            <Separator />

            <section className="space-y-3 pb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                今日课表
              </h3>
              <div className="relative ml-1 border-l border-border">
                <ol className="space-y-0">
                  {(lab?.schedule ?? []).map((slot) => (
                    <li key={slot.id} className="relative pb-6 pl-6 last:pb-0">
                      <span
                        className={cn(
                          "absolute top-1.5 left-0 size-2.5 -translate-x-1/2 rounded-full border-2 border-background",
                          slot.state === "current" && "bg-primary",
                          slot.state === "past" && "bg-muted-foreground/40",
                          slot.state === "upcoming" && "bg-muted-foreground/25",
                        )}
                      />
                      <p className="text-xs font-medium text-muted-foreground tabular-nums">
                        {slot.timeRange}
                      </p>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          slot.state === "current" ? "text-primary" : "text-foreground",
                        )}
                      >
                        {slot.title}
                      </p>
                      {slot.state === "current" ? (
                        <p className="text-xs text-muted-foreground">进行中</p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
