"use client";

import * as React from "react";
import { motion } from "framer-motion";

import type { AppViewMode } from "@/config/nav-config";

/** 视图模式切换时主内容区 opacity + scale 转场（首屏不播放）。 */
export function ViewModeMainTransition({
  viewMode,
  className,
  children,
}: {
  viewMode: AppViewMode;
  className?: string;
  children: React.ReactNode;
}) {
  const afterFirstPaint = React.useRef(false);
  React.useLayoutEffect(() => {
    afterFirstPaint.current = true;
  }, []);

  return (
    <motion.div
      key={viewMode}
      className={className}
      initial={
        afterFirstPaint.current
          ? { opacity: 0.88, scale: 0.988 }
          : false
      }
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </motion.div>
  );
}
