"use client";

import * as React from "react";

type Args = {
  searchParams: { get: (key: string) => string | null };
  setCurriculum: (v: string) => void;
  setSelectedStandardId: (v: string | null) => void;
  setUseCustomExperiment: (v: boolean) => void;
};

/**
 * 从 query 预填「课标引用」，用于从课标详情快速创建课程。
 * 仅影响前端态，不涉及后端契约。
 */
export function useEditorBootstrapStandardPrefill(p: Args) {
  const appliedRef = React.useRef(false);

  React.useEffect(() => {
    if (appliedRef.current) return;
    const curriculumRef = p.searchParams.get("curriculumRef")?.trim() ?? "";
    const standardId = p.searchParams.get("standardId")?.trim() ?? "";
    if (!curriculumRef && !standardId) return;

    appliedRef.current = true;
    if (standardId) p.setSelectedStandardId(standardId);
    if (curriculumRef) {
      // 避免被课标表格自动重写 curriculum 字段
      p.setUseCustomExperiment(true);
      p.setCurriculum(curriculumRef);
    }
  }, [p.searchParams, p.setCurriculum, p.setSelectedStandardId, p.setUseCustomExperiment]);
}

