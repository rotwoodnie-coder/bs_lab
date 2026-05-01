"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { withPermission } from "@/lib/permissions/with-permission";

import { ExperimentCurriculumReviewPageInner } from "./experiment-curriculum-review-screen";

export { ExperimentCurriculumReviewPageInner };

function ExperimentCurriculumReviewPage() {
  return (
    <React.Suspense
      fallback={<p className="px-1 py-4 text-sm text-muted-foreground">加载评审工作台…</p>}
    >
      <div className="space-y-6">
        <PageHeader
          title="实验评审工作台"
          description="用于评审实验课程、处理待审任务与审阅意见，保持与其他 Dashboard 页面一致的头部结构。"
        />
        <ExperimentCurriculumReviewPageInner />
      </div>
    </React.Suspense>
  );
}

export default withPermission(ExperimentCurriculumReviewPage, "/console/review/experiments");
