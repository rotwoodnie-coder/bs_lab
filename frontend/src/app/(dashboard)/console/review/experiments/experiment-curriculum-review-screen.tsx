"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Badge } from "@bs-lab/ui";

import { StudentWorksPipelineCard } from "@/components/console/student-works-pipeline-card";
import { useAppMode } from "@/context/app-mode-context";

import { useExperimentCurriculumReview } from "./experiment-curriculum-review.hooks";
import { ExperimentReviewWorkbench } from "./_components/experiment-review-workbench";

export function ExperimentCurriculumReviewPageInner() {
  const pathname = usePathname();
  const model = useExperimentCurriculumReview(pathname);
  const { viewMode, setViewMode } = useAppMode();

  React.useEffect(() => {
    if (viewMode !== "management") {
      setViewMode("management", { suppressToast: true });
    }
  }, [viewMode, setViewMode]);

  return (
    <div className="flex flex-col gap-5 pb-8 lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <header className="shrink-0 space-y-0.5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {model.isResearcherWorkspace ? "教研员 · 实验方案评审" : "评审工作台"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {model.isResearcherWorkspace
                ? "数据来自主库 exp_msg：待审队列为 status=草稿(t)；通过/驳回写入审核字段。"
                : "左侧为实验内容审阅，右侧为审批结论；驳回须填写理由。"}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0 border-border font-normal">
            待评审 {model.pendingRows.length} 条
          </Badge>
        </div>
      </header>

      <StudentWorksPipelineCard sourceExperimentId={model.expId || null} />

      <ExperimentReviewWorkbench model={model} />
    </div>
  );
}
