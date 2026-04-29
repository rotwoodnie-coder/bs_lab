"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, Label, Switch } from "@bs-lab/ui";

import { useDevInspector } from "@/contexts/dev-inspector-context";
import type { CatalogCategory, CatalogCore, CatalogEdge } from "@/lib/experiment-catalog-api";
import { UserRole } from "@/types/auth";

import type { SchoolDimensionSnapshot } from "../../education/subject-grades/page.types";
import { ExperimentDetailAdminBar, ExperimentDetailSheetTabs } from "./experiment-detail-sheet-tabs";

export type ExperimentDetailSheetProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedCore: CatalogCore | null;
  edges: CatalogEdge[];
  edgeTab: "pending" | "all";
  setEdgeTab: (t: "pending" | "all") => void;
  canReview: boolean;
  canContribute: boolean;
  canManage: boolean;
  canEdgePurge: boolean;
  edgeDirectMode: boolean;
  onEdgeDirectModeChange: (v: boolean) => void;
  onApproveEdge: (e: CatalogEdge) => void;
  onOpenReject: (e: CatalogEdge) => void;
  onDeleteEdge: (e: CatalogEdge) => void;
  cTextbook: string;
  setCTextbook: (v: string) => void;
  cChapter: string;
  setCChapter: (v: string) => void;
  cEdition: string;
  setCEdition: (v: string) => void;
  mMat: string;
  setMMat: (v: string) => void;
  mQty: string;
  setMQty: (v: string) => void;
  mUnit: string;
  setMUnit: (v: string) => void;
  mReg: string;
  setMReg: (v: string) => void;
  mKind: string;
  setMKind: (v: string) => void;
  onSubmitChapter: () => void;
  onSubmitMaterial: () => void;
  onSubmitMedia: () => void;
  eduSnapshot?: SchoolDimensionSnapshot | null;
  role: UserRole;
  orgId: string;
  categories: CatalogCategory[];
  onDetailCoreSave: () => Promise<void>;
  focusOfficialVideo?: boolean;
  onFocusOfficialVideoConsumed?: () => void;
  hideEdgeWorkflow?: boolean;
  hideOfficialVideo?: boolean;
};

function ExperimentDetailDevViewBar() {
  const { enabled, setEnabled } = useDevInspector();
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <Switch id="experiment-detail-dev-view" checked={enabled} onCheckedChange={setEnabled} />
      <Label htmlFor="experiment-detail-dev-view" className="cursor-pointer text-xs text-muted-foreground">
        开发者视图
      </Label>
      <span className="text-[11px] text-muted-foreground/80">与控制台顶栏共用本地存储</span>
    </div>
  );
}

/** 标准实验详情：分栏标签（基础信息 / 教材映射 / 实验材料） */
export function ExperimentDetailSheet(props: ExperimentDetailSheetProps) {
  const c = props.selectedCore;
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[min(90vh,960px)] gap-0 overflow-y-auto p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border px-6 py-4 text-left">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <DialogTitle>实验列表详情</DialogTitle>
                <ExperimentDetailDevViewBar />
            </div>
            {props.hideEdgeWorkflow ? null : (
              <ExperimentDetailAdminBar
                canManage={props.canManage}
                edgeDirectMode={props.edgeDirectMode}
                onEdgeDirectModeChange={props.onEdgeDirectModeChange}
              />
            )}
          </div>
        </DialogHeader>
        <div className="space-y-4 px-6 py-4">
          {c ? (
            <ExperimentDetailSheetTabs
              selectedCore={c}
              edges={props.edges}
              edgeTab={props.edgeTab}
              setEdgeTab={props.setEdgeTab}
              canReview={props.canReview}
              canContribute={props.canContribute}
              canManage={props.canManage}
              canEdgePurge={props.canEdgePurge}
              edgeDirectMode={props.edgeDirectMode}
              onEdgeDirectModeChange={props.onEdgeDirectModeChange}
              onApproveEdge={props.onApproveEdge}
              onOpenReject={props.onOpenReject}
              onDeleteEdge={props.onDeleteEdge}
              cTextbook={props.cTextbook}
              setCTextbook={props.setCTextbook}
              cChapter={props.cChapter}
              setCChapter={props.setCChapter}
              cEdition={props.cEdition}
              setCEdition={props.setCEdition}
              mMat={props.mMat}
              setMMat={props.setMMat}
              mQty={props.mQty}
              setMQty={props.setMQty}
              mUnit={props.mUnit}
              setMUnit={props.setMUnit}
              mReg={props.mReg}
              setMReg={props.setMReg}
              mKind={props.mKind}
              setMKind={props.setMKind}
              onSubmitChapter={props.onSubmitChapter}
              onSubmitMaterial={props.onSubmitMaterial}
              onSubmitMedia={props.onSubmitMedia}
              eduSnapshot={props.eduSnapshot}
              role={props.role}
              orgId={props.orgId}
              categories={props.categories}
              onDetailCoreSave={props.onDetailCoreSave}
              focusOfficialVideo={props.focusOfficialVideo}
              onFocusOfficialVideoConsumed={props.onFocusOfficialVideoConsumed}
              hideEdgeWorkflow={props.hideEdgeWorkflow}
              hideOfficialVideo={props.hideOfficialVideo}
            />
          ) : (
            <p className="text-muted-foreground">请选择一行</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
