"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useVideoSecurity } from "@/hooks/useVideoSecurity";

export type VideoStep = {
  time: number;
  title: string;
  safetyNote: string | null;
};

type Props = {
  src: string;
  steps: VideoStep[];
  videoId?: string;
  title?: string;
  coverUrl?: string;
  duration?: number;
};

const DEFAULT_VIDEO_URL = "https://www.w3schools.com/html/mov_bbb.mp4";

export function VideoPlayer({ src, steps, title, coverUrl, duration }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(duration ?? 0);
  const [fallbackPrompt, setFallbackPrompt] = useState<string | null>(null);
  const security = useVideoSecurity({ onFallbackPrompt: setFallbackPrompt });
  const locked = security.isLocked;
  const activeStep = steps[activeIndex] ?? steps[0];
  const resolvedSrc = typeof src === "string" && src.trim().length > 0 ? src.trim() : DEFAULT_VIDEO_URL;
  const isPlaying = videoRef.current ? !videoRef.current.paused : false;

  const overlayStyle = useMemo<CSSProperties>(() => ({ backdropFilter: "blur(2px)" }), []);

  const syncByTime = useCallback(() => {
    if (locked) return;
    const video = videoRef.current;
    if (!video || steps.length === 0) return;
    const current = video.currentTime;
    setCurrentTime(current);
    let nextIndex = 0;
    for (let i = 0; i < steps.length; i += 1) {
      if (current >= steps[i].time) nextIndex = i;
    }
    setActiveIndex(nextIndex);
  }, [locked, steps]);

  const triggerWarmUp = () => {
    const warmUp = new SpeechSynthesisUtterance("");
    warmUp.volume = 0;
    speechSynthesis.cancel();
    speechSynthesis.speak(warmUp);
    speechSynthesis.cancel();
  };

  const speak = useCallback(
    (note: string | null) => {
      if (!note) return;
      security.start(note);
    },
    [security],
  );

  const jumpTo = useCallback(
    async (index: number) => {
      if (locked) return;
      const step = steps[index];
      const video = videoRef.current;
      if (!step || !video || !document.contains(video)) return;
      video.currentTime = step.time;
      setActiveIndex(index);
      speak(step.safetyNote);
      try {
        await video.play();
      } catch {
        void 0;
      }
    },
    [locked, speak, steps],
  );

  const togglePlay = useCallback(async () => {
    if (locked) return;
    const video = videoRef.current;
    if (!video) return;
    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch {
      void 0;
    }
  }, [locked]);

  const handleStartExperiment = useCallback(() => {
    triggerWarmUp();
    const first = steps[0];
    if (first?.safetyNote) speak(first.safetyNote);
  }, [speak, steps]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && locked) security.forceUnlock();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [locked, security]);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 bg-[#FFF8EE] p-3 text-slate-800 md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] md:p-5" tabIndex={0}>
      <section className="flex flex-col gap-3">
        <header className="rounded-[28px] bg-white px-5 py-4 shadow-[0_10px_30px_rgba(244,114,22,0.08)]">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-500">移动端实验视频</div>
          <h1 className="mt-2 text-xl font-black text-slate-900 md:text-2xl">{title ?? "科学小实验"}</h1>
          <p className="mt-1 text-sm text-slate-500">点一下步骤卡片就能跳转，安全提示期间会自动锁定操作。</p>
        </header>

        <div className="relative overflow-hidden rounded-[32px] bg-black shadow-[0_18px_50px_rgba(15,23,42,0.22)]">
          <video
            ref={videoRef}
            src={resolvedSrc}
            poster={coverUrl}
            controls={false}
            controlsList="nodownload noplaybackrate noremoteplayback"
            disablePictureInPicture
            preload="metadata"
            className="aspect-video h-full w-full bg-black object-cover"
            onTimeUpdate={syncByTime}
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              setVideoDuration(Number.isFinite(video.duration) ? video.duration : duration ?? 0);
              setCurrentTime(video.currentTime);
            }}
            onError={(e) => {
              const video = e.currentTarget;
              const error = video.error;
              console.log("video error event", {
                code: error?.code ?? null,
                message: error ? `MediaError code=${error.code}` : "unknown media error",
                src: video.currentSrc || video.src || resolvedSrc,
                networkState: video.networkState,
                readyState: video.readyState,
              });
            }}
          />

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 pb-4 pt-10">
            <div className="flex items-center gap-3 rounded-[24px] bg-black/25 px-3 py-2 backdrop-blur-sm">
              <button
                type="button"
                onClick={togglePlay}
                disabled={locked}
                aria-label={isPlaying ? "暂停" : "播放"}
                className="grid min-h-[44px] min-w-[44px] place-items-center rounded-full bg-white/90 text-slate-900 transition active:scale-95 disabled:opacity-50"
              >
                <span className="text-xl font-black leading-none">{isPlaying ? "❚❚" : "▶"}</span>
              </button>

              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-white/80">
                  <span>{Math.floor(currentTime)}s</span>
                  <span>{Math.floor(videoDuration || duration || 0)}s</span>
                </div>
                <div className="flex items-center gap-2">
                  {steps.map((step, index) => {
                    const active = index === activeIndex;
                    return (
                      <button
                        key={`${step.title}-${step.time}`}
                        type="button"
                        onClick={() => jumpTo(index)}
                        disabled={locked}
                        aria-label={`跳转到步骤${index + 1}: ${step.title}`}
                        className={`h-4 w-4 rounded-full transition-all duration-200 ${active ? "scale-150 bg-orange-400 shadow-[0_0_0_6px_rgba(249,115,22,0.18)]" : currentTime >= step.time ? "bg-white" : "bg-white/45"} disabled:opacity-50`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {locked ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45" style={overlayStyle}>
              <div className="rounded-[24px] bg-white/90 px-5 py-4 text-center shadow-lg">
                <div className="text-sm font-black text-orange-600">安全播报中…</div>
                <div className="mt-1 text-2xl font-black text-slate-900">{security.countdown}s</div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <aside className="flex flex-col gap-3">
        <div className="rounded-[28px] bg-white p-4 shadow-[0_10px_30px_rgba(148,163,184,0.12)]">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">当前步骤</div>
          <div className="mt-2 text-lg font-extrabold text-slate-900">{activeStep?.title ?? "未开始"}</div>
          <p className="mt-2 text-sm leading-6 text-slate-500">{activeStep?.safetyNote ?? "本步骤暂无安全播报内容。"}</p>
          {typeof duration === "number" ? <p className="mt-2 text-xs text-slate-400">总时长 {duration}s</p> : null}
          {!security.isSupported ? <p className="mt-2 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">当前浏览器不支持语音播报，请手动确认安全提示后继续。</p> : null}
          {fallbackPrompt ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-[32px] border border-white/30 bg-white/92 p-6 text-center shadow-2xl">
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">安全提示</div>
                <div className="mt-4 text-[32px] font-black leading-tight text-slate-950 md:text-[40px]">{fallbackPrompt}</div>
                <button
                  type="button"
                  onClick={() => {
                    security.manuallyConfirmSafety();
                    setFallbackPrompt(null);
                  }}
                  className="mt-6 min-h-[48px] w-full rounded-full bg-orange-500 px-4 py-3 text-base font-black text-white shadow-lg shadow-orange-500/25"
                >
                  我知道了，继续
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-[28px] bg-white p-4 shadow-[0_10px_30px_rgba(148,163,184,0.12)]">
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">进度</div>
          <div className="flex items-center justify-between gap-2">
            {steps.map((step, index) => {
              const active = index === activeIndex;
              return (
                <button
                  key={`${step.title}-${step.time}`}
                  type="button"
                  onClick={() => jumpTo(index)}
                  disabled={locked}
                  aria-label={`跳转到步骤${index + 1}: ${step.title}`}
                  className={`h-4 w-4 rounded-full transition-all duration-200 ${active ? "scale-150 bg-orange-500 shadow-[0_0_0_6px_rgba(249,115,22,0.14)]" : "bg-slate-300"} disabled:opacity-50`}
                />
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const active = index === activeIndex;
            return (
              <button
                key={`${step.title}-${step.time}`}
                onClick={() => jumpTo(index)}
                disabled={locked}
                className={`mx-auto block w-[80vw] max-w-none rounded-[30px] border p-5 text-left transition-all duration-200 active:scale-[0.98] ${active ? "border-orange-400 bg-orange-50 shadow-[0_12px_28px_rgba(251,146,60,0.18)]" : "border-slate-200 bg-white hover:scale-[0.99] hover:bg-slate-50"} disabled:opacity-60`}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Step {index + 1}</div>
                    <div className="mt-2 text-xl font-black text-slate-900">{step.title}</div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{step.time}s</span>
                </div>
                {step.safetyNote ? <p className="mt-4 rounded-2xl bg-orange-100 px-4 py-3 text-base leading-7 text-orange-900">{step.safetyNote}</p> : <p className="mt-4 text-sm text-slate-400">暂无安全提示</p>}
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
