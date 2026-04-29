"use client";

import * as React from "react";
import { sonnerToast } from "@bs-lab/ui";

import { applyStageTreeDisplayTransforms } from "@/lib/edu-dimension-stage-tree-display";

import type { EduStageTreeListContext, SchoolLevelTreeNode } from "../page.types";

export type EduStageTreeBoardModelProps = {
  loading: boolean;
  stageTreeByGrade: SchoolLevelTreeNode[];
  stageTreeBySubject: SchoolLevelTreeNode[];
  selectedLevelId: string;
  sortingStage: boolean;
  canManage: boolean;
  onSelectLevel: (levelId: string) => void;
  onReorderStageTree: (tree: SchoolLevelTreeNode[]) => void;
  onPersistLevelSubjectOrder: (levelId: string, linkKeysInOrder: string[]) => void;
  onPersistLevelGradeOrder: (levelId: string, gradeIdsInOrder: string[]) => void;
  defaultViewMode?: "grade" | "subject";
  viewModeLocked?: "grade" | "subject";
  onSelectSubjectContext?: (ctx: EduStageTreeListContext) => void;
  highlightSubjectId?: string;
  highlightGradeId?: string;
  hideZeroCountNodes?: boolean;
};

function buildListContextFromNode(item: SchoolLevelTreeNode | undefined): EduStageTreeListContext {
  if (!item?.levelId) return null;
  if (item.nodeType === "level") return null;
  if (item.nodeType === "subject" && item.subjectId) {
    return { levelId: item.levelId, subjectId: item.subjectId, gradeId: item.gradeId };
  }
  if (item.nodeType === "grade" && item.gradeId) {
    if (item.subjectId) {
      return { levelId: item.levelId, subjectId: item.subjectId, gradeId: item.gradeId };
    }
    return { levelId: item.levelId, gradeId: item.gradeId };
  }
  return null;
}

