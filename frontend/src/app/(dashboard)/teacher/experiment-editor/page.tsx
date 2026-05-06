import * as React from "react";

import TeacherExperimentEditorContainer from "./page.container";

export default function TeacherExperimentEditorPage() {
  return (
    <React.Suspense fallback={<p className="py-6 text-sm text-muted-foreground">加载实验编辑器…</p>}>
      <TeacherExperimentEditorContainer />
    </React.Suspense>
  );
}
