"use client";

import * as React from "react";

/** 竖屏（用于移动端首屏安全弹层仅竖屏强制） */
export function useIsPortrait(): boolean | undefined {
  const [portrait, setPortrait] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)");
    const sync = () => setPortrait(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return portrait;
}
