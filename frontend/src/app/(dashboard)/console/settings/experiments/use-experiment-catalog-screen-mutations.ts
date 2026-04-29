"use client";

import * as React from "react";

import { sonnerToast } from "@bs-lab/ui";

import type { CatalogEdge } from "@/lib/experiment-catalog-api";
import type { UserRole } from "@/types/auth";

import type { ExperimentCatalogPageModel } from "./page.hooks";

type MutOpts = {
  st: ExperimentCatalogPageModel;
  role: UserRole;
  orgId: string;
  canManage: boolean;
  edgeDirectMode: boolean;
  cTextbook: string;
  cChapter: string;
  cEdition: string;
  mMat: string;
  mQty: string;
  mUnit: string;
  mReg: string;
  mKind: string;
};

function edgeWorkflowDisabledToast() {
  sonnerToast.message("当前实验目录已对接 V2 标准试验库，教材与材料映射不在此页维护。");
}

export function useExperimentCatalogScreenMutations(opts: MutOpts) {
  const { st } = opts;

  const run = React.useCallback(
    async (fn: () => Promise<void>, ok: string) => {
      try {
        await fn();
        sonnerToast.success(ok);
        await st.refreshList();
        await st.refreshCategories();
        await st.loadEdges();
      } catch (e) {
        sonnerToast.error(e instanceof Error ? e.message : "操作失败");
      }
    },
    [st],
  );

  const submitChapter = React.useCallback(() => {
    edgeWorkflowDisabledToast();
  }, []);

  const submitMaterial = React.useCallback(() => {
    edgeWorkflowDisabledToast();
  }, []);

  const submitMedia = React.useCallback(() => {
    edgeWorkflowDisabledToast();
  }, []);

  const handleDeleteEdge = React.useCallback((_e: CatalogEdge) => {
    edgeWorkflowDisabledToast();
  }, []);

  const approveEdge = React.useCallback((_e: CatalogEdge) => {
    edgeWorkflowDisabledToast();
  }, []);

  return { run, submitChapter, submitMaterial, submitMedia, handleDeleteEdge, approveEdge };
}
