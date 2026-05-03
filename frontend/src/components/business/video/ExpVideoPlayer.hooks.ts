"use client";

import * as React from "react";

import type { StandardVideoExpPlayerProps } from "./exp-video-player.types";
import { useExpVideoListInteractions } from "./exp-video-player-interaction";
import { useExpVideoContentStartSeek } from "./exp-video-player-content-start";
import {
  useExpVideoPlaybackSync,
  useExpVideoPosterResetOnSrcChange,
  useExpVideoStreamRasterCapture,
  useExpVideoVisibleGate,
} from "./exp-video-player-poster-effects";
import { useExpVideoPosterPersist } from "./exp-video-player-poster-persist";
import { useExpVideoBaseState } from "./exp-video-player-state";

function useExpId(src: string): string {
  return React.useId() + ":" + src;
}

export function useStandardVideoExpPlayer(props: StandardVideoExpPlayerProps) {
  const { src, poster, ratio = 16 / 9, title = "视频", rasterPosterCapture = "eager", posterPersist, contentStartSeconds, onPlayRequest } =
    props;
  const trimmedSrc = src.trim();
  const propPoster = poster?.trim() ?? "";
  const expId = useExpId(trimmedSrc);

  const st = useExpVideoBaseState(rasterPosterCapture);
  const imgSrc = propPoster || st.livePoster;

  useExpVideoPosterResetOnSrcChange(trimmedSrc, rasterPosterCapture, st.resetOnSrc);
  useExpVideoVisibleGate(st.rootRef, rasterPosterCapture, trimmedSrc, st.setViewportOk);
  useExpVideoStreamRasterCapture(
    trimmedSrc,
    propPoster,
    rasterPosterCapture,
    st.viewportOk,
    st.setLivePoster,
    st.setCapturePhase,
  );

  useExpVideoPosterPersist(posterPersist ?? null, st.livePoster, propPoster, trimmedSrc, st.setLivePoster);

  // 注：延时加载封面—未进入视口前不请求封面图，减少首屏并发请求数
  const [posterInView, setPosterInView] = React.useState(false);
  React.useEffect(() => {
    const el = st.rootRef.current;
    if (!el) return;
    if (el.getBoundingClientRect().top < window.innerHeight + 200) {
      setPosterInView(true);
      return;
    }
    const ob = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPosterInView(true);
          ob.disconnect();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.01 },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [st.rootRef, trimmedSrc]);

  const { goActive, cleanup } = useExpVideoListInteractions(
    expId,
    st.status,
    st.setStatus,
    st.bumpVideoKey,
  );

  // 组件卸载时释放全局锁
  React.useEffect(() => cleanup, [cleanup]);

  // 注：有 onPlayRequest 时，播放点击转调父级（如打开弹窗），同时卡片回 poster 态
  const handlePlayRequest = React.useCallback(() => {
    if (onPlayRequest) {
      onPlayRequest();
      st.setStatus("poster");
      st.bumpVideoKey();
      cleanup();
      return;
    }
    goActive();
  }, [onPlayRequest, goActive, cleanup, st.setStatus, st.bumpVideoKey]);

  useExpVideoPlaybackSync(st.videoRef, st.mountVideo, st.status, st.videoKey);
  useExpVideoContentStartSeek(
    st.videoRef,
    st.mountVideo,
    contentStartSeconds == null ? undefined : contentStartSeconds,
    st.videoKey,
  );

  return {
    rootRef: st.rootRef,
    trimmedSrc,
    ratio,
    title,
    status: st.status,
    mountVideo: st.mountVideo,
    isActive: st.isActive,
    imgSrc,
    posterFailed: st.posterFailed,
    setPosterFailed: st.setPosterFailed,
    capturePhase: st.capturePhase,
    posterInView,
    videoRef: st.videoRef,
    videoKey: st.videoKey,
    goActive: handlePlayRequest,
    className: props.className,
  };
}
