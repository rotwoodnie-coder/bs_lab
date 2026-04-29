"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";

import { useDemoRole } from "@/components/layout/demo-role-context";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { V2ApiServiceError } from "@/lib/v2/apiService";
import {
  createV2Question,
  deleteV2Question,
  fetchV2QuestionList,
  patchV2Question,
  updateV2QuestionStatus,
  type CreateQuestionInput,
  type UpdateQuestionInput,
  type V2QuestionItem,
} from "@/lib/v2/v2-question-api";
import {
  fetchV2DifficultyTypes,
  fetchV2QuestionCapacities,
  fetchV2QuestionTypes,
  type V2DictItem,
} from "@/lib/v2/v2-exp-api";
import { sanitizeAndNormalizeRichText } from "@/app/(dashboard)/teacher/experiment-editor/utils/exp-editor-text-fences";

export type QuestionStatusFilter = "all" | "y" | "n" | "t";

export type QuestionsServerPagination = {
  pageIndex: number;
  pageSize: number;
  total: number;
  onPageIndexChange: (idx: number) => void;
  onPageSizeChange: (size: number) => void;
};

const QUESTION_STEM_LIMIT = 10_000;
const QUESTION_OPTION_LIMIT = 1_000;

function mapQuestionSaveError(error: unknown): string | null {
  const code = V2ApiServiceError.getBusinessCode(error);
  if (code === 4001) return "内容超过字符上限（请检查题干或选项）";
  if (code === 4002) return "题干不能为空";
  if (code === 4003) return "非法的题目类型";
  if (code === 4004) return "选项不能为空";
  return null;
}

export function useConsoleAssessmentQuestionsScreen() {
  const { role, orgId, hydrated } = useDemoRole();
  const actor = React.useMemo<CoreApiActor>(
    () => ({
      role,
      orgId,
      userId: `console-${role}-questions`,
      userName: `console-${role}-questions`,
    }),
    [role, orgId],
  );

  const [keyword, setKeyword] = React.useState("");
  const [debouncedKeyword, setDebouncedKeyword] = React.useState("");
  React.useEffect(() => {
    const t = window.setTimeout(() => setDebouncedKeyword(keyword.trim()), 320);
    return () => window.clearTimeout(t);
  }, [keyword]);

  const [statusFilter, setStatusFilter] = React.useState<QuestionStatusFilter>("all");
  const [questionTypeId, setQuestionTypeId] = React.useState<string>("");
  const [difficultyTypeId, setDifficultyTypeId] = React.useState<string>("");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(20);

  const [questionTypes, setQuestionTypes] = React.useState<V2DictItem[]>([]);
  const [difficultyTypes, setDifficultyTypes] = React.useState<V2DictItem[]>([]);
  const [questionCapacities, setQuestionCapacities] = React.useState<V2DictItem[]>([]);

  React.useEffect(() => {
    if (!hydrated) return;
    void fetchV2QuestionTypes(actor).then(setQuestionTypes).catch(() => {});
    void fetchV2DifficultyTypes(actor).then(setDifficultyTypes).catch(() => {});
    void fetchV2QuestionCapacities(actor).then(setQuestionCapacities).catch(() => {});
  }, [actor, hydrated]);

  const [items, setItems] = React.useState<V2QuestionItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const buildQuery = React.useCallback(() => {
    const page = pageIndex + 1;
    const q: Parameters<typeof fetchV2QuestionList>[1] = { page, pageSize };
    if (debouncedKeyword) q.keyword = debouncedKeyword;
    if (statusFilter !== "all") q.status = statusFilter;
    if (questionTypeId) q.questionTypeId = questionTypeId;
    if (difficultyTypeId) q.difficultyTypeId = difficultyTypeId;
    return q;
  }, [pageIndex, pageSize, debouncedKeyword, statusFilter, questionTypeId, difficultyTypeId]);

  const refresh = React.useCallback(() => {
    if (!hydrated) return;
    setLoading(true);
    void fetchV2QuestionList(actor, buildQuery())
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((e: unknown) => {
        sonnerToast.error(e instanceof Error ? e.message : "加载题目列表失败");
      })
      .finally(() => setLoading(false));
  }, [actor, hydrated, buildQuery]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    setPageIndex(0);
  }, [debouncedKeyword, statusFilter, questionTypeId, difficultyTypeId]);

  const serverPagination = React.useMemo<QuestionsServerPagination>(
    () => ({
      pageIndex,
      pageSize,
      total,
      onPageIndexChange: setPageIndex,
      onPageSizeChange: (size) => {
        setPageSize(size);
        setPageIndex(0);
      },
    }),
    [pageIndex, pageSize, total],
  );

  const removeQuestion = React.useCallback(
    async (questionId: string) => {
      await deleteV2Question(actor, questionId);
      sonnerToast.success("已删除题目");
      refresh();
    },
    [actor, refresh],
  );

  const saveCreate = React.useCallback(
    async (input: CreateQuestionInput) => {
      const normalized = sanitizeAndNormalizeRichText(input.questionContent ?? "", []);
      const stem = normalized.text;
      if (stem.length > QUESTION_STEM_LIMIT) {
        throw new Error("题干内容过长（限10000字）");
      }
      for (const row of input.selects ?? []) {
        const t = (row.selectContent ?? "").trim();
        if (t.length > QUESTION_OPTION_LIMIT) {
          throw new Error("选项内容过长（限1000字）");
        }
      }
      try {
        await createV2Question(actor, {
          ...input,
          questionContent: stem,
        });
        sonnerToast.success("已新建题目");
        refresh();
      } catch (error) {
        const mapped = mapQuestionSaveError(error);
        if (mapped) {
          sonnerToast.error(mapped);
          return;
        }
        throw error;
      }
    },
    [actor, refresh],
  );

  const saveUpdate = React.useCallback(
    async (questionId: string, patch: Omit<UpdateQuestionInput, "updaterId">) => {
      const stemRaw = patch.questionContent ?? "";
      const normalized = sanitizeAndNormalizeRichText(stemRaw, []);
      const stem = normalized.text;
      if (stem.length > QUESTION_STEM_LIMIT) {
        throw new Error("题干内容过长（限10000字）");
      }
      for (const row of patch.selects ?? []) {
        const t = (row.selectContent ?? "").trim();
        if (t.length > QUESTION_OPTION_LIMIT) {
          throw new Error("选项内容过长（限1000字）");
        }
      }
      try {
        await patchV2Question(actor, questionId, {
          ...patch,
          questionContent: stem,
        });
        sonnerToast.success("已保存修改");
        refresh();
      } catch (error) {
        const mapped = mapQuestionSaveError(error);
        if (mapped) {
          sonnerToast.error(mapped);
          return;
        }
        throw error;
      }
    },
    [actor, refresh],
  );

  const setStatus = React.useCallback(
    async (questionId: string, status: "y" | "n" | "t", rejectReason?: string) => {
      await updateV2QuestionStatus(actor, questionId, status, rejectReason);
      sonnerToast.success("状态已更新");
      refresh();
    },
    [actor, refresh],
  );

  return {
    actor,
    hydrated,
    keyword,
    setKeyword,
    statusFilter,
    setStatusFilter,
    questionTypeId,
    setQuestionTypeId,
    difficultyTypeId,
    setDifficultyTypeId,
    questionTypes,
    difficultyTypes,
    questionCapacities,
    items,
    total,
    loading,
    refresh,
    serverPagination,
    removeQuestion,
    saveCreate,
    saveUpdate,
    setStatus,
  };
}

export type ConsoleAssessmentQuestionsScreen = ReturnType<typeof useConsoleAssessmentQuestionsScreen>;
