"use client";

import * as React from "react";

import { cn } from "../../lib/utils";
import { ScrollArea } from "./scroll-area";

type ScrollAreaProps = React.ComponentProps<typeof ScrollArea>;

export type ScrollAreaWithTopEdgeProps = ScrollAreaProps & {
  /** 顶部渐变提示与内容同一主题表面 */
  fadeFromClassName?: string;
};

/**
 * 在 ScrollArea 顶部叠加渐变 + 轻度顶缘内阴影：下滚后提示上方仍有内容（评审双栏等场景）。
 */
export function ScrollAreaWithTopEdge({
  className,
  children,
  fadeFromClassName = "from-background/95 via-background/45",
  ...scrollProps
}: ScrollAreaWithTopEdgeProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const viewport = root.querySelector(
      '[data-slot="scroll-area-viewport"]',
    ) as HTMLElement | null;
    if (!viewport) return;
    const onScroll = () => setScrolled(viewport.scrollTop > 6);
    viewport.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => viewport.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-0">
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-20 h-10 bg-gradient-to-b to-transparent opacity-0 shadow-[inset_0_14px_22px_-12px_color-mix(in_oklab,var(--color-foreground)_12%,transparent)] transition-opacity duration-200",
          fadeFromClassName,
          scrolled && "opacity-100",
        )}
        aria-hidden
      />
      <ScrollArea ref={rootRef} className={className} {...scrollProps}>
        {children}
      </ScrollArea>
    </div>
  );
}
