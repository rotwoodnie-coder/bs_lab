"use client";

import * as React from "react";

import ExperimentManagePageContainer from "./page.container";

export default function ExperimentManagePage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          加载实验课程…
        </div>
      }
    >
      <ExperimentManagePageContainer />
    </React.Suspense>
  );
}
