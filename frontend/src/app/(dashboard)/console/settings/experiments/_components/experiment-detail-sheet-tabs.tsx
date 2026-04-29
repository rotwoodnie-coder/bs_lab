"use client";

import * as React from "react";

import { Label, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from "@bs-lab/ui";

import type { CatalogCategory, CatalogCore, CatalogEdge } from "@/lib/experiment-catalog-api";
import { UserRole } from "@/types/auth";

import type { SchoolDimensionSnapshot } from "../../education/subject-grades/page.types";
import { ExperimentCatalogEdgeScopeBar } from "./experiment-catalog-edge-scope-bar";
import { ExperimentCatalogEdgeSubmitForms } from "./experiment-catalog-edge-submit-forms";
import { ExperimentDetailCoreSection } from "./experiment-detail-core-section";
import { ResourceRelationPanel } from "./resource-relation-panel";

export type ExperimentDetailSheetTabsProps = {
  selectedCore: CatalogCore;
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
  /** V2 标准试验库：隐藏教材/材料边与官方视频编辑。 */
  hideEdgeWorkflow?: boolean;
  hideOfficialVideo?: boolean;
};

function edgeFilter(edges: CatalogEdge[], kinds: CatalogEdge["kind"][]) {
  const s = new Set(kinds);
  return edges.filter((e) => s.has(e.kind));
}

export function ExperimentDetailSheetTabs(props: ExperimentDetailSheetTabsProps) {
  const c = props.selectedCore;
  const chapterEdges = edgeFilter(props.edges, ["chapter"]);
  const materialEdges = edgeFilter(props.edges, ["material", "media"]);
  const [mainTab, setMainTab] = React.useState("basic");
  const showEdgeScope = !props.hideEdgeWorkflow && (mainTab === "chapters" || mainTab === "materials");

  React.useEffect(() => {
    if (props.focusOfficialVideo) setMainTab("basic");
  }, [props.focusOfficialVideo]);

  if (props.hideEdgeWorkflow) {
    return (
      <Tabs value="basic" className="w-full">
        <TabsList className="mb-3 w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="basic">基础信息</TabsTrigger>
        </TabsList>
        <TabsContent value="basic" className="mt-0 space-y-4">
          <ExperimentDetailCoreSection
            core={c}
            eduSnapshot={props.eduSnapshot ?? null}
            canManage={props.canManage}
            role={props.role}
            orgId={props.orgId}
            categories={props.categories}
            onDetailCoreSave={props.onDetailCoreSave}
            focusOfficialVideo={props.hideOfficialVideo ? false : props.focusOfficialVideo}
            onFocusOfficialVideoConsumed={props.onFocusOfficialVideoConsumed}
            hideOfficialVideo={props.hideOfficialVideo}
          />
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
      <TabsList className="mb-3 w-full flex-wrap justify-start gap-1">
        <TabsTrigger value="basic">基础信息</TabsTrigger>
        <TabsTrigger value="chapters">教材映射</TabsTrigger>
        <TabsTrigger value="materials">实验材料</TabsTrigger>
      </TabsList>
      {showEdgeScope ? (
        <div className="mb-3 flex flex-wrap items-center justify-end border-b border-border pb-3">
          <ExperimentCatalogEdgeScopeBar edgeTab={props.edgeTab} setEdgeTab={props.setEdgeTab} />
        </div>
      ) : null}
      <TabsContent value="basic" className="mt-0 space-y-4">
        <ExperimentDetailCoreSection
          core={c}
          eduSnapshot={props.eduSnapshot ?? null}
          canManage={props.canManage}
          role={props.role}
          orgId={props.orgId}
          categories={props.categories}
          onDetailCoreSave={props.onDetailCoreSave}
          focusOfficialVideo={props.focusOfficialVideo}
          onFocusOfficialVideoConsumed={props.onFocusOfficialVideoConsumed}
          hideOfficialVideo={props.hideOfficialVideo}
        />
      </TabsContent>
      <TabsContent value="chapters" className="mt-0 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">章节映射</h3>
        <ResourceRelationPanel
          key={`${c.id}-chapter`}
          edges={chapterEdges}
          role={props.role}
          orgId={props.orgId}
          canReview={props.canReview}
          canEdgePurge={props.canEdgePurge}
          onApproveEdge={props.onApproveEdge}
          onOpenReject={props.onOpenReject}
          onDeleteEdge={props.onDeleteEdge}
        />
        {props.canContribute ? (
          <ExperimentCatalogEdgeSubmitForms
            mode="chapter"
            role={props.role}
            orgId={props.orgId}
            canManage={props.canManage}
            edgeDirectMode={props.edgeDirectMode}
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
          />
        ) : null}
      </TabsContent>
      <TabsContent value="materials" className="mt-0 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">材料与媒体</h3>
        <ResourceRelationPanel
          key={`${c.id}-materials`}
          edges={materialEdges}
          role={props.role}
          orgId={props.orgId}
          canReview={props.canReview}
          canEdgePurge={props.canEdgePurge}
          onApproveEdge={props.onApproveEdge}
          onOpenReject={props.onOpenReject}
          onDeleteEdge={props.onDeleteEdge}
        />
        {props.canContribute ? (
          <ExperimentCatalogEdgeSubmitForms
            mode="materials"
            role={props.role}
            orgId={props.orgId}
            canManage={props.canManage}
            edgeDirectMode={props.edgeDirectMode}
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
          />
        ) : null}
      </TabsContent>
    </Tabs>
  );
}

export function ExperimentDetailAdminBar(props: {
  canManage: boolean;
  edgeDirectMode: boolean;
  onEdgeDirectModeChange: (v: boolean) => void;
}) {
  if (!props.canManage) return null;
  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex items-center gap-2">
        <Switch
          id="catalog-edge-direct"
          checked={props.edgeDirectMode}
          onCheckedChange={props.onEdgeDirectModeChange}
        />
        <Label htmlFor="catalog-edge-direct" className="cursor-pointer text-xs text-muted-foreground">
          边提交直通（保存为已通过）
        </Label>
      </div>
    </div>
  );
}
