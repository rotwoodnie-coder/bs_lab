"use client";

import { ExperimentManageEditorDialog } from "@/app/(dashboard)/experiment-manage/_components/ExperimentManageEditorDialog";

/** 从实验管理页跳转到 `/teacher/experiment-editor` 时的拦截对话框（保留旧路径兼容）。 */
export default function TeacherExperimentEditorModalPage() {
  return <ExperimentManageEditorDialog />;
}

