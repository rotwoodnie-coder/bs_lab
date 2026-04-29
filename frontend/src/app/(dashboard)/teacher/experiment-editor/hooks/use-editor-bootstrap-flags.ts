"use client";

import * as React from "react";

import type { EditorPeerRow } from "../utils/editor-peer-row-types";
import {
  EDITOR_PEER_LIFECYCLE_LABEL,
  EDITOR_PEER_WORKFLOW_LABEL,
  editorPeerIsPendingReviewStatus,
  editorPeerLifecycleForRow,
} from "../utils/editor-peer-row-types";

export function useEditorBootstrapFlags(
  expId: string | null,
  row: EditorPeerRow | undefined,
  isTeacher: boolean,
  isResearcher: boolean,
) {
  return React.useMemo(() => {
    const workflowLabel = row ? EDITOR_PEER_WORKFLOW_LABEL[row.workflowStatus] : "—";
    const lifecycleLabel = row ? EDITOR_PEER_LIFECYCLE_LABEL[editorPeerLifecycleForRow(row)] : "—";
    const showResearcherReviewBar =
      isResearcher && Boolean(expId && row && editorPeerIsPendingReviewStatus(row.workflowStatus));
    const showResearcherTakedown =
      isResearcher &&
      Boolean(
        expId &&
          row &&
          (() => {
            const lifecycle = editorPeerLifecycleForRow(row);
            return lifecycle === "PUBLISHED" || lifecycle === "STANDARD";
          })(),
      );
    const showRejectBanner =
      isTeacher &&
      Boolean(row?.workflowStatus === "changes_requested" && row.rejectReason && row.rejectReason.length > 0);
    const showResearcherNoopHint = Boolean(
      isResearcher &&
        expId &&
        row &&
        !editorPeerIsPendingReviewStatus(row.workflowStatus) &&
        row.workflowStatus !== "published",
    );
    return {
      workflowLabel,
      lifecycleLabel,
      showResearcherReviewBar,
      showResearcherTakedown,
      showRejectBanner,
      showResearcherNoopHint,
    };
  }, [expId, isResearcher, isTeacher, row]);
}
