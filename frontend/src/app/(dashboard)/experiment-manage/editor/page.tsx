"use client";

import * as React from "react";

import TeacherExperimentEditorContainer from "@/app/(dashboard)/teacher/experiment-editor/page.container";

/** 直接访问或刷新 `/experiment-manage/editor` 时的整页编辑器（非拦截态）。 */
export default function ExperimentManageEditorPage() {
  return (
    <React.Suspense fallback={<p className="py-6 text-sm text-muted-foreground">加载实验编辑器…</p>}>
      <TeacherExperimentEditorContainer />
    </React.Suspense>
  );
}
