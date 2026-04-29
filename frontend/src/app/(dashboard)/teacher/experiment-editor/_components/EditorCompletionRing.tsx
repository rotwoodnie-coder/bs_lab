import * as React from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@bs-lab/ui";

type AnchorItem = { id: string; label: string; progressPct?: number; completed?: boolean };

export function EditorCompletionRing(props: { completionPct: number; anchors: AnchorItem[] }) {
  const missing = React.useMemo(
    () => props.anchors.filter((anchor) => !anchor.completed),
    [props.anchors],
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="h-auto px-2 py-1.5">
          <span className="relative inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-[10px] font-medium">
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(var(--color-primary) ${props.completionPct}%, transparent ${props.completionPct}% 100%)`,
              }}
            />
            <span className="absolute inset-[2px] rounded-full bg-background" />
            <span className="relative z-10 text-xs text-foreground">{Math.round(props.completionPct)}%</span>
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>待补全项清单</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {missing.length === 0 ? (
            <p className="text-sm text-status-success">已全部完成，可以直接提交审核。</p>
          ) : (
            missing.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <span>{item.label}</span>
                <span className="text-muted-foreground">{Math.round(item.progressPct ?? 0)}%</span>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

