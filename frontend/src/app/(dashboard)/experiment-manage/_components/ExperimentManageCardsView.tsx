"use client";

import * as React from "react";

import type { ApiActor } from "@/lib/new-core-api";
import type { EditorPeerRow } from "@/app/(dashboard)/teacher/experiment-editor/utils/editor-peer-row-types";
import { ExperimentCourseGridCard } from "./ExperimentCourseGridCard";

export type ExperimentManageCardsViewProps = {
  actor: ApiActor;
  rows: EditorPeerRow[];
  onEdit: (rowId: string) => void;
  onReviewOrView: (rowId: string) => void;
  onDelete?: (rowId: string) => void | Promise<void>;
};

export function ExperimentManageCardsView(props: ExperimentManageCardsViewProps) {
  return (
    <div className="relative min-h-0 flex-1 overflow-auto rounded-md border border-border p-3 [scrollbar-gutter:stable]">
      <div className="flex flex-wrap items-start gap-3">
        {props.rows.map((r) => (
          <ExperimentCourseGridCard key={r.id} row={r} href={`/experiments/${encodeURIComponent(r.id)}`} />
        ))}
      </div>
    </div>
  );
}

