"use client";

import * as React from "react";

export type VideoReviewStatus = "pending" | "published" | "flagged" | "offline";
export type VideoQuality = "4k" | "1080p" | "720p" | "unknown";
export type VideoActionTag = "" | "讲解" | "错误纠正" | "特写" | "学生操作" | "安全规范";

export type VideoCoverRecognition = {
  /** 视频系列（封面左上角） */
  series?: string;
  /** 实验名称（封面中间最大区域） */
  experimentName?: string;
  /** 学科（封面第三行） */
  subject?: string;
  /** 年级（封面第三行） */
  grade?: string;
  /** 主讲人（封面第四行） */
  speaker?: string;
  /** 学校（封面第四行） */
  school?: string;
  matchedExperimentId?: string;
  matchedExperimentTitle?: string;
  matchConfidence?: number;
  recognizedAt?: string;
};

export type VideoMeta = {
  /** 强关联（可空：不一定能匹配到实验列表） */
  experimentId?: string | null;
  /** 自动硬标签：来自实验列表时写入 */
  hard?: {
    subjectLabel?: string;
    gradeLabels?: string[];
  };
  /** 内容标签（弱关联） */
  content?: {
    action?: VideoActionTag | null;
    devices?: string[];
    keywords?: string[];
  };
  /** 运维标签（弱关联） */
  ops?: {
    reviewStatus?: VideoReviewStatus;
    quality?: VideoQuality;
  };
  /** 供推荐/审计用 */
  updatedAt?: string;
  /** AI/人工封面结构化识别结果（当前阶段先前端落库，后端待接入） */
  coverRecognition?: VideoCoverRecognition;
  /** AI 切片 / 人工步骤切片绑定（stepId -> second） */
  stepSlices?: Record<string, number>;
};

type StoreShape = Record<string, VideoMeta>;
let inMemoryStore: StoreShape = {};

function safeParse(raw: string | null): StoreShape {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as StoreShape;
  } catch {
    return {};
  }
}

export function videoMetaKey(opts: { rowId?: string | null; videoId: string }): string {
  return `${opts.rowId ?? "global"}::${opts.videoId}`;
}

export function readVideoMeta(key: string): VideoMeta | null {
  return inMemoryStore[key] ?? null;
}

export function writeVideoMeta(key: string, next: VideoMeta | null) {
  const store = { ...inMemoryStore };
  if (!next) {
    delete store[key];
  } else {
    store[key] = { ...next, updatedAt: new Date().toISOString() };
  }
  inMemoryStore = store;
}

export function patchVideoMeta(key: string, patch: Partial<VideoMeta>) {
  const prev = readVideoMeta(key) ?? {};
  writeVideoMeta(key, { ...prev, ...patch });
}

export function useVideoMeta(opts: { rowId?: string | null; videoId?: string | null }) {
  const key = React.useMemo(() => {
    if (!opts.videoId) return null;
    return videoMetaKey({ rowId: opts.rowId, videoId: opts.videoId });
  }, [opts.rowId, opts.videoId]);

  const [meta, setMeta] = React.useState<VideoMeta | null>(() => (key ? readVideoMeta(key) : null));

  React.useEffect(() => {
    if (!key) return;
    setMeta(readVideoMeta(key));
  }, [key]);

  const update = React.useCallback(
    (next: VideoMeta) => {
      if (!key) return;
      writeVideoMeta(key, next);
      setMeta(next);
    },
    [key],
  );

  const patch = React.useCallback(
    (p: Partial<VideoMeta>) => {
      if (!key) return;
      patchVideoMeta(key, p);
      setMeta(readVideoMeta(key));
    },
    [key],
  );

  return { key, meta, setMeta: update, patchMeta: patch };
}

