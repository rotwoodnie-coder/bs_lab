import * as React from "react";

import { useEditorCanvas } from "./use-editor-canvas";

export function useCanvasState(anchors: readonly { id: string }[]) {
  // 编辑器为 Tab 容器布局；关闭 scroll spy，避免 IntersectionObserver 抢回 activeAnchorId 导致 Tab 自动跳转。
  const nav = useEditorCanvas({ anchors, enableScrollSpy: false });
  const [zoom, setZoom] = React.useState(1);
  const [selectedElementId, setSelectedElementId] = React.useState<string | null>(null);
  const [stageOffset, setStageOffset] = React.useState({ x: 0, y: 0 });

  const resetView = React.useCallback(() => {
    setZoom(1);
    setStageOffset({ x: 0, y: 0 });
    setSelectedElementId(null);
  }, []);

  return {
    ...nav,
    zoom,
    setZoom,
    selectedElementId,
    setSelectedElementId,
    stageOffset,
    setStageOffset,
    resetView,
  };
}

