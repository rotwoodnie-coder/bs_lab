import type { V2DictGradeItem, V2DictItem, V2ExpMsgDetail, V2ExpMsgItem } from "@/lib/v2/v2-exp-api";
import type { Experiment, ExperimentDetail, ExperimentEquipmentItem, ExperimentStep } from "@/types/experiment";

function dictNameById(rows: readonly V2DictItem[] | readonly V2DictGradeItem[], id: string | null | undefined): string | null {
  if (!id) return null;
  const hit = (rows as Array<{ id: string; name: string }>).find((r) => r.id === id);
  return hit?.name?.trim() || null;
}

export function v2ExpMsgItemToExperimentCard(
  item: V2ExpMsgItem,
  ctx: { grades: readonly V2DictGradeItem[]; subjects: readonly V2DictItem[] },
): Experiment {
  const gradeLabel = dictNameById(ctx.grades, item.gradeId) ?? "—";
  const categoryLabel = dictNameById(ctx.subjects, item.subjectId) ?? undefined;
  const summary = item.expPrinciple?.trim() ? item.expPrinciple.trim().slice(0, 140) : undefined;
  return {
    id: item.expId,
    title: item.expName?.trim() || "未命名实验",
    summary,
    gradeLabel,
    categoryLabel,
    coverVideoUrl: item.coverVideoUrl ?? undefined,
    coverImageUrl: undefined,
    authorDisplayName: item.displayOwnerName ?? item.createUserId ?? undefined,
  };
}

function v2MaterialsToEquipment(d: V2ExpMsgDetail): ExperimentEquipmentItem[] {
  return (d.materials ?? []).map((m) => ({
    id: m.expMaterialId,
    name: m.materialName?.trim() || "材料",
    imageUrl: m.mainPicUrl ?? undefined,
    measureNote: m.comments?.trim() || undefined,
    hazard: "none",
  }));
}

function v2StepsToSteps(d: V2ExpMsgDetail): ExperimentStep[] {
  return (d.steps ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((s, i) => ({
      id: s.stepId,
      order: i + 1,
      title: s.stepName?.trim() || `步骤 ${i + 1}`,
      content: s.stepComments?.trim() || "",
    }));
}

export function v2ExpMsgDetailToExperimentHubDetail(
  d: V2ExpMsgDetail,
  ctx: { grades: readonly V2DictGradeItem[]; subjects: readonly V2DictItem[] },
): ExperimentDetail {
  const gradeLabel = dictNameById(ctx.grades, d.gradeId) ?? "—";
  const categoryLabel = dictNameById(ctx.subjects, d.subjectId) ?? undefined;

  const safetyAlerts: string[] = [];
  if (d.expDanger?.trim()) safetyAlerts.push(d.expDanger.trim());
  if (d.expCaution?.trim()) safetyAlerts.push(d.expCaution.trim());

  return {
    id: d.expId,
    title: d.expName?.trim() || "未命名实验",
    summary: d.expPrinciple?.trim() ? d.expPrinciple.trim().slice(0, 180) : undefined,
    gradeLabel,
    categoryLabel,
    coverVideoUrl: d.coverVideoUrl ?? undefined,
    coverImageUrl: d.pics?.[0]?.picUrl ?? undefined,
    durationMin: Math.max(5, Math.round(Number(d.classHour ?? 1) * 45)),
    authorDisplayName: d.displayOwnerName ?? d.createUserId ?? undefined,
    bannerVideoUrl: d.videos?.[0]?.videoUrl ?? undefined,
    simulationConfig: d.simulatorUrl?.trim() ? { embedSrc: d.simulatorUrl.trim() } : null,
    teaching: {
      subject: categoryLabel ?? "—",
      stage: "—",
      gradeLabel,
      participation: d.chooseType === "y" ? "required" : "optional",
      curriculum: { level1Theme: "—", level2Theme: "—", coreCompetencies: [] },
      textbook: { version: "—", unit: "—", section: "—" },
    },
    core: {
      principle: d.expPrinciple?.trim() || "",
      equipment: v2MaterialsToEquipment(d),
      steps: v2StepsToSteps(d),
      safetyAlerts,
      timer: { suggestedDurationSec: undefined, enableClassTimer: true },
    },
    extension: { extensionExperiments: [] },
    management: { approvalStatus: d.status === "y" ? "approved" : d.status === "n" ? "rejected" : d.status === "t" ? "draft" : "draft" },
  };
}