export function useEduStageTreeBoardModel(props: EduStageTreeBoardModelProps) {
  const [viewMode, setViewMode] = React.useState<"grade" | "subject">(
    () => props.viewModeLocked ?? props.defaultViewMode ?? "grade",
  );
  const [editMode, setEditMode] = React.useState(false);
  const [treeItems, setTreeItems] = React.useState<SchoolLevelTreeNode[]>([]);
  const [collapsedIds, setCollapsedIds] = React.useState<Set<string>>(() => new Set());
  const [dialog, setDialog] = React.useState<null | { kind: "add" | "rename"; nodeId: string; label: string }>(null);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (props.viewModeLocked) setViewMode(props.viewModeLocked);
  }, [props.viewModeLocked]);

  const effectiveViewMode = props.viewModeLocked ?? viewMode;
  const sourceTree = React.useMemo(
    () => (effectiveViewMode === "grade" ? props.stageTreeByGrade : props.stageTreeBySubject),
    [props.stageTreeByGrade, props.stageTreeBySubject, effectiveViewMode],
  );

  const { tree: skeletonTree, countById: displayCountById } = React.useMemo(
    () => applyStageTreeDisplayTransforms(sourceTree, Boolean(props.hideZeroCountNodes) && !editMode),
    [sourceTree, props.hideZeroCountNodes, editMode],
  );

  React.useEffect(() => {
    setTreeItems(skeletonTree);
  }, [skeletonTree]);

  React.useEffect(() => {
    const next = new Set<string>();
    const collect = (items: SchoolLevelTreeNode[], depth: number) => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const children = (item?.children as SchoolLevelTreeNode[] | undefined) ?? [];
        if (depth >= 1 && children.length > 0) {
          next.add(item.id);
        }
        if (children.length > 0) {
          collect(children, depth + 1);
        }
      }
    };
    collect(sourceTree, 0);
    setCollapsedIds(next);
  }, [sourceTree]);

  const itemMap = React.useMemo(() => {
    const map = new Map<string, SchoolLevelTreeNode>();
    const walk = (items: SchoolLevelTreeNode[]) => {
      for (const item of items) {
        map.set(item.id, item);
        if (item.children?.length) walk(item.children as SchoolLevelTreeNode[]);
      }
    };
    walk(treeItems);
    return map;
  }, [treeItems]);

  const levelOnly = React.useMemo(() => treeItems.filter((node) => node.nodeType === "level"), [treeItems]);
  const selectedLevelNodeId = props.selectedLevelId ? `level-${props.selectedLevelId}` : "";
  const [activeNodeId, setActiveNodeId] = React.useState<string>(selectedLevelNodeId);

  React.useEffect(() => {
    if (props.onSelectSubjectContext) return;
    if (selectedLevelNodeId) setActiveNodeId(selectedLevelNodeId);
  }, [selectedLevelNodeId, props.onSelectSubjectContext]);

  React.useEffect(() => {
    const sid = props.highlightSubjectId?.trim();
    const gid = props.highlightGradeId?.trim();
    if (!sid || !props.onSelectSubjectContext) return;
    if (gid) {
      for (const [, item] of itemMap) {
        if (item.nodeType !== "grade") continue;
        if (item.subjectId !== sid) continue;
        if (item.gradeId !== gid) continue;
        if (props.selectedLevelId && item.levelId !== props.selectedLevelId) continue;
        setActiveNodeId(item.id);
        return;
      }
    }
    for (const [, item] of itemMap) {
      if (item.subjectId !== sid) continue;
      if (item.nodeType !== "subject") continue;
      if (props.selectedLevelId && item.levelId !== props.selectedLevelId) continue;
      setActiveNodeId(item.id);
      return;
    }
  }, [props.highlightSubjectId, props.highlightGradeId, props.onSelectSubjectContext, props.selectedLevelId, itemMap]);

  const withTreeMutation = React.useCallback((mutator: (prev: SchoolLevelTreeNode[]) => SchoolLevelTreeNode[]) => {
    setTreeItems((prev) => mutator(prev));
  }, []);

  const onItemsChange = React.useCallback(
    (next: SchoolLevelTreeNode[]) => {
      const prevTopLevels = treeItems.filter((item) => item.nodeType === "level").map((item) => item.levelId);
      const nextTopLevels = next.filter((item) => item.nodeType === "level").map((item) => item.levelId);
      setTreeItems(next);
      const topLevels = next.filter((item) => item.nodeType === "level");
      const levelOrderChanged =
        prevTopLevels.length !== nextTopLevels.length ||
        prevTopLevels.some((id, index) => id !== nextTopLevels[index]);
      if (levelOrderChanged) {
        props.onReorderStageTree(topLevels);
      }
      if (!props.canManage || !editMode) return;
      if (effectiveViewMode === "subject") {
        topLevels.forEach((level) => {
          const linkKeys = ((level.children as SchoolLevelTreeNode[] | undefined) ?? [])
            .map((child) => child.relationId)
            .filter((id): id is string => Boolean(id));
          if (linkKeys.length > 0) props.onPersistLevelSubjectOrder(level.levelId, linkKeys);
        });
        return;
      }
      topLevels.forEach((level) => {
        const gradeIds = ((level.children as SchoolLevelTreeNode[] | undefined) ?? [])
          .map((child) => child.gradeId)
          .filter((id): id is string => Boolean(id));
        if (gradeIds.length > 0) props.onPersistLevelGradeOrder(level.levelId, gradeIds);
      });
    },
    [editMode, effectiveViewMode, props, treeItems],
  );

  const onAddNode = React.useCallback(() => {
    const targetId = props.selectedLevelId ? `level-${props.selectedLevelId}` : levelOnly[0]?.id;
    if (!targetId) {
      sonnerToast.error("请先创建或选择一个学段");
      return;
    }
    setDialog({ kind: "add", nodeId: targetId, label: "" });
  }, [props.selectedLevelId, levelOnly]);

  const submitDialog = React.useCallback(() => {
    if (!dialog) return;
    const label = dialog.label.trim();
    if (!label) {
      sonnerToast.error("名称不能为空");
      return;
    }
    const target = itemMap.get(dialog.nodeId);
    if (!target) return;

    if (dialog.kind === "rename") {
      withTreeMutation((prev) => {
        const rename = (items: SchoolLevelTreeNode[]): SchoolLevelTreeNode[] =>
          items.map((item) => {
            if (item.id === dialog.nodeId) return { ...item, label };
            if (!item.children?.length) return item;
            return { ...item, children: rename(item.children as SchoolLevelTreeNode[]) };
          });
        return rename(prev);
      });
      setDialog(null);
      return;
    }

    const childType = target.nodeType === "level" ? (effectiveViewMode === "grade" ? "grade" : "subject") : target.nodeType;
    const childId = `${childType}-draft-${Date.now()}`;
    const newChild: SchoolLevelTreeNode = {
      id: childId,
      label,
      nodeType: childType,
      levelId: target.levelId,
      sortOrder: ((target.children as SchoolLevelTreeNode[] | undefined)?.length ?? 0) + 1,
    };
    withTreeMutation((prev) => {
      const addChild = (items: SchoolLevelTreeNode[]): SchoolLevelTreeNode[] =>
        items.map((item) => {
          if (item.id === dialog.nodeId) {
            const children = [...((item.children as SchoolLevelTreeNode[] | undefined) ?? []), newChild];
            return { ...item, children };
          }
          if (!item.children?.length) return item;
          return { ...item, children: addChild(item.children as SchoolLevelTreeNode[]) };
        });
      return addChild(prev);
    });
    setDialog(null);
    sonnerToast.success("已新增节点（UI 预览）");
  }, [dialog, effectiveViewMode, itemMap, withTreeMutation]);

  const submitDelete = React.useCallback(() => {
    if (!pendingDeleteId) return;
    if (pendingDeleteId.startsWith("level-")) {
      sonnerToast.error("学段删除将在下一步接入真实接口，当前先保留");
      setPendingDeleteId(null);
      return;
    }
    withTreeMutation((prev) => {
      const remove = (items: SchoolLevelTreeNode[]): SchoolLevelTreeNode[] =>
        items
          .filter((item) => item.id !== pendingDeleteId)
          .map((item) => ({
            ...item,
            children: item.children ? remove(item.children as SchoolLevelTreeNode[]) : item.children,
          }));
      return remove(prev);
    });
    setPendingDeleteId(null);
    sonnerToast.success("已删除节点（UI 预览）");
  }, [pendingDeleteId, withTreeMutation]);

  const onSelectLevel = props.onSelectLevel;
  const onSelectSubjectContext = props.onSelectSubjectContext;

  const handleTreeSelect = React.useCallback(
    (id: string | number) => {
      setActiveNodeId(String(id));
      const item = itemMap.get(String(id));
      if (item?.levelId) onSelectLevel(item.levelId);
      if (onSelectSubjectContext) {
        onSelectSubjectContext(buildListContextFromNode(item));
      }
    },
    [itemMap, onSelectLevel, onSelectSubjectContext],
  );

  return {
    viewMode,
    setViewMode,
    effectiveViewMode,
    editMode,
    setEditMode,
    treeItems,
    collapsedIds,
    setCollapsedIds,
    dialog,
    setDialog,
    pendingDeleteId,
    setPendingDeleteId,
    itemMap,
    levelOnly,
    activeNodeId,
    onItemsChange,
    onAddNode,
    submitDialog,
    submitDelete,
    displayCountById,
    handleTreeSelect,
  };
}
