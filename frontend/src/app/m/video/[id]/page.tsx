"use client";

import { useParams } from "next/navigation";
import { VideoPlayer } from "@/components/mobile/VideoPlayer";
import type { VideoStep } from "@/components/mobile/VideoPlayer";

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

export default function MobileVideoPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "1";
  const data = VIDEO_LIBRARY[id] ?? VIDEO_LIBRARY["1"];

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
