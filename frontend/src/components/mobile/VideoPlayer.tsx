"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useVideoSecurity } from "@/hooks/useVideoSecurity";
import { createVideoStepMachine, type VideoStepItem } from "@/state/video-step-machine";

export type VideoStep = VideoStepItem;

type RelatedVideo = {
  id: string;
  title: string;
  duration: number;
  coverUrl: string;
};

export function VideoPlayer({ src, steps, videoId }: { src: string; steps: VideoStep[]; videoId?: string }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const machine = useMemo(() => createVideoStepMachine({ steps }), [steps]);
  const [snapshot, setSnapshot] = useState(machine.getSnapshot());
  const [related, setRelated] = useState<RelatedVideo[]>([]);
  const security = useVideoSecurity();
  // 记录当前是否正在播报，避免重复触发
  const speakingRef = useRef(false);

  const currentStep = useMemo(
    () => steps.find((step) => step.id === snapshot.currentStepId) ?? steps[0],
    [snapshot.currentStepId, steps],
  );

  // 初次加载时启动状态机
  useEffect(() => {
    if (!currentStep || snapshot.state !== "idle") return;
    setSnapshot(machine.start());
  }, [currentStep, machine, snapshot.state]);

  // speeching → locked（播报中锁定下一步按钮）
  useEffect(() => {
    if (snapshot.state !== "speeching") return;
    setSnapshot(machine.lock());
  }, [snapshot.state, machine]);

  // 安全播报完成 → 解锁
  useEffect(() => {
    if (security.state !== "done") return;
    if (!speakingRef.current) return;
    speakingRef.current = false;
    setSnapshot((prev) => {
      // 如果已经完成或跳转过了，不覆盖
      if (prev.state === "idle" || prev.state === "completed") return prev;
      return machine.unlock();
    });
  }, [security.state, machine]);

  // 加载相关推荐
  useEffect(() => {
    const id = videoId ?? currentStep?.id ?? "";
    if (!id) return;
    void fetch(`/api/video/list?relatedTo=${encodeURIComponent(id)}`, { credentials: "include" })
      .then((res) => res.json())
      .then((json) => setRelated((json.data?.items ?? []) as RelatedVideo[]))
      .catch(() => setRelated([]));
  }, [currentStep?.id, videoId]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || steps.length === 0) return;
    const ct = video.currentTime;
    // 按 startAt 排序找到当前应该高亮的步骤
    let activeStepIdx = 0;
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      if (typeof s.startAt === "number" && ct >= s.startAt) {
        activeStepIdx = i;
      }
    }
    const active = steps[activeStepIdx];
    if (active && active.id !== snapshot.currentStepId) {
      setSnapshot(machine.requestStep(active.id));
    }
  };

  const handlePlay = () => {
    // 初次播放时触发当前步骤的安全播报（仅触发一次）
    if (!currentStep || speakingRef.current) return;
    speakingRef.current = true;
    security.startSpeak(currentStep.safetyNote);
    setSnapshot(machine.beginSpeech());
  };

  const requestStep = (stepId: string) => {
    if (snapshot.isLocked) return;
    const next = machine.requestStep(stepId);
    setSnapshot(next);
    const step = steps.find((item) => item.id === stepId);
    if (step) {
      speakingRef.current = true;
      security.startSpeak(step.safetyNote);
      setSnapshot(machine.beginSpeech());
      const video = videoRef.current;
      if (video && typeof step.startAt === "number") {
        video.currentTime = step.startAt;
        void video.play();
      }
    }
  };

  const openVideo = (targetId: string) => {
    router.push(`/m/video/${encodeURIComponent(targetId)}`);
  };

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="relative overflow-hidden rounded-3xl border bg-black shadow-sm">
        <video
          ref={videoRef}
          src={src}
          controls
          className="h-full w-full"
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
        />
        {snapshot.isLocked ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
            <div className="rounded-2xl bg-black/60 px-4 py-2 text-sm">安全播报中… {security.countdown}s</div>
          </div>
        ) : null}
      </div>
      <aside className="space-y-3">
        <div className="rounded-3xl border bg-background p-4">
          <div className="text-sm font-semibold text-muted-foreground">当前步骤</div>
          <div className="mt-2 text-lg font-semibold">{currentStep?.title ?? "未开始"}</div>
          <p className="mt-2 text-sm text-muted-foreground">{currentStep?.safetyNote ?? ""}</p>
        </div>
        <div className="space-y-2">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => requestStep(step.id)}
              disabled={snapshot.isLocked}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${snapshot.currentStepId === step.id ? "border-primary bg-primary/10" : "border-border/60 bg-background hover:bg-muted/50"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{step.title}</span>
                <span className="text-xs text-muted-foreground">{step.duration}s</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{step.safetyNote}</p>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (snapshot.isLocked) return;
              setSnapshot(machine.goBack());
              const step = steps[snapshot.currentStepIndex - 1];
              if (step) {
                speakingRef.current = true;
                security.startSpeak(step.safetyNote);
                setSnapshot(machine.beginSpeech());
              }
            }}
            disabled={snapshot.isLocked || !snapshot.canGoBack}
            className="flex-1 rounded-2xl border px-4 py-3 text-sm font-medium disabled:opacity-50"
          >
            上一步
          </button>
          <button
            onClick={() => {
              if (snapshot.isLocked) return;
              const nextSnap = machine.goNext();
              setSnapshot(nextSnap);
              security.onDone();
              const step = steps[nextSnap.currentStepIndex];
              if (step) {
                speakingRef.current = true;
                security.startSpeak(step.safetyNote);
                setSnapshot(machine.beginSpeech());
              }
            }}
            disabled={snapshot.isLocked || !snapshot.canGoNext}
            className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            下一步
          </button>
        </div>
        {related.length > 0 ? (
          <div className="rounded-3xl border bg-background p-4">
            <div className="mb-3 text-sm font-semibold text-muted-foreground">相关推荐</div>
            <div className="space-y-2">
              {related.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openVideo(item.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left hover:bg-muted/50"
                >
                  <div className="h-14 w-20 rounded-xl bg-muted" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.duration}s</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
