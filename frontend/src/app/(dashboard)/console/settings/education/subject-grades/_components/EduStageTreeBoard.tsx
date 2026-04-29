"use client";

/**
 * 教育维度「学段 → 年级 / 学科」树：可切换视图、可选编辑、可与右侧列表通过 `onSelectSubjectContext` 联动；
 * `hideZeroCountNodes` + 节点计数由 `applyStageTreeDisplayTransforms` 统一裁剪与汇总。
 */
import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Spinner,
  Switch,
  TreeView,
} from "@bs-lab/ui";
import { BookOpen, Hash, MoreHorizontal, Pencil, Plus, Trash2 } from "@bs-lab/ui/icons";

import { useOptionalLeftTreeRail } from "@/components/layout/left-tree-rail-context";
import { lucideIconForSubjectLabel } from "@/lib/tree/discipline-tree-icons";

import { EduStageGradeIcon, EduStageLevelIcon } from "../_lib/edu-stage-tree-node-icons";
import { EduStageTreeBoardDialogs } from "./EduStageTreeBoardDialogs";
import { EduStageTreeLevelIconRail } from "./EduStageTreeLevelIconRail";
import { useEduStageTreeBoardModel, type EduStageTreeBoardModelProps } from "./useEduStageTreeBoardModel";

export type EduStageTreeBoardProps = EduStageTreeBoardModelProps & {
  /** 为 true 且非编辑模式时，隐藏计数为 0 的树节点 */
  hideZeroCountNodes?: boolean;
  /** 节点标签旁展示 `displayCountById`（默认开启） */
  showNodeCounts?: boolean;
};

export function EduStageTreeBoard(props: EduStageTreeBoardProps) {
  const { hideZeroCountNodes, showNodeCounts = true, ...modelProps } = props;
  const m = useEduStageTreeBoardModel({ ...modelProps, hideZeroCountNodes });
  const rail = useOptionalLeftTreeRail();

  React.useEffect(() => {
    if (m.editMode && rail?.collapsed) {
      rail.setManualExpanded(true);
    }
  }, [m.editMode, rail]);

  const showCompactRail = Boolean(rail?.collapsed && !m.editMode);

  const countSuffix = React.useCallback(
    (nodeId: string) => {
      if (!showNodeCounts) return null;
      const n = m.displayCountById.get(nodeId);
      if (n == null) return null;
      return (
        <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
          {n}
        </span>
      );
    },
    [m.displayCountById, showNodeCounts],
  );

  return (
    <Card className="h-full border-border shadow-none">
      <CardHeader className={showCompactRail ? "pb-2 pt-3" : "pb-3"}>
        {showCompactRail ? (
          <div className="flex justify-center" title="学段树">
            {props.sortingStage ? <Spinner className="size-4" /> : <Hash className="size-4 text-muted-foreground" aria-hidden />}
          </div>
        ) : (
          <CardTitle className="flex items-center gap-2 text-base">
            学段树
            {props.sortingStage ? <Spinner className="size-4" /> : null}
          </CardTitle>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {showCompactRail ? null : (
          <div className="flex flex-wrap items-center gap-2">
            {!props.viewModeLocked ? (
              <Button
                type="button"
                size="icon"
                variant="outline"
                title={m.viewMode === "grade" ? "切换为按学科展示" : "切换为按年级展示"}
                onClick={() => m.setViewMode((prev) => (prev === "grade" ? "subject" : "grade"))}
              >
                {m.viewMode === "grade" ? <Hash className="size-4" /> : <BookOpen className="size-4" />}
              </Button>
            ) : null}
            {props.canManage ? (
              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                编辑
                <Switch checked={m.editMode} onCheckedChange={(checked) => m.setEditMode(Boolean(checked))} />
              </div>
            ) : null}
            {props.canManage && m.editMode ? (
              <Button type="button" size="sm" variant="outline" onClick={m.onAddNode}>
                <Plus className="size-4" />
                新增节点
              </Button>
            ) : null}
          </div>
        )}
        {props.loading ? (
          <div className={showCompactRail ? "py-4 text-center text-[10px] text-muted-foreground" : "py-8 text-center text-sm text-muted-foreground"}>
            学段加载中...
          </div>
        ) : showCompactRail ? (
          <EduStageTreeLevelIconRail
            stageTreeByGrade={props.stageTreeByGrade}
            selectedLevelId={props.selectedLevelId}
            onSelectLevel={(levelId) => {
              props.onSelectLevel(levelId);
              modelProps.onSelectSubjectContext?.(null);
            }}
          />
        ) : (
          <TreeView
            items={m.treeItems}
            onItemsChange={m.onItemsChange}
            selectedId={null}
            onSelect={m.handleTreeSelect}
            editMode={props.canManage && m.editMode}
            collapsedIds={m.collapsedIds}
            onCollapsedIdsChange={m.setCollapsedIds}
            indentPx={12}
            renderIcon={(item) => {
              if (item.nodeType === "level") {
                return <EduStageLevelIcon label={item.label} levelIconPath={item.levelIconPath} />;
              }
              if (item.nodeType === "subject") {
                const SubjectIco = lucideIconForSubjectLabel(item.label);
                return <SubjectIco className="size-4 shrink-0 text-muted-foreground" aria-hidden />;
              }
              return <EduStageGradeIcon />;
            }}
            renderLabel={(item) => {
              const isSelected = m.activeNodeId === item.id;
              if (item.nodeType === "level") {
                return (
                  <span className="flex items-center">
                    <span
                      className={`block rounded-md px-2 py-1 text-sm font-semibold ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted/40 text-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                    {countSuffix(item.id)}
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
                    {countSuffix(item.id)}
                  </span>
                );
              }
              return (
                <span className={`flex items-center text-sm ${isSelected ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                  {item.label}
                  {countSuffix(item.id)}
                </span>
              );
            }}
            renderTrailing={(item) =>
              props.canManage && m.editMode ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => m.setDialog({ kind: "add", nodeId: item.id, label: "" })}>
                      <Plus className="size-4" />
                      新增子节点
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => m.setDialog({ kind: "rename", nodeId: item.id, label: item.label })}>
                      <Pencil className="size-4" />
                      重命名
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => m.setPendingDeleteId(item.id)}>
                      <Trash2 className="size-4" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null
            }
            className="rounded-md border border-border bg-card p-1"
          />
        )}
      </CardContent>
      <EduStageTreeBoardDialogs
        canManage={props.canManage}
        editMode={m.editMode}
        dialog={m.dialog}
        setDialog={m.setDialog}
        pendingDeleteId={m.pendingDeleteId}
        setPendingDeleteId={m.setPendingDeleteId}
        submitDialog={m.submitDialog}
        submitDelete={m.submitDelete}
      />
    </Card>
  );
}

export type { EduStageTreeListContext } from "../page.types";
