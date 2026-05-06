"use client";

import { create } from "zustand";
import type { RichMediaEmbed, RichMediaValue } from "@bs-lab/ui";

import type { CoreApiActor } from "@/lib/core-api-shared";
import type { V2DictGradeItem, V2DictItem, V2ExpMsgDetail } from "@/lib/v2/v2-exp-api";
import { createV2Exp, putV2ExpDraft, patchV2ExpMsgReview, publishCourseTask } from "@/lib/v2/v2-exp-api";
import { syncExperimentMaterialLinksApi } from "@/lib/experimental-materials-api";
import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import type { UserRole } from "@/types/auth";
import { sonnerToast } from "@bs-lab/ui";

import type {
  ExperimentMaterialDraft,
  ExperimentReferenceCitationDraft,
  ExperimentResultEntryDraft,
  ExperimentScientistStoryDraft,
  ExperimentStepDraft,
  PhaseKey,
} from "../types";
import type { SubjectDiscipline } from "@/types/subject";
import { sanitizeAndNormalizeRichText } from "../utils/exp-editor-text-fences";
import { buildV2ExpDraftPutBody } from "../utils/build-v2-exp-draft-put-body";
import { buildEditorHydrationFromV2Detail } from "../utils/build-editor-hydration-from-v2-detail";
import { appendLocalWorkflowEvent } from "@/lib/workflow-events-local";

// ─── 子表 id 生成 ───
function newId(prefix: string): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── 初始值 ───
const DEFAULT_MATERIAL: ExperimentMaterialDraft = {
  id: "m1",
  nameLab: "铁架台",
  quantity: "1",
  materialType: "器材",
  nameHomeSubstitute: "",
  hazardFlags: [],
  safetyReminder: "",
  notes: "",
  thumbnailUrl: "",
};

const DEFAULT_STEP: ExperimentStepDraft = {
  id: "s1",
  title: "搭建装置",
  content: "固定悬点并确认摆球稳定。",
  contentEmbeds: [],
  expectedResult: "",
};

const DEFAULT_RESULT: ExperimentResultEntryDraft = {
  id: "r1",
  title: "结果 1",
  content: "",
  contentEmbeds: [],
};

// ─── State 类型 ───
export type SaveStatus = "idle" | "saving" | "saved" | "error";
export type PublishStatus = "idle" | "publishing" | "published" | "failed";

export interface EditorStoreState {
  // 元数据
  expId: string | null;
  forkFrom: string | null;
  actor: CoreApiActor | null;
  isOwner: boolean;
  fieldDisabled: boolean;
  materialsStepsDisabled: boolean;
  expTaskTypeDisabled: boolean;
  saveStatus: SaveStatus;
  publishStatus: PublishStatus;
  errorMessage: string | null;
  creatorName: string;

  // 主表字段
  expName: string;
  subjectId: string | null;
  schoolLevelId: string | null;
  gradeId: string | null;
  chooseType: "y" | "n" | null;
  expTaskType: "hw" | "tk" | "self" | null;
  difficultyId: string;
  summary: string;
  durationMin: string;
  simulatorUrl: string;
  curriculum: string;
  coursebookId: string;
  unitId: string;
  principle: string;
  principleEmbeds: RichMediaEmbed[];
  teachingContextContent: string;
  teachingContextEmbeds: RichMediaEmbed[];
  safetyNotes: string;
  safetyEmbeds: RichMediaEmbed[];
  dangerNotes: string;
  dangerEmbeds: RichMediaEmbed[];
  referenceRichText: string;
  referenceRichEmbeds: RichMediaEmbed[];

  // 视频
  mainVideoUrl: string;
  mainVideoEmbeds: RichMediaEmbed[];

  // 子表数组
  materials: ExperimentMaterialDraft[];
  steps: ExperimentStepDraft[];
  resultEntries: ExperimentResultEntryDraft[];
  referenceCitations: ExperimentReferenceCitationDraft[];
  scientistStories: ExperimentScientistStoryDraft[];

  // UI 状态
  phase: PhaseKey;
  discipline: SubjectDiscipline;
  selectedGradeCodes: string[];
  selectedStandardId: string | null;
  linkedStandardName: string | null;
  useCustomExperiment: boolean;
  activeAnchorId: string;

