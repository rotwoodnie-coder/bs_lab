"use client";

import { Button } from "@bs-lab/ui";

import type { EduTextbookListItem } from "@/lib/edu-textbooks-api";

export function EduTextbookMixedList(props: {
  items: EduTextbookListItem[];
  canWrite: boolean;
  busyId: string | null;
  onDuplicate: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {props.items.map((item) => (
        <div
          key={item.id}
          className="flex gap-3 rounded-lg border border-border bg-card p-3 text-left shadow-none"
        >
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground"
            aria-hidden
          >
            无封面
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">{item.subjectName ?? item.subjectId ?? ""}</p>
              <p className="text-sm font-medium leading-snug text-foreground">{item.title}</p>
            </div>
            {props.canWrite ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={props.busyId === item.id}
                onClick={() => props.onDuplicate(item.id)}
              >
                复制整书
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
