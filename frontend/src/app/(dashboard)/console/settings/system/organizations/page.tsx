"use client";

import * as React from "react";
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@bs-lab/ui";
import { RefreshCw } from "@bs-lab/ui/icons";

import { PageHeader } from "@/components/layout/page-header";
import { LeftTreeRightTableLayout } from "@/components/layout/left-tree-right-table-layout";

import { OrgCreateDialog } from "./_components/OrgCreateDialog";
import { OrgDetailPanel } from "./_components/OrgDetailPanel";
import { OrgTreeBoard } from "./_components/OrgTreeBoard";
import { OrgTypesPanel } from "./_components/OrgTypesPanel";
import { useOrgTypesTab } from "./org-types-tab.hooks";
import { useOrganizations } from "./page.hooks";

export default function ConsoleOrganizationsPage() {
  const [mainTab, setMainTab] = React.useState("orgs");
  const {
    orgTree,
    loading,
    selectedId,
    setSelectedId,
    selectedOrg,
    selectedPath,
    childOrgs,
    descendantOrgs,
    refresh,
    orgTypeLabels,
    gradeLabels,
    orgTypeOptions,
    gradeOptions,
    levelOptions,
    isSuperAdmin,
    applySchoolGradeClassStructure,
    clearSchoolGradeClassStructure,
    exportSubtreeJson,
    createOpen,
    setCreateOpen,
    submitting,
    handleCreate,
    handlePatch,
    handleDeleteOrg,
    deleteBusy,
  } = useOrganizations();

  const typesTab = useOrgTypesTab();

  return (
    <div className="min-h-0 space-y-4">
      <PageHeader
        title="组织管理"
        description={
          <>组织树与 <span className="font-mono">sys_org</span> 对齐；「组织类型」页维护 <span className="font-mono">data_org_type</span>（与组织表单下拉联动，切换回「组织架构」时将刷新字典）。</>
        }
        actions={
          <Button type="button" variant="outline" size="sm" className="rounded-md gap-2" onClick={() => void refresh()}>
            <RefreshCw className="size-4" />
            刷新组织数据
          </Button>
        }
      />

      <Tabs
        value={mainTab}
        onValueChange={(v) => {
          setMainTab(v);
          if (v === "orgs") void refresh();
        }}
        className="min-h-0 space-y-4"
      >
        <TabsList className="h-9 w-full max-w-md justify-start">
          <TabsTrigger value="orgs" className="px-4">
            组织架构
          </TabsTrigger>
          <TabsTrigger value="types" className="px-4">
            组织类型
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orgs" className="mt-0 min-h-0 space-y-0 focus-visible:outline-none">
          <LeftTreeRightTableLayout
            className="min-h-[min(72dvh,640px)]"
            leftTitle="机构树"
            left={
              <OrgTreeBoard
                loading={loading}
                orgTree={orgTree}
                selectedId={selectedId}
                onSelect={setSelectedId}
                orgTypeLabels={orgTypeLabels}
              />
            }
            right={
              <div className="min-h-0 min-w-0">
                <OrgDetailPanel
                  selectedOrg={selectedOrg}
                  selectedPath={selectedPath}
                  childOrgs={childOrgs}
                  descendantOrgs={descendantOrgs}
                  orgTypeLabels={orgTypeLabels}
                  gradeLabels={gradeLabels}
                  orgTypeOptions={orgTypeOptions}
                  gradeOptions={gradeOptions}
                  levelOptions={levelOptions}
                  isSuperAdmin={isSuperAdmin}
                  submitting={submitting}
                  onPatchOrg={handlePatch}
                  onApplySchoolStructure={applySchoolGradeClassStructure}
                  onClearSchoolStructure={clearSchoolGradeClassStructure}
                  onSelectId={setSelectedId}
                  onCreateChild={() => setCreateOpen(true)}
                  onExport={exportSubtreeJson}
                  onDeleteOrg={handleDeleteOrg}
                  deleteBusy={deleteBusy}
                />
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="types" className="mt-0 min-h-0 focus-visible:outline-none">
          <OrgTypesPanel
            rows={typesTab.rows}
            loading={typesTab.loading}
            submitting={typesTab.submitting}
            canMutate={typesTab.canMutate}
            onRefreshTypes={typesTab.refreshTypes}
            onCreate={typesTab.handleCreate}
            onPatch={typesTab.handlePatch}
            onDelete={typesTab.handleDelete}
          />
        </TabsContent>
      </Tabs>

      <OrgCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        parentOrgName={selectedOrg?.orgName}
        orgTypeOptions={orgTypeOptions}
        gradeOptions={gradeOptions}
        submitting={submitting}
        onSubmit={handleCreate}
      />
    </div>
  );
}
