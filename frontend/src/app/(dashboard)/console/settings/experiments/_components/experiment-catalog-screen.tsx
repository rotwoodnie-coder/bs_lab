"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";

import type { CatalogCore, CatalogEdge } from "@/lib/experiment-catalog-api";
import { fetchV2ExpLibraryById, patchV2ExpLibrary } from "@/lib/v2/v2-exp-api";

import { useExperimentCatalogPage } from "../page.hooks";
import { useExperimentCatalogScreenMutations } from "../use-experiment-catalog-screen-mutations";
import { useCatalogCoreSheet } from "../use-catalog-core-sheet";
import { buildExpCatalogListActor, v2ExpLibraryItemToCatalogCore } from "../v2-exp-library-catalog-adapter";
import { DeleteStandardCoreDialog } from "./delete-standard-core-dialog";
import { ExperimentCatalogPageView } from "./experiment-catalog-page-view";
import { ExperimentDetailSheet } from "./experiment-detail-sheet";
import { NewStandardCoreSheet } from "./new-standard-core-sheet";
import { RejectEdgeDialog } from "./reject-edge-dialog";

export function ExperimentCatalogScreen() {
  const st = useExperimentCatalogPage();
  const { role, orgId, canManage, canReview, canContribute, canEdgePurge, snapshot, categories } = st;

  const catalogActor = React.useMemo(() => buildExpCatalogListActor(role, orgId), [role, orgId]);

  const coreSheet = useCatalogCoreSheet({
    role,
    orgId,
    snapshot,
    categories,
    refreshList: st.refreshList,
    refreshCategories: st.refreshCategories,
    loadEdges: st.loadEdges,
  });

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailCore, setDetailCore] = React.useState<CatalogCore | null>(null);
  const [detailVideoFocus, setDetailVideoFocus] = React.useState(false);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<CatalogCore | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const [cTextbook, setCTextbook] = React.useState("");
  const [cChapter, setCChapter] = React.useState("");
  const [cEdition, setCEdition] = React.useState("");
  const [mMat, setMMat] = React.useState("");
  const [mQty, setMQty] = React.useState("1");
  const [mUnit, setMUnit] = React.useState("件");
  const [mReg, setMReg] = React.useState("");
  const [mKind, setMKind] = React.useState("VIDEO");

  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectEdge, setRejectEdge] = React.useState<CatalogEdge | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");

  const [edgeDirectMode, setEdgeDirectMode] = React.useState(false);

  const { submitChapter, submitMaterial, submitMedia, handleDeleteEdge, approveEdge } =
    useExperimentCatalogScreenMutations({
      st,
      role,
      orgId,
      canManage,
      edgeDirectMode,
      cTextbook,
      cChapter,
      cEdition,
      mMat,
      mQty,
      mUnit,
      mReg,
      mKind,
    });

  const onPatchCoreStatus = React.useCallback(
    async (id: string, status: number) => {
      try {
        await patchV2ExpLibrary(catalogActor, id, { status: status === 1 ? "y" : "n" });
        sonnerToast.success(status === 1 ? "已启用" : "已停用");
        await st.refreshList();
      } catch (e) {
        sonnerToast.error(e instanceof Error ? e.message : "状态更新失败");
        throw e;
      }
    },
    [catalogActor, st],
  );

  React.useEffect(() => {
    if (!detailOpen || !st.selectedId || !st.hydrated) {
      setDetailCore(null);
      return;
    }
    const seed = st.selectedCore?.id === st.selectedId ? st.selectedCore : null;
    setDetailCore(seed);

    let cancelled = false;
    void fetchV2ExpLibraryById(catalogActor, st.selectedId)
      .then((row) => {
        if (!cancelled) setDetailCore(v2ExpLibraryItemToCatalogCore(row, snapshot));
      })
      .catch(() => {
        if (cancelled) return;
        if (seed) {
          setDetailCore(seed);
          sonnerToast.message("详情暂未能从服务器刷新", {
            description: "已使用当前列表中的数据展示。请确认后端 /v2/exp-library 可用。",
          });
          return;
        }
        setDetailCore(null);
        sonnerToast.error("标准试验不存在或暂时无法访问", {
          description: "请确认该条仍在目录中，或检查网络与接口配置。",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [detailOpen, st.selectedId, st.hydrated, st.selectedCore, catalogActor, snapshot]);

  const refetchDetailAfterCoreSave = React.useCallback(async () => {
    await st.refreshList();
    await st.refreshCategories();
    const sid = st.selectedId;
    if (sid) {
      try {
        const row = await fetchV2ExpLibraryById(catalogActor, sid);
        setDetailCore(v2ExpLibraryItemToCatalogCore(row, snapshot));
      } catch {
        /* 不因单次拉取失败清空抽屉 */
      }
    }
    await st.loadEdges();
  }, [st, catalogActor, snapshot]);

  const confirmDeleteCore = () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    void (async () => {
      try {
        await patchV2ExpLibrary(catalogActor, deleteTarget.id, { status: "n" });
        sonnerToast.success("已停用");
        setDeleteOpen(false);
        setDeleteTarget(null);
        if (st.selectedId === deleteTarget.id) {
          st.setSelectedId(null);
          setDetailOpen(false);
          setDetailCore(null);
        }
        await st.refreshList();
        await st.loadEdges();
      } catch (e) {
        sonnerToast.error(e instanceof Error ? e.message : "操作失败");
      } finally {
        setDeleteLoading(false);
      }
    })();
  };

  const openReject = (e: CatalogEdge) => {
    setRejectEdge(e);
    setRejectReason("");
    setRejectOpen(true);
  };

  const confirmReject = () => {
    sonnerToast.message("当前实验目录已对接 V2 标准试验库，边审批不在此页维护。");
    setRejectOpen(false);
    setRejectEdge(null);
  };

  return (
    <>
      <ExperimentCatalogPageView
        model={st}
        onOpenNewCore={coreSheet.openNew}
        onRowOpen={(row) => {
          st.setSelectedId(row.id);
          setDetailVideoFocus(false);
          setDetailOpen(true);
        }}
        onOpenEditFocusVideo={(row) => {
          st.setSelectedId(row.id);
          setDetailVideoFocus(true);
          setDetailOpen(true);
        }}
        onPatchCoreStatus={onPatchCoreStatus}
        onDeleteRow={(row) => {
          setDeleteTarget(row);
          setDeleteOpen(true);
        }}
      />

      <NewStandardCoreSheet
        open={coreSheet.open}
        onOpenChange={coreSheet.onSheetOpenChange}
        snapshot={snapshot}
        categories={categories}
        coreCode={coreSheet.coreCode}
        setCoreCode={coreSheet.setCoreCode}
        coreName={coreSheet.coreName}
        setCoreName={coreSheet.setCoreName}
        coreStage={coreSheet.coreStage}
        setCoreStage={coreSheet.setCoreStage}
        coreSubject={coreSheet.coreSubject}
        setCoreSubject={coreSheet.setCoreSubject}
        coreGradeIds={coreSheet.coreGradeIds}
        setCoreGradeIds={coreSheet.setCoreGradeIds}
        coreMandatory={coreSheet.coreMandatory}
        setCoreMandatory={coreSheet.setCoreMandatory}
        coreCat={coreSheet.coreCat}
        setCoreCat={coreSheet.setCoreCat}
        coreVideo={coreSheet.coreVideo}
        setCoreVideo={coreSheet.setCoreVideo}
        videoPickerOpen={coreSheet.videoPickerOpen}
        setVideoPickerOpen={coreSheet.setVideoPickerOpen}
        onSubmit={() => void coreSheet.submit()}
      />

      <DeleteStandardCoreDialog
        open={deleteOpen}
        onOpenChange={(o) => {
          setDeleteOpen(o);
          if (!o) setDeleteTarget(null);
        }}
        target={deleteTarget}
        loading={deleteLoading}
        onConfirm={confirmDeleteCore}
      />

      <ExperimentDetailSheet
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            st.setSelectedId(null);
            setDetailCore(null);
            setDetailVideoFocus(false);
            setEdgeDirectMode(false);
          }
        }}
        selectedCore={detailCore ?? st.selectedCore}
        edges={st.edges}
        edgeTab={st.edgeTab}
        setEdgeTab={st.setEdgeTab}
        canReview={canReview}
        canContribute={canContribute}
        canManage={canManage}
        canEdgePurge={canEdgePurge}
        edgeDirectMode={edgeDirectMode}
        onEdgeDirectModeChange={setEdgeDirectMode}
        onApproveEdge={approveEdge}
        onOpenReject={openReject}
        onDeleteEdge={handleDeleteEdge}
        cTextbook={cTextbook}
        setCTextbook={setCTextbook}
        cChapter={cChapter}
        setCChapter={setCChapter}
        cEdition={cEdition}
        setCEdition={setCEdition}
        mMat={mMat}
        setMMat={setMMat}
        mQty={mQty}
        setMQty={setMQty}
        mUnit={mUnit}
        setMUnit={setMUnit}
        mReg={mReg}
        setMReg={setMReg}
        mKind={mKind}
        setMKind={setMKind}
        onSubmitChapter={submitChapter}
        onSubmitMaterial={submitMaterial}
        onSubmitMedia={submitMedia}
        eduSnapshot={snapshot}
        role={role}
        orgId={orgId}
        categories={categories}
        onDetailCoreSave={refetchDetailAfterCoreSave}
        focusOfficialVideo={detailVideoFocus}
        onFocusOfficialVideoConsumed={() => setDetailVideoFocus(false)}
        hideEdgeWorkflow
        hideOfficialVideo
      />

      <RejectEdgeDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        reason={rejectReason}
        setReason={setRejectReason}
        onConfirm={confirmReject}
      />
    </>
  );
}
