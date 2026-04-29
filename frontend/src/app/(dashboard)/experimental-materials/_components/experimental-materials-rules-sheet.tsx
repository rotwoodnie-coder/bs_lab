"use client";

import * as React from "react";
import { Button, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@bs-lab/ui";
import { MaterialDimensionsRulesPanels } from "./material-dimensions-rules-panels";
import { useMaterialDimensionsRules } from "./use-material-dimensions-rules";

export type ExperimentalMaterialsRulesSection = "material-type" | "material-category" | "risk";

const NAV: { id: ExperimentalMaterialsRulesSection; label: string }[] = [
  { id: "material-type", label: "材料属性" },
  { id: "material-category", label: "材料分类" },
  { id: "risk", label: "风险提示" },
];

function sectionDescription(id: ExperimentalMaterialsRulesSection): string {
  switch (id) {
    case "material-type":
      return "在此维护材料属性维表，支持增删改查。";
    case "material-category":
      return "在此维护材料分类维表，支持增删改查。";
    case "risk":
      return "在此维护风险提示维表，并与材料列表中的风险档位保持一致。";
    default:
      return "";
  }
}

export function ExperimentalMaterialsRulesSheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [section, setSection] = React.useState<ExperimentalMaterialsRulesSection>("material-type");
  const dimensions = useMaterialDimensionsRules();

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent side="right" className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-[min(960px,96vw)]">
        <SheetHeader className="border-b border-border px-6 py-4 text-left">
          <SheetTitle>规则管理</SheetTitle>
          <SheetDescription>集中维护实验材料维表与安全、适用面规则，不改变左侧主导航结构。</SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1">
          <nav className="flex w-44 shrink-0 flex-col gap-1 border-r border-border bg-muted/30 p-3">
            {NAV.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant={section === item.id ? "secondary" : "ghost"}
                size="sm"
                className="justify-start"
                onClick={() => setSection(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </nav>
          <div className="min-w-0 flex-1 overflow-auto p-6">
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{sectionDescription(section)}</p>
            <MaterialDimensionsRulesPanels
              section={section}
              canMaintain={dimensions.canMaintain}
              loading={dimensions.loading}
              dimensions={dimensions.dimensions}
              createType={dimensions.createType}
              updateType={dimensions.updateType}
              deleteType={dimensions.deleteType}
              createCategory={dimensions.createCategory}
              updateCategory={dimensions.updateCategory}
              deleteCategory={dimensions.deleteCategory}
              createSafetyTag={dimensions.createSafetyTag}
              updateSafetyTag={dimensions.updateSafetyTag}
              deleteSafetyTag={dimensions.deleteSafetyTag}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
