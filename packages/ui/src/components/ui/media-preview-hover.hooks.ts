"use client";

import * as React from "react";

/** 全局互斥：同时仅允许一路 hover 预览挂载真实 video，避免多路解码。 */
let activeCleanup: (() => void) | null = null;

export function takeHoverVideoPlayLock(cleanup: () => void): void {
  if (activeCleanup && activeCleanup !== cleanup) {
    activeCleanup();
  }
  activeCleanup = cleanup;
}

export function releaseHoverVideoPlayLock(cleanup: () => void): void {
  if (activeCleanup === cleanup) {
    activeCleanup = null;
  }
}

function subscribeReducedMotion(cb: () => void): () => void {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function subscribeCoarseOrNoHover(cb: () => void): () => void {
  const mq1 = window.matchMedia("(hover: none)");
  const mq2 = window.matchMedia("(pointer: coarse)");
  const fn = () => cb();
  mq1.addEventListener("change", fn);
  mq2.addEventListener("change", fn);
  return () => {
    mq1.removeEventListener("change", fn);
    mq2.removeEventListener("change", fn);
  };
}

/** 移动端 / 触控主路径：不启用悬停自动预览，仅展示静态层。 */
export function useMobileStaticPoster(): boolean {
  return React.useSyncExternalStore(
    subscribeCoarseOrNoHover,
    () => window.matchMedia("(hover: none)").matches || window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );
}

/** 传入已挂载的 DOM 节点；节点为 null 时视为不可见。 */
export function useInViewElement(
  el: HTMLElement | null,
  rootMargin = "120px",
  threshold: number | number[] = 0.01,
): boolean {
  const [ok, setOk] = React.useState(false);

  React.useEffect(() => {
    if (!el) {
      setOk(false);
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      setOk(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        setOk(Boolean(e?.isIntersecting));
      },
      { root: null, rootMargin, threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [el, rootMargin, threshold]);

  return ok;
}
