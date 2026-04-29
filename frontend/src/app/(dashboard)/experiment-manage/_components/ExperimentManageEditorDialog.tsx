"use client";

import * as React from "react";

import TeacherExperimentEditorContainer from "@/app/(dashboard)/teacher/experiment-editor/page.container";

/**
 * 实验课程管理场景：整页打开编辑器，不再使用弹窗承载。
 */
export function ExperimentManageEditorDialog() {
  return (
    <React.Suspense fallback={<p className="py-6 text-sm text-muted-foreground">加载实验编辑器…</p>}>
      <TeacherExperimentEditorContainer />
    </React.Suspense>
  );
}
