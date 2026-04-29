import type { V2ExpMsgDetail } from "@/lib/v2/v2-exp-api";
import type { EducationPhase, SubjectDiscipline } from "@/types/subject";
import type {
  ExperimentDetail,
  ExperimentMaterial,
  ExperimentStep,
  SafetyAlert,
  TeachingContext,
} from "@/types/experiment-detail";

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sortNum(a: number | null | undefined, b: number | null | undefined): number {
  return (a ?? 0) - (b ?? 0);
}

function defaultSubjectPath(gradeLabel: string): ExperimentDetail["subjectPath"] {
  return {
    phase: "junior" as EducationPhase,
    discipline: "science" as SubjectDiscipline,
    gradeLabel,
  };
}

/**
 * 将 `/v2/exp/:id` 聚合结果映射为评审侧 `ExperimentDetailContent` 所需结构（展示层映射）。
 */
export function v2ExpMsgDetailToExperimentDetail(
  d: V2ExpMsgDetail,
  opts: { gradeLabel?: string; subjectLabel?: string } = {},
): ExperimentDetail {
  const gradeLabel = opts.gradeLabel?.trim() || "—";
  const subjectPath = defaultSubjectPath(gradeLabel);

  const materials: ExperimentMaterial[] = [...(d.materials ?? [])]
    .sort((a, b) => sortNum(a.sortOrder, b.sortOrder))
    .map((m, i) => ({
      id: m.expMaterialId,
      nameLab: m.materialName?.trim() || `材料 ${i + 1}`,
      imageUrl: m.mainPicUrl ?? undefined,
      hazardFlags: [],
      notes: m.comments?.trim() || undefined,
    }));

  const steps: ExperimentStep[] = [...(d.steps ?? [])]
    .sort((a, b) => sortNum(a.sortOrder, b.sortOrder))
    .map((s, i) => ({
      id: s.stepId,
      order: i + 1,
      title: s.stepName?.trim() || `步骤 ${i + 1}`,
      description: s.stepComments?.trim() || "",
    }));

  const safetyAlerts: SafetyAlert[] = [];
  if (d.expDanger?.trim()) {
    safetyAlerts.push({
      id: "danger",
      title: "危险提示",
      body: d.expDanger.trim(),
      severity: "critical",
    });
  }
  if (d.expCaution?.trim()) {
    safetyAlerts.push({
      id: "caution",
      title: "注意事项",
      body: d.expCaution.trim(),
      severity: "warning",
    });
  }

  const ref0 = (d.references ?? [])[0];
  const teachingContext: TeachingContext = {
    curriculumStandardRef: ref0?.referenceName?.trim() || undefined,
    textbookRef: opts.subjectLabel?.trim() || undefined,
    chapter: ref0?.referenceSource?.trim() || undefined,
    learningObjectives: ref0?.referenceComments?.trim()
      ? [ref0.referenceComments.trim()]
      : undefined,
  };

  const sci0 = (d.scientists ?? [])[0];
  const principleText = d.expPrinciple ? stripTags(d.expPrinciple) : "";

  return {
    id: d.expId,
    title: d.expName,
    summary: principleText ? principleText.slice(0, 360) : undefined,
    subjectPath,
    durationMin: Math.max(5, Math.round(Number(d.classHour ?? 1) * 45)),
    mainVideoUrl: d.videos?.[0]?.videoUrl ?? d.simulatorUrl ?? undefined,
    teachingContext,
    materials,
    steps,
    safetyAlerts,
    evaluation: {
      scienceStory: sci0?.storyComments?.trim() || sci0?.storyName?.trim() || undefined,
      rubricSummary: principleText ? principleText.slice(0, 220) : undefined,
    },
    approvalMeta: {
      submitterName: d.createUserId ?? "—",
      submittedAt: d.createTime ?? "—",
      schoolName: "—",
      version: "—",
      statusLabel: d.status === "t" ? "草稿" : d.status === "y" ? "已通过" : d.status === "n" ? "未通过" : "—",
    },
  };
}