  // 分发上下文（用于自动发布到班级）
  targetClassId: string | null;
  deadline: string | null;
  requirement: string;

  // 出版物工作流
  rejectOpen: boolean;
  rejectDraft: string;
}

// ─── Actions 类型 ───
export interface EditorStoreActions {
  // 通用字段 setter（隐性标记 dirty）
  setField: <K extends keyof EditorStoreState>(key: K, value: EditorStoreState[K]) => void;

  // 子表操作
  addMaterial: () => void;
  appendMaterials: (drafts: Omit<ExperimentMaterialDraft, "id">[]) => void;
  removeMaterial: (id: string) => void;
  updateMaterial: (id: string, field: keyof Omit<ExperimentMaterialDraft, "id">, value: unknown) => void;
  addStep: () => void;
  removeStep: (id: string) => void;
  updateStep: (id: string, field: keyof Omit<ExperimentStepDraft, "id">, value: unknown) => void;
  updateStepRichContent: (id: string, value: RichMediaValue) => void;
  reorderStep: (fromIndex: number, toIndex: number) => void;
  addResultEntry: () => void;
  removeResultEntry: (id: string) => void;
  updateResultEntry: (id: string, field: keyof Omit<ExperimentResultEntryDraft, "id">, value: unknown) => void;
  updateResultRichContent: (id: string, value: RichMediaValue) => void;
  reorderResultEntry: (fromIndex: number, toIndex: number) => void;
  addReferenceCitation: () => void;
  removeReferenceCitation: (id: string) => void;
  updateReferenceCitation: (id: string, field: "citedExperimentTitle" | "sourceOrLink" | "note", value: string) => void;
  addScientistStory: () => void;
  removeScientistStory: (id: string) => void;
  updateScientistStory: (id: string, field: "scientistName" | "storyName" | "storyComments", value: string) => void;

  // 生命周期
  initialize: (opts: {
    expId: string | null;
    forkFrom: string | null;
    actor: CoreApiActor;
    isOwner: boolean;
    fieldDisabled: boolean;
    materialsStepsDisabled: boolean;
    expTaskTypeDisabled: boolean;
    targetClassId: string | null;
    deadline: string | null;
    requirement: string;
  }) => void;
  hydrateFromDetail: (detail: V2ExpMsgDetail, ctx: { grades: V2DictGradeItem[]; subjects: V2DictItem[]; userName: string }) => void;
  resetToDefaults: () => void;

  // API 操作
  saveDraft: (options?: { silent?: boolean }) => Promise<boolean>;
  publish: () => Promise<void>;
  approveExperiment: () => Promise<void>;
  confirmReject: (reason: string, close: () => void) => Promise<void>;
  archivePublished: () => void;
  setRejectOpen: (v: boolean) => void;
  setRejectDraft: (v: string) => void;
}

// ─── 初始状态 ───
const initialState: EditorStoreState = {
  expId: null,
  forkFrom: null,
  actor: null,
  isOwner: true,
  fieldDisabled: false,
  materialsStepsDisabled: false,
  expTaskTypeDisabled: false,
  saveStatus: "idle",
  publishStatus: "idle",
  errorMessage: null,
  creatorName: "",

  expName: "校本拓展 · 单摆与计时",
  subjectId: null,
  schoolLevelId: null,
  gradeId: null,
  chooseType: "y",
  expTaskType: null,
  difficultyId: "",
  summary: "",
  durationMin: "45",
  simulatorUrl: "",
  curriculum: "",
  coursebookId: "",
  unitId: "",
  principle: "",
  principleEmbeds: [],
  teachingContextContent: "",
  teachingContextEmbeds: [],
  safetyNotes: "",
  safetyEmbeds: [],
  dangerNotes: "",
  dangerEmbeds: [],
  referenceRichText: "",
  referenceRichEmbeds: [],

  mainVideoUrl: "",
  mainVideoEmbeds: [],

  materials: [DEFAULT_MATERIAL],
  steps: [DEFAULT_STEP],
  resultEntries: [DEFAULT_RESULT],
  referenceCitations: [],
  scientistStories: [],

  phase: "senior",
  discipline: "physics",
  selectedGradeCodes: ["S10"],
  selectedStandardId: null,
  linkedStandardName: null,
  useCustomExperiment: false,
  activeAnchorId: "basic",

  targetClassId: null,
  deadline: null,
  requirement: "",

  rejectOpen: false,
  rejectDraft: "",
};

