"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { sonnerToast } from "@bs-lab/ui";
import type { RichMediaEmbed } from "@bs-lab/ui";

import { useDemoRole } from "@/components/layout/demo-role-context";
import { isSuperUserRole } from "@/lib/rbac/management-access";
import type { EditorPeerRow, EditorPeerWorkflowStatus } from "../utils/editor-peer-row-types";
import type { CoreApiActor } from "@/lib/core-api-shared";
import type { V2DictGradeItem, V2DictItem } from "@/lib/v2/v2-exp-api";
import { createV2Exp, patchV2ExpMsgReview, publishCourseTask, putV2ExpDraft } from "@/lib/v2/v2-exp-api";
import { syncExperimentMaterialLinksApi } from "@/lib/experimental-materials-api";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import { appendLocalWorkflowEvent } from "@/lib/workflow-events-local";

import type {
  ExperimentMaterialDraft,
  ExperimentReferenceCitationDraft,
  ExperimentResultEntryDraft,
  ExperimentScientistStoryDraft,
  ExperimentStepDraft,
} from "../types";
import { buildV2ExpDraftPutBody } from "../utils/build-v2-exp-draft-put-body";
import { sanitizeAndNormalizeRichText } from "../utils/exp-editor-text-fences";
import { resultEntryFilled, richBlockFilled, stepContentFilled } from "../utils/step-content-filled";

function summarizeStepsFromDraft(steps: ExperimentStepDraft[]): string {
  const marks = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧"];
  return steps
    .slice(0, 6)
    .map((s, i) => `${marks[i] ?? "·"} ${s.title || "（无标题）"}`)
    .join(" ");
}

export type EditorActionsInput = {
  expId: string | null;
  forkFrom: string | null;
  row: EditorPeerRow | undefined;
  isTeacher: boolean;
  isResearcher: boolean;
  completionPct: number;
  phase: string;
  discipline: string;
  selectedGradeCodes: string[];
  gradeOptions: readonly { code: string; label: string }[];
  /** 对齐 exp_msg.exp_name */
  expName: string;
  /** 对齐 exp_msg.choose_type */
  chooseType: "y" | "n" | null;
  /** 对齐 exp_msg.subject_id */
  subjectId: string | null;
  /** 对齐 exp_msg.school_level_id */
  schoolLevelId: string | null;
  /** 对齐 exp_msg.grade_id */
  gradeId: string | null;
  actorId: string;
  actorName: string;
  orgId: string;
  targetClassId?: string | null;
  summary: string;
  creatorName: string;
  curriculum: string;
  teachingContextContent: string;
  teachingContextEmbeds: RichMediaEmbed[];
  coursebookId: string;
  unitId: string;
  principle: string;
  principleImage: string;
  principleVideo: string;
  principleEmbeds: RichMediaEmbed[];
  safetyNotes: string;
  safetyEmbeds: RichMediaEmbed[];
  dangerNotes: string;
  dangerEmbeds: RichMediaEmbed[];
  durationMin: string;
  simulatorUrl: string;
  difficultyId: string;
  mainVideoId: string | null;
  mainVideoUrl: string;
  mainVideoEmbeds: RichMediaEmbed[];
  teachingRefTextbookVersion: string;
  teachingRefUnit: string;
  teachingRefLessonPeriod: string;
  referenceCitations: ExperimentReferenceCitationDraft[];
  referenceRichText: string;
  referenceRichEmbeds: RichMediaEmbed[];
  scientistStories: ExperimentScientistStoryDraft[];
  materials: ExperimentMaterialDraft[];
  steps: ExperimentStepDraft[];
  resultEntries: ExperimentResultEntryDraft[];
  v2Actor: CoreApiActor;
  v2Subjects: V2DictItem[];
  v2Grades: V2DictGradeItem[];
  refreshV2PeerList?: () => void;
};

type SaveDraftOptions = {
  silent?: boolean;
};

type PublishStatusState = "idle" | "publishing" | "published" | "failed";

