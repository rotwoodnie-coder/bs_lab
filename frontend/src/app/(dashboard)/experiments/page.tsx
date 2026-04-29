"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@bs-lab/ui";

import { ErrorBoundary } from "@/components/business/error-boundary";
import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes";
import { ExperimentListTab } from "./_components/experiment-list-tab";
import { ExperimentGalleryTab } from "./_components/experiment-gallery-tab";

function ExperimentsPageInner() {
  return (
    <div className={`${DASHBOARD_MAIN_CONTAINER_CLASS} flex-col gap-4 py-4`}>
      <h1 className="text-xl font-semibold tracking-tight">实验</h1>
      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">我的任务</TabsTrigger>
          <TabsTrigger value="gallery">实验库</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="space-y-4">
          <ExperimentListTab />
        </TabsContent>
        <TabsContent value="gallery">
          <ExperimentGalleryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ExperimentsPage() {
  return (
    <ErrorBoundary>
      <ExperimentsPageInner />
    </ErrorBoundary>
  );
}
