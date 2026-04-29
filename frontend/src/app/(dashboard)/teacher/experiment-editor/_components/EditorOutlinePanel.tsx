import * as React from "react";

import { Button } from "@bs-lab/ui";

import type { ExperimentStepDraft } from "../types";

type AnchorItem = { id: string; label: string; progressPct?: number; completed?: boolean };

export function EditorOutlinePanel(props: {
  anchors: AnchorItem[];
  activeAnchorId: string;
  onNavigateAnchor: (id: string) => void;
  steps: ExperimentStepDraft[];
  selectedStepId: string | null;
  onSelectStep: (id: string) => void;
  onMoveStep: (fromIndex: number, toIndex: number) => void;
  canPublish?: boolean;
  onPublish?: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-slate-300">内容导航</p>
          {props.canPublish && props.onPublish ? (
            <Button type="button" size="sm" className="shrink-0 rounded-lg bg-[#008080] text-white hover:bg-[#006666]" onClick={props.onPublish}>
              提交审核
            </Button>
          ) : null}
        </div>
      </div>
      <div className="space-y-0.5 px-2 pb-4">
        {props.anchors.map((anchor, index) => (
          <button
            key={anchor.id}
            type="button"
            onClick={() => props.onNavigateAnchor(anchor.id)}
            className={
              props.activeAnchorId === anchor.id
                ? "flex w-full items-center justify-between rounded-xl bg-slate-700/60 px-3 py-2.5 text-left text-sm text-white transition-colors"
                : "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200"
            }
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className={
                  props.activeAnchorId === anchor.id
                    ? "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#008080] text-xs font-semibold leading-none text-white"
                    : anchor.completed
                      ? "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#008080]/60 text-xs font-semibold leading-none text-white"
                      : "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-xs font-semibold leading-none text-slate-400"
                }
              >
                {index + 1}
              </span>
              <span className="truncate">{anchor.label.replace(/^\d+\.\s*/, "")}</span>
            </span>
            <span className="shrink-0 text-xs text-slate-500">
              {anchor.completed ? "已完成" : `${Math.round(anchor.progressPct ?? 0)}%`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
