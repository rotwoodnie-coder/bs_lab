import * as React from "react";

export type UseEditorCanvasArgs = {
  anchors: readonly { id: string }[];
  defaultAnchorId?: string;
  /**
   * 是否启用滚动监听（scroll spy）自动切换 activeAnchorId。
   * Tab 容器场景下 IntersectionObserver 容易与用户手动切换冲突，默认关闭。
   */
  enableScrollSpy?: boolean;
};

export function useEditorCanvas({ anchors, defaultAnchorId, enableScrollSpy = false }: UseEditorCanvasArgs) {
  const initialId = defaultAnchorId ?? anchors[0]?.id ?? "subject";

  const [activeAnchorId, setActiveAnchorId] = React.useState<string>(initialId);
  const [expandedSectionId, setExpandedSectionId] = React.useState<string>(initialId);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const onNavigateAnchor = React.useCallback((id: string) => {
    if (!id) return;
    setActiveAnchorId(id);
    setExpandedSectionId(id);
  }, []);

  React.useEffect(() => {
    if (!enableScrollSpy) return;
    if (typeof window === "undefined") return;
    const ids = anchors.map((a) => a.id);
    const all = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    // Tab 模式下非激活面板通常仍在 DOM，但不可见；仅对“可见元素”启用 scroll spy，避免反向覆盖用户点击目标。
    const elements = all.filter((el) => el.getClientRects().length > 0 && (el as any).offsetParent !== null);
    if (elements.length <= 1) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const sorted = [...visible].sort((a, b) => {
          const at = Math.abs(a.boundingClientRect.top);
          const bt = Math.abs(b.boundingClientRect.top);
          return at - bt;
        });
        const nextId = sorted[0]?.target instanceof HTMLElement ? sorted[0].target.id : undefined;
        if (!nextId) return;
        setActiveAnchorId((prev) => (prev === nextId ? prev : nextId));
      },
      { root: null, threshold: [0.2, 0.35, 0.5], rootMargin: "0px 0px -65% 0px" },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [anchors, enableScrollSpy]);

  return {
    activeAnchorId,
    expandedSectionId,
    mobileNavOpen,
    setExpandedSectionId,
    setMobileNavOpen,
    onNavigateAnchor,
  };
}

