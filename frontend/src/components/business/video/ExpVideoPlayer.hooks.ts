"use client";

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

export type { PlayerVisualStatus } from "./exp-video-player.types";

export function useStandardVideoExpPlayer(props: StandardVideoExpPlayerProps) {
  const { src, poster, ratio = 16 / 9, title = "视频", rasterPosterCapture = "eager", posterPersist, contentStartSeconds } =
    props;
  const trimmedSrc = src.trim();
  const propPoster = poster?.trim() ?? "";

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

  const { onMouseEnter, onMouseLeave, goActive } = useExpVideoListInteractions(
    st.status,
    st.setStatus,
    st.bumpVideoKey,
  );

  useExpVideoPlaybackSync(st.videoRef, st.mountVideo, st.isPreview, st.status, st.videoKey);
  useExpVideoContentStartSeek(
    st.videoRef,
    st.mountVideo,
    contentStartSeconds == null ? undefined : contentStartSeconds,
    st.isPreview,
    st.videoKey,
  );

  return {
    rootRef: st.rootRef,
    trimmedSrc,
    ratio,
    title,
    status: st.status,
    mountVideo: st.mountVideo,
    isPreview: st.isPreview,
    isActive: st.isActive,
    imgSrc,
    posterFailed: st.posterFailed,
    setPosterFailed: st.setPosterFailed,
    capturePhase: st.capturePhase,
    videoRef: st.videoRef,
    videoKey: st.videoKey,
    onMouseEnter,
    onMouseLeave,
    goActive,
    className: props.className,
  };
}
