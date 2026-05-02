"use client";

import { useEffect } from "react";
import { useMobileContext } from "@/contexts/MobileContext";
import { MobileCard } from "./MobileCard";

export function ChildSwitcher() {
  const { children, currentChildId, currentChild, setCurrentChildId, userContext } = useMobileContext();
  const isParent = userContext?.role?.toLowerCase().includes("parent") ?? true;

  useEffect(() => {
    if (!currentChildId && children[0]) setCurrentChildId(children[0].studentUserId);
  }, [children, currentChildId, setCurrentChildId]);

  if (!isParent) return null;

  return (
    <MobileCard title="我的孩子" subtitle={currentChild ? `当前孩子：${currentChild.studentUserName}` : "点击切换当前孩子"}>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {children.map((item) => {
          const active = currentChildId === item.studentUserId;
          return (
            <button
              key={item.studentUserId}
              onClick={() => setCurrentChildId(item.studentUserId)}
              className={`min-w-[96px] rounded-[28px] border px-3 py-3 text-center transition ${active ? "border-primary bg-primary/10 shadow-sm" : "border-border/60 bg-background hover:bg-muted/50"}`}
            >
              <div
                className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold ${active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
              >
                {item.avatar}
              </div>
              <div className="mt-2 text-sm font-semibold">{item.studentUserName}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">{item.relationLabel}</div>
            </button>
          );
        })}
      </div>
    </MobileCard>
  );
}
