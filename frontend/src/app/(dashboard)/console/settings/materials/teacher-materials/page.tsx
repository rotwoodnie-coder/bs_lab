"use client";

import { Card, CardContent } from "@bs-lab/ui";

import { PageHeader } from "@/components/layout/page-header";
import { MaterialCategoryCatalogPanel } from "./_components/material-category-catalog-panel";
import { useMaterialCategoryCatalogScreen } from "./page.hooks";

export default function ConsoleTeacherMaterialsConfigPage() {
  const screen = useMaterialCategoryCatalogScreen();

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <div className="flex flex-wrap items-center gap-2">
            <span>实验材料分类</span>
            <span className="inline-flex rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
              材料分类（业务视图）
            </span>
          </div>
        }
      />
      <Card className="border-border shadow-none">
        <CardContent className="min-w-0">
          <MaterialCategoryCatalogPanel rows={screen.rows} ready={screen.ready} />
        </CardContent>
      </Card>
    </div>
  );
}