function appendWorkflowEvent(
  actor: CoreApiActor | null,
  type: string,
  resourceId: string,
  payload: Record<string, unknown>,
) {
  if (!actor?.userId) return;
  appendLocalWorkflowEvent({
    orgId: actor.orgId ?? "",
    actorId: actor.userId,
    actorName: actor.userName ?? "",
    type,
    resourceType: "experiment_course",
    resourceId,
    payload,
  });
}

// ─── Store ───
export const useEditorStore = create<EditorStoreState & EditorStoreActions>((set, get) => ({
  ...initialState,

  // ── 通用 setter ──
  setField: (key, value) => set({ [key]: value }),

  // ── 材料子表 ──
  addMaterial: () =>
    set((s) => ({
      materials: [
        ...s.materials,
        {
          id: newId("m"),
          nameLab: "",
          quantity: "1",
          materialType: "器材",
          nameHomeSubstitute: "",
          hazardFlags: [],
          safetyReminder: "",
          notes: "",
          thumbnailUrl: "",
        },
      ],
    })),
  appendMaterials: (drafts) =>
    set((s) => ({
      materials: [
        ...s.materials,
        ...drafts.map((draft, idx) => ({ id: `${newId("m")}-${idx}`, ...draft })),
      ],
    })),
  removeMaterial: (id) =>
    set((s) => ({
      materials: s.materials.length <= 1 ? s.materials : s.materials.filter((x) => x.id !== id),
    })),
  updateMaterial: (id, field, value) =>
    set((s) => ({
      materials: s.materials.map((x) => (x.id === id ? { ...x, [field]: value } : x)),
    })),

  // ── 步骤子表 ──
  addStep: () =>
    set((s) => ({
      steps: [...s.steps, { id: newId("s"), title: "", content: "", contentEmbeds: [], expectedResult: "" }],
    })),
  removeStep: (id) =>
    set((s) => ({
      steps: s.steps.length <= 1 ? s.steps : s.steps.filter((x) => x.id !== id),
    })),
  updateStep: (id, field, value) =>
    set((s) => ({
      steps: s.steps.map((x) => (x.id === id ? { ...x, [field]: value } : x)),
    })),
  updateStepRichContent: (id, next) =>
    set((s) => ({
      steps: s.steps.map((x) =>
        x.id === id ? { ...x, content: next.text ?? "", contentEmbeds: Array.isArray(next.embeds) ? next.embeds : [] } : x,
      ),
    })),
  reorderStep: (fromIndex, toIndex) =>
    set((s) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= s.steps.length || toIndex >= s.steps.length)
        return s;
      const next = [...s.steps];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return s;
      next.splice(toIndex, 0, moved);
      return { steps: next };
    }),

  // ── 结果子表 ──
  addResultEntry: () =>
    set((s) => ({
      resultEntries: [...s.resultEntries, { id: newId("r"), title: "", content: "", contentEmbeds: [] }],
    })),
  removeResultEntry: (id) =>
    set((s) => ({
      resultEntries: s.resultEntries.length <= 1 ? s.resultEntries : s.resultEntries.filter((x) => x.id !== id),
    })),
  updateResultEntry: (id, field, value) =>
    set((s) => ({
      resultEntries: s.resultEntries.map((x) => (x.id === id ? { ...x, [field]: value } : x)),
    })),
  updateResultRichContent: (id, next) =>
    set((s) => ({
      resultEntries: s.resultEntries.map((x) =>
        x.id === id ? { ...x, content: next.text ?? "", contentEmbeds: Array.isArray(next.embeds) ? next.embeds : [] } : x,
      ),
    })),
  reorderResultEntry: (fromIndex, toIndex) =>
    set((s) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= s.resultEntries.length || toIndex >= s.resultEntries.length)
        return s;
      const next = [...s.resultEntries];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return s;
      next.splice(toIndex, 0, moved);
      return { resultEntries: next };
    }),

  // ── 引用子表 ──
  addReferenceCitation: () =>
    set((s) => ({
      referenceCitations: [
        ...s.referenceCitations,
        { id: newId("cit"), citedExperimentTitle: "", sourceOrLink: "", note: "" },
      ],
    })),
  removeReferenceCitation: (id) =>
    set((s) => ({
      referenceCitations: s.referenceCitations.filter((c) => c.id !== id),
    })),
  updateReferenceCitation: (id, field, value) =>
    set((s) => ({
      referenceCitations: s.referenceCitations.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    })),

  // ── 科学家故事子表 ──
  addScientistStory: () =>
    set((s) => ({
      scientistStories: [
        ...s.scientistStories,
        { id: newId("sci"), scientistName: "", storyName: "", storyComments: "" },
      ],
    })),
  removeScientistStory: (id) =>
    set((s) => ({
      scientistStories: s.scientistStories.filter((sci) => sci.id !== id),
    })),
  updateScientistStory: (id, field, value) =>
    set((s) => ({
      scientistStories: s.scientistStories.map((sci) => (sci.id === id ? { ...sci, [field]: value } : sci)),
    })),

  // ── 初始化 ──
  initialize: (opts) =>
    set({
      expId: opts.expId,
      forkFrom: opts.forkFrom,
      actor: opts.actor,
      isOwner: opts.isOwner,
      fieldDisabled: opts.fieldDisabled,
      materialsStepsDisabled: opts.materialsStepsDisabled,
      expTaskTypeDisabled: opts.expTaskTypeDisabled,
      targetClassId: opts.targetClassId,
      deadline: opts.deadline,
      requirement: opts.requirement,
      creatorName: opts.actor.userName ?? "",
    }),

  // ── 从后端详情 hydration ──
  hydrateFromDetail: (detail, ctx) => {
    const p = buildEditorHydrationFromV2Detail(detail, ctx);
    set({
      expName: p.expName,
      chooseType: p.chooseType,
      expTaskType: p.expTaskType,
      subjectId: p.subjectId,
      schoolLevelId: p.schoolLevelId,
      gradeId: p.gradeId,
      phase: p.phase,
      discipline: p.discipline,
      selectedGradeCodes: p.selectedGradeCodes.length ? p.selectedGradeCodes : ["S10"],
      summary: p.summary,
      durationMin: p.durationMin,
      simulatorUrl: p.simulatorUrl,
      difficultyId: p.difficultyId,
      mainVideoUrl: p.mainVideoUrl,
      curriculum: p.curriculum,
      teachingContextContent: p.teachingContextContent,
      teachingContextEmbeds: p.teachingContextEmbeds,
      principle: p.principle,
      principleEmbeds: p.principleEmbeds,
      safetyNotes: p.safetyNotes,
      safetyEmbeds: p.safetyEmbeds,
      dangerNotes: p.dangerNotes,
      dangerEmbeds: p.dangerEmbeds,
      scientistStories: p.scientistStories,
      referenceCitations: p.referenceCitations,
      referenceRichText: p.referenceRichText,
      referenceRichEmbeds: p.referenceRichEmbeds,
      materials: p.materials,
      steps: p.steps,
      resultEntries: p.resultEntries,
      creatorName: p.creatorName,
      coursebookId: p.coursebookId,
      unitId: p.unitId,
      saveStatus: "idle",
      errorMessage: null,
    });
  },

  // ── 恢复默认 ──
  resetToDefaults: () => set({ ...initialState, actor: get().actor }),

  // ── 保存草稿 ──
  saveDraft: async (options) => {
    const s = get();
    if (!s.actor?.userId) {
      if (!options?.silent) sonnerToast.error("未登录", { description: "请先登录后再保存。" });
      return false;
    }
    if (!s.subjectId?.trim()) {
      if (!options?.silent) {
        sonnerToast.error("请先选择学科", { description: "在「基础信息」中补齐学科后再保存。" });
      }
      return false;
    }

    const normalizedPrinciple = sanitizeAndNormalizeRichText(s.principle, s.principleEmbeds);
    const normalizedSafety = sanitizeAndNormalizeRichText(s.safetyNotes, s.safetyEmbeds);
    const normalizedDanger = sanitizeAndNormalizeRichText(s.dangerNotes, s.dangerEmbeds);

    if (s.steps.some((step) => sanitizeAndNormalizeRichText(step.content, step.contentEmbeds).text.length > 2000)) {
      if (!options?.silent) sonnerToast.error("步骤内容过长，请精简（限2000字）");
      return false;
    }

    set({ saveStatus: "saving", errorMessage: null });

    try {
      const body = buildV2ExpDraftPutBody({
        expName: s.expName,
        chooseType: s.chooseType,
        expTaskType: s.expTaskType,
        subjectId: s.subjectId,
        schoolLevelId: s.schoolLevelId,
        gradeId: s.gradeId,
        standardExpId: s.selectedStandardId ?? undefined,
        summary: s.summary,
        curriculum: s.curriculum,
        teachingContextContent: s.teachingContextContent,
        teachingContextEmbeds: s.teachingContextEmbeds,
        coursebookId: s.coursebookId,
        unitId: s.unitId,
        principle: normalizedPrinciple.text,
        principleEmbeds: normalizedPrinciple.embeds,
        safetyNotes: normalizedSafety.text,
        safetyEmbeds: normalizedSafety.embeds,
        dangerNotes: normalizedDanger.text,
        dangerEmbeds: normalizedDanger.embeds,
        durationMin: s.durationMin,
        simulatorUrl: s.simulatorUrl,
        difficultyId: s.difficultyId,
        mainVideoId: null,
        mainVideoUrl: s.mainVideoUrl,
        mainVideoEmbeds: s.mainVideoEmbeds,
        materials: s.materials,
        steps: s.steps,
        resultEntries: s.resultEntries,
        referenceCitations: s.referenceCitations,
        referenceRichText: s.referenceRichText,
        referenceRichEmbeds: s.referenceRichEmbeds,
        scientistStories: s.scientistStories,
      });

      if (s.expId) {
        await putV2ExpDraft(s.actor, s.expId, body);
        void pushMaterialLinks(s.expId, s.materials, options?.silent);
        if (s.targetClassId?.trim()) {
          await publishToClassInternal(s.actor, s.expId, s.targetClassId);
        }
        set({ saveStatus: "saved" });
        if (!options?.silent) {
          sonnerToast.success("已保存草稿", { description: `${s.expId}` });
        }
        return true;
      }

      // 新建实验
      const created = await createV2Exp(s.actor, {
        expName: (s.expName ?? "").trim() || "未命名实验",
        subjectId: s.subjectId?.trim() ? s.subjectId.trim() : undefined,
        schoolLevelId: s.schoolLevelId?.trim() ? s.schoolLevelId.trim() : undefined,
        gradeId: s.gradeId?.trim() ? s.gradeId.trim() : undefined,
      });
      const newId = created.expId;
      set({ expId: newId, saveStatus: "idle" });

      await putV2ExpDraft(s.actor, newId, body);
      void pushMaterialLinks(newId, s.materials, options?.silent);
      if (s.targetClassId?.trim()) {
        await publishToClassInternal(s.actor, newId, s.targetClassId);
      }
      set({ saveStatus: "saved" });
      if (!options?.silent) {
        sonnerToast.success("已创建草稿", { description: `${newId}` });
        appendWorkflowEvent(s.actor, "experiment_created", newId, { workflowStatus: "draft", title: s.expName });
      }
      return true;
    } catch (err) {
      const code = err instanceof Error && "code" in err ? Number((err as { code?: number }).code) : undefined;
      const msg = getErrorMessage(code, err instanceof Error ? err.message : undefined);
      set({ saveStatus: "error", errorMessage: msg });
      if (!options?.silent) {
        sonnerToast.error(msg);
      }
      return false;
    }
  },

  // ── 提交审核 ──
  publish: async () => {
    const s = get();
    if (!s.subjectId?.trim()) {
      sonnerToast.error("无法提交审核", { description: "请先在「基础信息」中选择学科。" });
      return;
    }

    // 快速校验必填
    const missing =
      !s.expName.trim() ||
      !s.creatorName.trim() ||
      !s.curriculum.trim();
    if (missing) {
      sonnerToast.error("仍有必填项未完成", { description: "请先查看右侧「录入完整度」并补齐字段。" });
      return;
    }

    const saved = await get().saveDraft({ silent: true });
    if (!saved) return;
    const targetExpId = s.expId;
    if (!targetExpId) {
      sonnerToast.error("提交失败", { description: "未能确定实验 id。" });
      return;
    }
    appendWorkflowEvent(s.actor, "experiment_submitted", targetExpId, {
      workflowStatus: "submitted",
      title: s.expName,
    });
    sonnerToast.success("已提交审核", { description: targetExpId });
  },

  // ── 审核通过 ──
  approveExperiment: async () => {
    const s = get();
    if (!s.expId || !s.actor) return;
    try {
      await patchV2ExpMsgReview(s.actor, s.expId, { status: "y", confirm_comments: "审核通过" });
      sonnerToast.success("已通过审核");
      appendWorkflowEvent(s.actor, "experiment_approved", s.expId, { workflowStatus: "approved" });
    } catch (err) {
      sonnerToast.error("审核操作失败", {
        description: err instanceof Error ? err.message : "请稍后重试",
      });
    }
  },

  // ── 审核驳回 ──
  confirmReject: async (reason, close) => {
    const s = get();
    if (!s.expId || !s.actor || !reason) {
      sonnerToast.error("请填写驳回原因");
      return;
    }
    try {
      await patchV2ExpMsgReview(s.actor, s.expId, { status: "n", confirm_comments: reason });
      close();
      sonnerToast.message("已驳回", { description: "请继续完善后重新提交。" });
      appendWorkflowEvent(s.actor, "experiment_changes_requested", s.expId, {
        workflowStatus: "changes_requested",
        rejectReason: reason,
      });
    } catch (err) {
      sonnerToast.error("驳回操作失败", {
        description: err instanceof Error ? err.message : "请稍后重试",
      });
    }
  },

  // ── 归档 ──
  archivePublished: () => {
    const s = get();
    if (!s.expId) return;
    sonnerToast.success("已下架归档");
    appendWorkflowEvent(s.actor, "experiment_archived", s.expId, { workflowStatus: "archived" });
  },

  setRejectOpen: (v) => set({ rejectOpen: v }),
  setRejectDraft: (v) => set({ rejectDraft: v }),
}));

