"use client";

import * as React from "react";
import { Button } from "@bs-lab/ui";
import { ArrowUp } from "@bs-lab/ui/icons";

type Props = {
  count: number;
  visible: boolean;
  onClick: () => void;
};

/** 新素材浮动提示条：固定在表格顶部，点击后滚动至顶部并刷新列表 */
export function FloatingNewItemsBar({ count, visible, onClick }: Props) {
  if (!visible || count <= 0) return null;

  return (
    <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
      <Button
        type="button"
        variant="default"
        size="sm"
        className="animate-in fade-in slide-in-from-top-1 rounded-full px-4 shadow-lg duration-300"
        onClick={onClick}
      >
        <ArrowUp className="mr-1 h-3.5 w-3.5" />
        检测到 {count} 个新素材
      </Button>
    </div>
  );
}
