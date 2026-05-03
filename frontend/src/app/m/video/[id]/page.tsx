"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { VideoPlayer } from "@/components/mobile/VideoPlayer";
import type { VideoStep } from "@/components/mobile/VideoPlayer";
import { buildApiUrl } from "@/lib/core-api-shared";

const DEFAULT_VIDEO_URL = "https://www.w3schools.com/html/mov_bbb.mp4";

/** 降级静态数据 */
const VIDEO_LIBRARY: Record<string, { title: string; url: string; coverUrl: string; duration: number; steps: VideoStep[] }> = {
  "1": {
    title: "安全实验：彩虹液体分层",
    url: "https://www.w3schools.com/html/mov_bbb.mp4",
    coverUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80",
    duration: 120,
    steps: [
      { time: 0, title: "准备材料", safetyNote: null },
      { time: 30, title: "加热液体", safetyNote: "请注意高温，佩戴防护手套，避免烫伤。" },
      { time: 60, title: "混合试剂", safetyNote: "请在通风处操作，避免直接闻气味。" },
      { time: 90, title: "观察结果", safetyNote: null },
    ],
  },
  "2": {
    title: "科学实验：气球火箭",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    coverUrl: "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?auto=format&fit=crop&w=1200&q=80",
    duration: 120,
    steps: [
      { time: 0, title: "固定轨道", safetyNote: null },
      { time: 30, title: "充气准备", safetyNote: "请勿将气球对准脸部，避免突然弹出。" },
      { time: 60, title: "释放火箭", safetyNote: "保持手臂伸直，确保周围没有障碍物。" },
      { time: 90, title: "记录距离", safetyNote: null },
    ],
  },
};

type ExpVideoRow = { videoUrl: string | null };
type ExpStepRow = { stepName: string | null; stepComments: string | null; sortOrder: number | null };

type ExpDetailPayload = {
  expName?: string;
  logoUrl?: string | null;
  coverVideoUrl?: string | null;
  classHour?: number | null;
  videos?: ExpVideoRow[];
  steps?: ExpStepRow[];
  expCaution?: string | null;
};

type Envelope = { success: boolean; data: unknown };

/** 从后端步进记录 + 安全提示 映射为 VideoStep[] */
function mapSteps(steps: ExpStepRow[], caution: string | null, duration: number): VideoStep[] {
  if (steps.length === 0) {
    return [{ time: 0, title: "开始实验", safetyNote: caution }];
  }
  const segCount = steps.length;
  const segDuration = segCount > 0 ? Math.floor(duration / segCount) : duration;
  return steps.map((step, index) => ({
    time: index * segDuration,
    title: step.stepName ?? `步骤 ${index + 1}`,
    safetyNote: step.stepComments ?? (index === 0 ? caution : null),
  }));
}

async function fetchExpDetail(expId: string): Promise<{
  title: string;
  url: string;
  coverUrl: string;
  duration: number;
  steps: VideoStep[];
}> {
  const res = await fetch(buildApiUrl(`/v2/exp/${encodeURIComponent(expId)}`), { credentials: "include" });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const json = await res.json();
  const data = json?.data as ExpDetailPayload | undefined;
  if (!data) throw new Error("empty response data");

  const title = data.expName ?? "科学实验";
  const firstVideo = data.videos?.[0];
  const url = firstVideo?.videoUrl ?? DEFAULT_VIDEO_URL;
  const coverUrl = data.logoUrl ?? data.coverVideoUrl ?? "";
  const duration = (data.classHour ?? 1) * 60;
  const steps = mapSteps(data.steps ?? [], data.expCaution ?? null, duration);

  return { title, url, coverUrl, duration, steps };
}

export default function MobileVideoPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "1";
  const [remote, setRemote] = useState<{
    title: string;
    url: string;
    coverUrl: string;
    duration: number;
    steps: VideoStep[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchExpDetail(id).then((detail) => {
      if (!cancelled) setRemote(detail);
    }).catch(() => {
      // 请求失败 → 降级到静态数据
      if (!cancelled) setRemote(null);
    });
    return () => { cancelled = true; };
  }, [id]);

  const fallback = VIDEO_LIBRARY[id] ?? VIDEO_LIBRARY["1"];
  const data = remote ?? fallback;

  return (
    <VideoPlayer
      videoId={id}
      title={data.title}
      src={data.url}
      coverUrl={data.coverUrl}
      steps={data.steps}
      duration={data.duration}
    />
  );
}
