"use client";

import * as React from "react";

import type { CoreApiActor } from "@/lib/core-api-shared";
import type { V2DictItem } from "@/lib/v2/v2-exp-api";
import {
  fetchV2DifficultyTypes,
  fetchV2MaterialProps,
  fetchV2MaterialTypes,
  fetchV2MaterialUnits,
  fetchV2QuestionCapacities,
  fetchV2QuestionTypes,
  fetchV2SchoolGrades,
  fetchV2SchoolLevels,
  fetchV2SchoolSubjects,
} from "@/lib/v2/v2-exp-api";

export type V2DictCatalog = {
  schoolLevels: V2DictItem[];
  schoolGrades: V2DictItem[];
  schoolSubjects: V2DictItem[];
  difficultyTypes: V2DictItem[];
  questionTypes: V2DictItem[];
  questionCapacities: V2DictItem[];
  materialTypes: V2DictItem[];
  materialProps: V2DictItem[];
  materialUnits: V2DictItem[];
};

const EMPTY: V2DictCatalog = {
  schoolLevels: [],
  schoolGrades: [],
  schoolSubjects: [],
  difficultyTypes: [],
  questionTypes: [],
  questionCapacities: [],
  materialTypes: [],
  materialProps: [],
  materialUnits: [],
};

async function loadAll(actor: CoreApiActor): Promise<V2DictCatalog> {
  const [
    schoolLevels,
    schoolGrades,
    schoolSubjects,
    difficultyTypes,
    questionTypes,
    questionCapacities,
    materialTypes,
    materialProps,
    materialUnits,
  ] = await Promise.all([
    fetchV2SchoolLevels(actor),
    fetchV2SchoolGrades(actor),
    fetchV2SchoolSubjects(actor),
    fetchV2DifficultyTypes(actor),
    fetchV2QuestionTypes(actor),
    fetchV2QuestionCapacities(actor),
    fetchV2MaterialTypes(actor),
    fetchV2MaterialProps(actor),
    fetchV2MaterialUnits(actor),
  ]);
  return {
    schoolLevels,
    schoolGrades,
    schoolSubjects,
    difficultyTypes,
    questionTypes,
    questionCapacities,
    materialTypes,
    materialProps,
    materialUnits,
  };
}

/**
 * 并行加载常用 V2 字典，供控制台筛选、表单下拉等复用，避免各页重复编排请求。
 */
export function useV2DictCatalog(actor: CoreApiActor): {
  dict: V2DictCatalog;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [dict, setDict] = React.useState<V2DictCatalog>(EMPTY);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!actor.userId?.trim()) {
      setDict(EMPTY);
      setLoading(false);
      setError("缺少用户身份，无法加载字典");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setDict(await loadAll(actor));
    } catch (e) {
      setDict(EMPTY);
      setError(e instanceof Error ? e.message : "字典加载失败");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return { dict, loading, error, refresh };
}
