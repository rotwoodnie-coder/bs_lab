"use client";

import * as React from "react";

/** 与实验详情页约定一致：<768 移动端；768–1023 平板；≥1024 桌面。 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  React.useEffect(() => {
    const m = window.matchMedia(query);
    const onChange = () => setMatches(m.matches);
    onChange();
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

export function useExperimentHubBreakpoints() {
  const isLg = useMediaQuery("(min-width: 1024px)");
  const isMd = useMediaQuery("(min-width: 768px)");
  const isMobile = !isMd;
  const isTablet = isMd && !isLg;
  const isDesktop = isLg;
  /** 与实验详情约定一致：平板宽度段 + 横屏（侧栏可折叠为 Sheet） */
  const isTabletLandscape = useMediaQuery(
    "(min-width: 768px) and (max-width: 1023px) and (orientation: landscape)",
  );
  return { isMobile, isTablet, isDesktop, isTabletLandscape };
}
