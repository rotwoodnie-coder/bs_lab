"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@bs-lab/ui";
import { Maximize2, Minimize2, Radio } from "@bs-lab/ui/icons";

import { cn } from "@/lib/utils";

export type SimulationTelemetryPayload = {
  source: "simulation-player";
  experimentId: string;
  stepIndex: number;
  score: number;
  at: string;
};

export type SimulationPlayerProps = {
  experimentId: string;
  title: string;
  embedSrc: string;
  className?: string;
  onTelemetry?: (payload: SimulationTelemetryPayload) => void;
};

export function SimulationPlayer({
  experimentId,
  title,
  embedSrc,
  className,
  onTelemetry,
}: SimulationPlayerProps) {
  const shellRef = React.useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [lastPayload, setLastPayload] = React.useState<SimulationTelemetryPayload | null>(null);
  const [iframeLoaded, setIframeLoaded] = React.useState(false);

  const enterFullscreen = React.useCallback(async () => {
    const el = shellRef.current;
    if (!el) return;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      setFullscreen(true);
    } catch {
      setFullscreen(true);
    }
  }, []);

  const exitFullscreen = React.useCallback(async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
    } catch {
      /* ignore */
    }
    setFullscreen(false);
  }, []);

  React.useEffect(() => {
    const onFs = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const pushMockTelemetry = React.useCallback(() => {
    const nextStep = stepIndex + 1;
    setStepIndex(nextStep);
    const payload: SimulationTelemetryPayload = {
      source: "simulation-player",
      experimentId,
      stepIndex: nextStep,
      score: Math.min(100, 20 + nextStep * 12),
      at: new Date().toISOString(),
    };
    setLastPayload(payload);
    onTelemetry?.(payload);
  }, [experimentId, onTelemetry, stepIndex]);

  const safeSrc = embedSrc.trim() || "about:blank";

  React.useEffect(() => {
    setIframeLoaded(false);
    const t = window.setTimeout(() => setIframeLoaded(true), 2800);
    return () => window.clearTimeout(t);
  }, [safeSrc]);

  return (
    <Card ref={shellRef} className={cn("overflow-hidden border-border shadow-xs", className)}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base">在线模拟</CardTitle>
          <CardDescription className="max-w-prose">
            {title} · 容器：全屏浏览与步骤回传（未接真实引擎）
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={fullscreen ? exitFullscreen : enterFullscreen}
          >
            {fullscreen ? (
              <>
                <Minimize2 className="size-4" />
                退出全屏
              </>
            ) : (
              <>
                <Maximize2 className="size-4" />
                全屏
              </>
            )}
          </Button>
          <Button type="button" size="sm" className="gap-1.5" onClick={pushMockTelemetry}>
            <Radio className="size-4" />
            模拟一步并回传
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
          {!iframeLoaded ? (
            <div className="absolute inset-0 z-10 flex flex-col gap-2 p-4">
              <Skeleton className="h-full w-full rounded-md" />
              <span className="sr-only">模拟器加载中</span>
            </div>
          ) : null}
          <iframe
            title={`${title} 模拟嵌入`}
            src={safeSrc}
            className={cn("size-full bg-background", !iframeLoaded && "opacity-0")}
            sandbox="allow-scripts allow-same-origin"
            onLoad={() => setIframeLoaded(true)}
          />
        </div>
        {lastPayload ? (
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">最近回传（模拟）</p>
            <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap break-all font-mono tabular-nums">
              {JSON.stringify(lastPayload, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">点击「模拟一步并回传」可查看 JSON 载荷。</p>
        )}
      </CardContent>
    </Card>
  );
}
