"use client";

import * as React from "react";
import {
  Badge,
  Button,
  ScrollArea,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Switch,
  TabSwitcher,
  sonnerToast,
} from "@bs-lab/ui";
import { Mail } from "@bs-lab/ui/icons";

import { readInboxOverlayMessages, subscribeInboxOverlay } from "@/lib/inbox-overlay-mock-store";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";
import type { InboxMessage, InboxMessageCategory } from "@/types/inbox-message";
import { INBOX_CATEGORY_LABEL } from "@/types/inbox-message";
import { useSessionActor } from "@/hooks/use-session-actor";

const DEMO_INBOX_USER_NAME: Record<UserRole, string> = {
  Role_Student: "学生",
  Role_Parent: "家长",
  Role_Teacher: "教师",
  Role_Researcher: "教研员",
  Role_School_Admin: "校管",
  Role_District_Admin: "区管",
  Role_Sys_Admin: "超管",
};

type FilterCategory = "all" | InboxMessageCategory;

const TAB_ITEMS: { id: FilterCategory; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "system", label: "系统" },
  { id: "task", label: "任务" },
  { id: "social", label: "社交" },
  { id: "homework", label: "作业" },
];

function categoryBadgeClass(category: InboxMessageCategory): string {
  switch (category) {
    case "system":
      return "border-border bg-muted/60 text-foreground";
    case "task":
      return "border-amber-300/50 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-200";
    case "social":
      return "border-sky-300/50 bg-sky-50 text-sky-800 dark:border-sky-400/30 dark:bg-sky-950/30 dark:text-sky-200";
    case "homework":
      return "border-emerald-300/50 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-950/30 dark:text-emerald-200";
  }
}

const DEMO_USER_NAME = "用户";

const DEMO_MESSAGES: InboxMessage[] = [];

export default function MessagesPage() {
  const { actor } = useSessionActor();
  const [filter, setFilter] = React.useState<FilterCategory>("all");
  const [popupOpen, setPopupOpen] = React.useState(false);
  const [popupMsg, setPopupMsg] = React.useState<InboxMessage | null>(null);

  const currentName = DEMO_INBOX_USER_NAME[actor.role as UserRole] ?? DEMO_USER_NAME;

  const filtered = React.useMemo(() => {
    if (filter === "all") return DEMO_MESSAGES;
    return DEMO_MESSAGES.filter((m) => m.category === filter);
  }, [filter]);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
      <header className="flex items-center gap-3">
        <Mail className="size-6 text-primary" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">消息</h1>
          <p className="text-sm text-muted-foreground">
            <span className="tabular-nums">0</span> 条未读；等待真实消息接入
          </p>
        </div>
      </header>

      <TabSwitcher
        items={TAB_ITEMS.map((t) => ({
          id: t.id,
          label: t.label,
        }))}
        activeId={filter}
        onChange={(v) => setFilter(v as FilterCategory)}
        className="w-full"
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <Mail className="mb-4 size-12 text-muted-foreground/30" />
          <p className="text-sm font-medium text-foreground">暂无消息</p>
          <p className="mt-1 text-sm text-muted-foreground">等待真实消息接入。</p>
        </div>
      ) : null}

      <Sheet open={popupOpen} onOpenChange={setPopupOpen}>
        <SheetContent side="right" className="w-full max-w-md sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {popupMsg ? (
                <>
                  <span>{popupMsg.sender.name}</span>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] font-normal", categoryBadgeClass(popupMsg.category))}
                  >
                    {INBOX_CATEGORY_LABEL[popupMsg.category]}
                  </Badge>
                </>
              ) : (
                "消息详情"
              )}
            </SheetTitle>
          </SheetHeader>
          {popupMsg && (
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{popupMsg.summary}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{popupMsg.sentAtLabel}</p>
                </div>
                <Separator />
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {popupMsg.content}
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
