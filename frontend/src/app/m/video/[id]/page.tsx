"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { VideoPlayer } from "@/components/mobile/VideoPlayer";
import type { VideoStepItem } from "@/state/video-step-machine";

type VideoData = {
  id: string;
  title: string;
  videoUrl: string;
  coverUrl: string;
  duration: number;
  steps: VideoStepItem[];
};

export default function MobileVideoPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<VideoData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    void fetch(`/api/video/${encodeURIComponent(id)}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((json) => {
        const d: VideoData = json.data ?? json;
        if (!d) throw new Error("No data");
        setData(d);
      })
      .catch(() => setError(true));
  }, [id]);

  if (error) return <div className="p-4 text-sm text-muted-foreground">视频未找到</div>;
  if (!data) return <div className="p-4 text-sm text-muted-foreground">加载中...</div>;

  return <VideoPlayer src={data.videoUrl ?? ""} steps={data.steps ?? []} videoId={id} />;
}
