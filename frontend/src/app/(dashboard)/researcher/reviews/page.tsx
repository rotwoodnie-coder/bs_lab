"use client";

import * as React from "react";

import { ExperimentCurriculumReviewPageInner } from "../../console/review/experiments/page";

export default function ResearcherReviewsPage() {
  return (
    <React.Suspense
      fallback={<p className="px-1 py-4 text-sm text-muted-foreground">加载教研评审…</p>}
    >
      <ExperimentCurriculumReviewPageInner />
    </React.Suspense>
  );
}