// ── 辅助函数 ──

function getErrorMessage(code: number | undefined, message?: string): string {
  switch (code) {
    case 400:
      return "参数有误，请检查输入";
    case 401:
      return "未登录，请先登录";
    case 404:
      return "实验不存在，请确认链接";
    case 4000:
      return `操作失败：${message ?? "请稍后重试"}`;
    case 4001:
      return "步骤内容超过 2000 字上限";
    case 4002:
      return "实验名称不能为空";
    case 5000:
      return "服务异常，请稍后重试或联系管理员";
    default:
      return message ?? "操作失败，请稍后重试";
  }
}

async function pushMaterialLinks(
  experimentId: string,
  materials: ExperimentMaterialDraft[],
  silent?: boolean,
) {
  const materialIds = materials.map((m) => m.libraryMaterialId).filter((x): x is string => Boolean(x));
  if (materialIds.length === 0) return;
  // 使用空 actor 降级静默同步；若需要完整 actor 需由外部注入
  try {
    const actor = buildMaterialsApiActor("Role_Teacher", "", "editor-material-form");
    await syncExperimentMaterialLinksApi(actor, { experimentId, materialIds });
  } catch (err) {
    if (!silent) {
      sonnerToast.error("材料关联同步失败", {
        description: err instanceof Error ? err.message : "请稍后重试",
      });
    }
  }
}

async function publishToClassInternal(
  actor: CoreApiActor,
  draftId: string,
  targetClassId: string,
) {
  try {
    await publishCourseTask(actor, { draftId, targetClassId, deadline: null, requirement: null });
  } catch {
    // 发布失败不阻断保存流程
    if (process.env.NODE_ENV !== "production") {
      console.warn("publishToClassInternal failed silently", { draftId, targetClassId });
    }
  }
}
