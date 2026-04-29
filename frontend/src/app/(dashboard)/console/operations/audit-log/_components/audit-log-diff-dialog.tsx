"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@bs-lab/ui";
import type { ConsoleAuditLogRow } from "@/lib/console-audit-log";

export function DiffDialog({
  open,
  onOpenChange,
  row,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  row: ConsoleAuditLogRow | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] max-w-3xl overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-base">Payload 对比</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {row?.id} · {row?.targetId}
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[min(60vh,520px)] gap-3 overflow-auto sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">操作前</p>
            <pre className="max-h-60 overflow-auto rounded-md border border-border bg-muted/40 p-2 text-[11px] leading-relaxed whitespace-pre-wrap break-all">
              {row?.payloadBefore?.trim() ? row.payloadBefore : "—"}
            </pre>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">操作后</p>
            <pre className="max-h-60 overflow-auto rounded-md border border-border bg-muted/40 p-2 text-[11px] leading-relaxed whitespace-pre-wrap break-all">
              {row?.payloadAfter?.trim() ? row.payloadAfter : "—"}
            </pre>
          </div>
        </div>
        {row?.rejectionReason ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-xs font-medium text-destructive">驳回理由</p>
            <p className="mt-1 text-sm text-foreground">{row.rejectionReason}</p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
