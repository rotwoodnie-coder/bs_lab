"use client";

import { Button, sonnerToast } from "@bs-lab/ui";
import { Copy } from "@bs-lab/ui/icons";

export function ExperimentCatalogCopyId(props: { value: string; label?: string }) {
  const copy = () => {
    void navigator.clipboard.writeText(props.value).then(
      () => sonnerToast.success(props.label ? `已复制${props.label}` : "已复制"),
      () => sonnerToast.error("复制失败"),
    );
  };
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7 shrink-0 text-muted-foreground"
      title="复制内部 id（排障）"
      aria-label="复制内部 id"
      onClick={() => copy()}
    >
      <Copy className="size-3.5" />
    </Button>
  );
}