export function useEditorActions(a: EditorActionsInput) {
  const router = useRouter();
  const { role, orgId } = useDemoRole();
  const superUser = isSuperUserRole(role);
  const [history, setHistory] = React.useState<Array<{ title: string; summary: string }>>([]);
  const [publishStatus, setPublishStatus] = React.useState<PublishStatusState>("idle");

  const pushExperimentMaterialLinks = React.useCallback(
    (experimentId: string, silent?: boolean) => {
      const materialIds = a.materials.map((m) => m.libraryMaterialId).filter((x): x is string => Boolean(x));
      const actor = buildMaterialsApiActor(role, orgId, "editor-material-form");
      void syncExperimentMaterialLinksApi(actor, { experimentId, materialIds }).catch((err) => {
        if (!silent) {
          sonnerToast.error("材料关联同步失败", {
            description: err instanceof Error ? err.message : "请稍后重试",
          });
        }
      });
    },
    [a.materials, orgId, role],
  );

  const appendExperimentWorkflowEvent = React.useCallback(
    (type: string, resourceId: string, payload: Record<string, unknown>) => {
      appendLocalWorkflowEvent({
        orgId: a.orgId,
        actorId: a.actorId,
        actorName: a.actorName,
        type,
        resourceType: "experiment_course",
        resourceId,
        payload,
      });
    },
    [a.actorId, a.actorName, a.orgId],
  );

  const canShowNavSave =
    (!a.isResearcher || superUser) && (!a.row || a.row.workflowStatus !== "submitted");
  const canShowNavSubmit =
    a.isTeacher &&
    a.completionPct === 100 &&
    (!a.row || a.row.workflowStatus === "draft" || a.row.workflowStatus === "changes_requested");

  const persistListFields = React.useCallback((_patch?: { workflowStatus?: EditorPeerWorkflowStatus; rejectReason?: string }) => {
    a.refreshV2PeerList?.();
  }, [a.refreshV2PeerList]);

  const publishToClass = React.useCallback(
    async (draftId: string) => {
      if (!a.targetClassId?.trim()) return false;
      setPublishStatus("publishing");
      try {
        await publishCourseTask(a.v2Actor, { draftId, targetClassId: a.targetClassId.trim() });
        appendExperimentWorkflowEvent("course_task_publish_requested", draftId, {
          draftId,
          targetClassId: a.targetClassId.trim(),
        });
        setPublishStatus("published");
        return true;
      } catch (err) {
        setPublishStatus("failed");
        if (!a.row || a.row.workflowStatus !== "submitted") {
          // 草稿已保存，但发布失败；不阻断 saveDraft。
        }
        if (process.env.NODE_ENV !== "production") {
          console.error("publishToClass failed", err);
        }
        return false;
      }
    },
    [a.row, a.targetClassId, a.v2Actor, appendExperimentWorkflowEvent],
  );

  const createdIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (a.expId) createdIdRef.current = null;
  }, [a.expId]);


  const saveDraft = React.useCallback(
    async (options?: SaveDraftOptions): Promise<boolean> => {
      if (!a.v2Actor.userId) {
        if (!options?.silent) sonnerToast.error("未登录", { description: "请先登录后再保存。" });
        return false;
      }
      if (!a.subjectId?.trim() || !a.gradeId?.trim() || !a.schoolLevelId?.trim()) {
        if (!options?.silent) {
          sonnerToast.error("请先选择学科和年级", {
            description: "在「基础信息」中补齐学科和年级后再保存。",
          });
        }
        return false;
      }
      const normalizedPrinciple = sanitizeAndNormalizeRichText(a.principle, a.principleEmbeds);
      const normalizedSafety = sanitizeAndNormalizeRichText(a.safetyNotes, a.safetyEmbeds);
      const normalizedDanger = sanitizeAndNormalizeRichText(a.dangerNotes, a.dangerEmbeds);
      if (a.steps.some((step) => sanitizeAndNormalizeRichText(step.content, step.contentEmbeds).text.length > 2000)) {
        if (!options?.silent) sonnerToast.error("步骤内容过长，请精简（限2000字）");
        return false;
      }
      setHistory((prev) => [...prev.slice(-29), { title: a.expName, summary: a.summary }]);
      const body = buildV2ExpDraftPutBody({
        expName: a.expName,
        chooseType: a.chooseType,
        subjectId: a.subjectId,
        schoolLevelId: a.schoolLevelId,
        gradeId: a.gradeId,
        summary: a.summary,
        curriculum: a.curriculum,
        teachingContextContent: a.teachingContextContent,
        teachingContextEmbeds: a.teachingContextEmbeds,
        coursebookId: a.coursebookId,
        unitId: a.unitId,
        principle: normalizedPrinciple.text,
        principleEmbeds: normalizedPrinciple.embeds,
        safetyNotes: normalizedSafety.text,
        safetyEmbeds: normalizedSafety.embeds,
        dangerNotes: normalizedDanger.text,
        dangerEmbeds: normalizedDanger.embeds,
        durationMin: a.durationMin,
        simulatorUrl: a.simulatorUrl,
        difficultyId: a.difficultyId,
        materials: a.materials,
        steps: a.steps,
        resultEntries: a.resultEntries,
        referenceCitations: a.referenceCitations,
        referenceRichText: a.referenceRichText,
        referenceRichEmbeds: a.referenceRichEmbeds,
        scientistStories: a.scientistStories,
        mainVideoId: a.mainVideoId,
        mainVideoUrl: a.mainVideoUrl,
        mainVideoEmbeds: a.mainVideoEmbeds,
      });
      try {
        if (a.expId) {
          await putV2ExpDraft(a.v2Actor, a.expId, body);
          pushExperimentMaterialLinks(a.expId, options?.silent);
          if (a.targetClassId?.trim()) await publishToClass(a.expId);
          a.refreshV2PeerList?.();
          if (!options?.silent) {
            sonnerToast.success("已保存草稿", {
              description: `${a.expId}`,
            });
          }
          return true;
        }

        const created = await createV2Exp(a.v2Actor, {
          expName: (a.expName ?? "").trim() || "未命名实验",
          subjectId: a.subjectId?.trim() ? a.subjectId.trim() : undefined,
          schoolLevelId: a.schoolLevelId?.trim() ? a.schoolLevelId.trim() : undefined,
          gradeId: a.gradeId?.trim() ? a.gradeId.trim() : undefined,
        });
        const newId = created.expId;
        createdIdRef.current = newId;
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          if (url.searchParams.get("id") !== newId) {
            url.searchParams.set("id", newId);
            router.replace(`${url.pathname}?${url.searchParams.toString()}`, { scroll: false });
          }
        }
        await putV2ExpDraft(a.v2Actor, newId, body);
        pushExperimentMaterialLinks(newId, options?.silent);
        if (a.targetClassId?.trim()) await publishToClass(newId);
        a.refreshV2PeerList?.();
        if (!options?.silent) {
          sonnerToast.success("已创建草稿", {
            description: `${newId}`,
          });
          appendExperimentWorkflowEvent("experiment_created", newId, { workflowStatus: "draft", title: a.expName });
        }
        return true;
      } catch (err) {
        const code = err instanceof Error && "code" in err ? Number((err as { code?: number }).code) : undefined;
        if (!options?.silent) {
          if (code === 4001) {
            sonnerToast.error("内容超过字符上限（请检查富文本）");
          } else if (code === 4002) {
            sonnerToast.error("名称不能为空");
          } else {
            sonnerToast.error("草稿保存失败", {
              description: err instanceof Error ? err.message : "请稍后重试",
            });
          }
        }
        return false;
      }
    },
    [a, appendExperimentWorkflowEvent, pushExperimentMaterialLinks, router],
  );

  const publish = React.useCallback(async () => {
    if (!a.subjectId?.trim() || !a.gradeId?.trim() || !a.schoolLevelId?.trim()) {
      sonnerToast.error("无法提交审核", {
        description: "请先在「基础信息」中选择学科和年级。",
      });
      return;
    }
    const missing =
      !a.expName.trim() ||
      !a.creatorName.trim() ||
      !a.curriculum.trim() ||
      !richBlockFilled({ content: a.teachingContextContent, contentEmbeds: a.teachingContextEmbeds }) ||
      !a.principle.trim() ||
      !a.principleEmbeds.some((item) => item.kind === "video" && item.src.trim()) ||
      !richBlockFilled({ content: a.safetyNotes, contentEmbeds: a.safetyEmbeds }) ||
      !richBlockFilled({ content: a.dangerNotes, contentEmbeds: a.dangerEmbeds }) ||
      !a.materials.some((item) => item.nameLab.trim()) ||
      !a.steps.some((item) => item.title.trim() && stepContentFilled(item)) ||
      !a.resultEntries.some((item) => resultEntryFilled(item));
    if (missing) {
      sonnerToast.error("仍有必填项未完成", { description: "请先查看右侧「录入完整度」并补齐字段。" });
      return;
    }

    const saved = await saveDraft({ silent: true });
    if (!saved) return;
    const targetExpId = a.expId ?? createdIdRef.current;
    if (!targetExpId) {
      sonnerToast.error("提交失败", { description: "未能确定实验 id。" });
      return;
    }
    persistListFields({ workflowStatus: "submitted", rejectReason: undefined });
    appendExperimentWorkflowEvent("experiment_submitted", targetExpId, {
      workflowStatus: "submitted",
      title: a.expName,
    });
    sonnerToast.success("已提交审核", { description: targetExpId });
  }, [a, appendExperimentWorkflowEvent, persistListFields, saveDraft]);

  const approveExperiment = React.useCallback(async () => {
    if (!a.expId) return;
    try {
      await patchV2ExpMsgReview(a.v2Actor, a.expId, {
        status: "y",
        confirm_comments: "审核通过",
      });
      sonnerToast.success("已通过审核");
      appendExperimentWorkflowEvent("experiment_approved", a.expId, { workflowStatus: "approved" });
      a.refreshV2PeerList?.();
    } catch (err) {
      sonnerToast.error("审核操作失败", {
        description: err instanceof Error ? err.message : "请稍后重试",
      });
    }
  }, [a.expId, a.v2Actor, appendExperimentWorkflowEvent, a.refreshV2PeerList]);

  const confirmReject = React.useCallback(
    async (rejectDraft: string, close: () => void) => {
      const reason = rejectDraft.trim();
      if (!a.expId || !reason) {
        sonnerToast.error("请填写驳回原因");
        return;
      }
      try {
        await patchV2ExpMsgReview(a.v2Actor, a.expId, {
          status: "n",
          reject_reason: reason,
        });
        close();
        sonnerToast.message("已驳回", { description: "请继续完善后重新提交。" });
        appendExperimentWorkflowEvent("experiment_changes_requested", a.expId, {
          workflowStatus: "changes_requested",
          rejectReason: reason,
        });
        a.refreshV2PeerList?.();
      } catch (err) {
        sonnerToast.error("驳回操作失败", {
          description: err instanceof Error ? err.message : "请稍后重试",
        });
      }
    },
    [a.expId, a.v2Actor, appendExperimentWorkflowEvent, a.refreshV2PeerList],
  );

  const archivePublished = React.useCallback(() => {
    if (!a.expId) return;
    sonnerToast.success("已下架归档");
    appendExperimentWorkflowEvent("experiment_archived", a.expId, { workflowStatus: "archived" });
  }, [a.expId, appendExperimentWorkflowEvent]);

  const preview = React.useCallback(() => {
    sonnerToast.message("请使用左侧「预览」进入预览页");
  }, []);

  const undo = React.useCallback(() => {
    const latest = history.at(-1);
    if (!latest) {
      sonnerToast.message("暂无可撤销记录");
      return null;
    }
    sonnerToast.success("已回退到上次保存快照");
    setHistory((prev) => prev.slice(0, -1));
    return latest;
  }, [history]);

  return {
    canShowNavSave,
    canShowNavSubmit,
    saveDraft,
    publish,
    preview,
    undo,
    approveExperiment,
    confirmReject,
    archivePublished,
    persistListFields,
  };
}
