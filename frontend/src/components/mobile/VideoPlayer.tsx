"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [isReady, setIsReady] = useState(false);
  const [fallbackPrompt, setFallbackPrompt] = useState<string | null>(null);
  const security = useVideoSecurity({ onFallbackPrompt: setFallbackPrompt });
  const locked = security.isLocked;
  const activeStep = steps[activeIndex] ?? steps[0];
  const resolvedSrc = typeof src === "string" && src.trim().length > 0 ? src.trim() : DEFAULT_VIDEO_URL;

  const overlayStyle = useMemo<CSSProperties>(() => ({ backdropFilter: "blur(2px)" }), []);

  const syncByTime = () => {
    if (locked) return;
    const video = videoRef.current;
    if (!video || steps.length === 0) return;
    const current = video.currentTime;
    let nextIndex = 0;
    for (let i = 0; i < steps.length; i += 1) {
      if (current >= steps[i].time) nextIndex = i;
    }
    setActiveIndex(nextIndex);
  };

  const speak = (note: string | null) => {
    if (!note) return;
    security.start(note);
  };

  const jumpTo = (index: number) => {
    if (locked) return;
    const step = steps[index];
    const video = videoRef.current;
    if (!step || !video) return;
    video.currentTime = step.time;
    void video.play();
    setActiveIndex(index);
    speak(step.safetyNote);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (locked) {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
      }
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      jumpTo(Math.max(0, activeIndex - 1));
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      jumpTo(Math.min(steps.length - 1, activeIndex + 1));
    }
  };

  useEffect(() => {
    if (!isReady) return;
    const video = videoRef.current;
    console.log("video src:", video?.src, "networkState:", video?.networkState);
    const first = steps[0];
    if (first?.safetyNote) speak(first.safetyNote);
  }, [isReady]);

  useEffect(() => {
    const videoEl = document.querySelector("video");
    if (videoEl) {
      console.log("=== Video 元素诊断 (自动) ===");
      console.log("src:", videoEl.src);
      console.log("currentSrc:", videoEl.currentSrc);
      console.log("networkState:", videoEl.networkState, "(0=EMPTY, 1=IDLE, 2=LOADING, 3=NO_SOURCE)");
      console.log("readyState:", videoEl.readyState);
      console.log("error:", videoEl.error);
      console.log("outerHTML 前200字符:", videoEl.outerHTML?.substring(0, 200));
    } else {
      console.log("页面上没有找到 <video> 元素！");
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && locked) {
        security.forceUnlock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [locked, security]);

  return (
    <div
      className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 bg-[#FFF8EE] p-3 text-slate-800 md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] md:p-5"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <section className="flex flex-col gap-3">
        <header className="rounded-[28px] bg-white px-5 py-4 shadow-[0_10px_30px_rgba(244,114,22,0.08)]">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-500">移动端实验视频</div>
          <h1 className="mt-2 text-xl font-black text-slate-900 md:text-2xl">{title ?? "科学小实验"}</h1>
          <p className="mt-1 text-sm text-slate-500">点击步骤卡片可直接跳转，安全提示会在本地语音播报期间自动锁定操作。</p>
        </header>

        <div className="relative overflow-hidden rounded-[32px] bg-black shadow-[0_18px_50px_rgba(15,23,42,0.22)]">
          <video
            ref={videoRef}
            src={resolvedSrc}
            poster={coverUrl}
            controls={!locked}
            controlsList={locked ? "nodownload noplaybackrate noremoteplayback" : undefined}
            disablePictureInPicture={locked}
            preload="metadata"
            className="aspect-video h-full w-full bg-black object-cover"
            onTimeUpdate={syncByTime}
            onLoadedMetadata={() => setIsReady(true)}
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
            onSeeking={(event) => {
              if (locked) {
                event.preventDefault();
                const video = event.currentTarget;
                video.currentTime = steps[activeIndex]?.time ?? 0;
              }
            }}
          />
          {locked ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45" style={overlayStyle}>
              <div className="rounded-[24px] bg-white/90 px-5 py-4 text-center shadow-lg">
                <div className="text-sm font-black text-orange-600">安全播报中…</div>
                <div className="mt-1 text-2xl font-black text-slate-900">{security.countdown}s</div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex gap-3 md:hidden">
          <button onClick={() => jumpTo(Math.max(0, activeIndex - 1))} disabled={locked || activeIndex === 0} className="flex-1 rounded-full bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm disabled:opacity-50">
            上一步
          </button>
          <button onClick={() => jumpTo(Math.min(steps.length - 1, activeIndex + 1))} disabled={locked || activeIndex >= steps.length - 1} className="flex-1 rounded-full bg-orange-500 px-4 py-3 text-sm font-black text-white shadow-sm disabled:opacity-50">
            下一步
          </button>
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
            <div className="mt-3 rounded-2xl bg-orange-50 px-3 py-3 text-sm leading-6 text-orange-800">
              <div>{fallbackPrompt}</div>
              <button
                type="button"
                onClick={() => {
                  security.manuallyConfirmSafety();
                  setFallbackPrompt(null);
                }}
                className="mt-3 rounded-full bg-orange-500 px-4 py-2 text-xs font-bold text-white"
              >
                我已阅读安全提示
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex gap-3 md:flex-row">
          <button onClick={() => jumpTo(Math.max(0, activeIndex - 1))} disabled={locked || activeIndex === 0} className="hidden flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition disabled:opacity-50 md:block">
            上一步
          </button>
          <button onClick={() => jumpTo(Math.min(steps.length - 1, activeIndex + 1))} disabled={locked || activeIndex >= steps.length - 1} className="hidden flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 md:block">
            下一步
          </button>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const active = index === activeIndex;
            return (
              <button
                key={`${step.title}-${step.time}`}
                onClick={() => jumpTo(index)}
                disabled={locked}
                className={`w-full rounded-[26px] border p-4 text-left transition ${active ? "border-orange-400 bg-orange-50 shadow-[0_8px_24px_rgba(251,146,60,0.16)]" : "border-slate-200 bg-white hover:bg-slate-50"} disabled:opacity-60`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Step {index + 1}</div>
                    <div className="mt-1 text-base font-extrabold text-slate-900">{step.title}</div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{step.time}s</span>
                </div>
                {step.safetyNote ? <p className="mt-3 rounded-2xl bg-orange-100 px-3 py-2 text-sm leading-6 text-orange-800">{step.safetyNote}</p> : <p className="mt-3 text-sm text-slate-400">暂无安全提示</p>}
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
