"use client";

import * as React from "react";

/** 与产品约定一致：低高度横屏时侧栏改为顶部 Chips，为表单腾出纵向空间 */
const LANDSCAPE_SHORT_NAV_MQ = "(max-height: 500px) and (orientation: landscape)";

export function useLandscapeShortNav(): boolean {
  const [match, setMatch] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(LANDSCAPE_SHORT_NAV_MQ);
    const apply = () => setMatch(Boolean(mq.matches));
    apply();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
    mq.addListener(apply);
    return () => mq.removeListener(apply);
  }, []);

  return match;
}
