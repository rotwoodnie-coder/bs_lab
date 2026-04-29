"use client";

import * as React from "react";
import { Badge, Button, TreeView } from "@bs-lab/ui";
import { BookOpen, Hash, Leaf, Microscope, GraduationCap } from "@bs-lab/ui/icons";

import type { CatalogCore } from "@/lib/experiment-catalog-api";

import { catalogArchitectureNodeMetrics } from "../experiment-catalog-architecture-filter";
import type { SchoolDimensionSnapshot, SchoolLevelTreeNode } from "../../education/subject-grades/page.types";

function stageIconByLabel(label: string) {
  if (label.includes("小学")) return <Leaf className="size-5 text-primary" />;
  if (label.includes("初中")) return <Microscope className="size-5 text-primary" />;
  if (label.includes("高中")) return <GraduationCap className="size-5 text-primary" />;
  return <Leaf className="size-5 text-primary" />;
}

export function ExperimentCatalogArchitectureTree(props: {
  snapshot: SchoolDimensionSnapshot | null;
  items: CatalogCore[];
  treeByGrade: SchoolLevelTreeNode[];
  treeBySubject: SchoolLevelTreeNode[];
  viewMode: "grade" | "subject";
  onViewModeChange: (mode: "grade" | "subject") => void;
  selectedNodeId: string | null;
  onSelectNodeId: (id: string | null) => void;
}) {
  const [collapsedIds, setCollapsedIds] = React.useState<Set<string>>(() => new Set());

  const treeItems = props.viewMode === "grade" ? props.treeByGrade : props.treeBySubject;

  React.useEffect(() => {
    const next = new Set<string>();
    const collect = (items: SchoolLevelTreeNode[], depth: number) => {
      for (const item of items) {
        const children = (item.children as SchoolLevelTreeNode[] | undefined) ?? [];
        if (depth >= 1 && children.length > 0) next.add(item.id);
        if (children.length > 0) collect(children, depth + 1);
      }
    };
    collect(treeItems, 0);
    setCollapsedIds(next);
  }, [treeItems]);

  const metrics = React.useMemo(
    () => catalogArchitectureNodeMetrics(props.items, treeItems, props.snapshot),
    [props.items, treeItems, props.snapshot],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          title={props.viewMode === "grade" ? "切换为按学科展示" : "切换为按年级展示"}
          onClick={() => props.onViewModeChange(props.viewMode === "grade" ? "subject" : "grade")}
        >
          {props.viewMode === "grade" ? <Hash className="size-4" /> : <BookOpen className="size-4" />}
        </Button>
        {props.selectedNodeId ? (
          <Button type="button" size="sm" variant="ghost" className="text-xs" onClick={() => props.onSelectNodeId(null)}>
            清除筛选
          </Button>
        ) : null}
      </div>
      {!props.snapshot || treeItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无教学维度数据，请先配置教学架构。</p>
      ) : (
        <TreeView
          items={treeItems}
          selectedId={props.selectedNodeId}
          onSelect={(id) => props.onSelectNodeId(String(id))}
          editMode={false}
          collapsedIds={collapsedIds}
          onCollapsedIdsChange={setCollapsedIds}
          indentPx={12}
          renderIcon={(item) =>
            item.nodeType === "level" ? (
              stageIconByLabel(item.label)
            ) : item.nodeType === "subject" ? (
              <img
                src={`/${item.subjectIconPath ?? "assets/edu-icons/subjects/sub_science.svg"}`}
                alt=""
                className="size-4 object-contain"
              />
            ) : (
              <Hash className="size-3.5 text-muted-foreground" />
            )
          }
          renderLabel={(item) => {
            const isSelected = props.selectedNodeId === item.id;
            if (item.nodeType === "level") {
              return (
                <span
                  className={`block rounded-md px-2 py-1 text-sm font-semibold ${
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted/40 text-foreground"
                  }`}
                >
                  {item.label}
                </span>
              );
            }
            if (item.nodeType === "grade") {
              return (
                <span className="ml-1 flex items-center gap-2">
                  <span className="h-5 border-l border-border/70" />
                  <span className={`text-xs ${isSelected ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                    {item.label}
                  </span>
                </span>
              );
            }
            return (
              <span className={`text-sm ${isSelected ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            );
          }}
          renderTrailing={(item) => {
            const { count } = metrics(item.id);
            return (
              <Badge variant="outline" className="h-5 px-1.5 text-[11px] font-normal tabular-nums">
                {count}
              </Badge>
            );
          }}
          className="rounded-md border border-border bg-card p-1"
        />
      )}
    </div>
  );
}
