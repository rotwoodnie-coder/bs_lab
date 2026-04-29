"use client";

import * as React from "react";

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Switch,
  TreeView,
} from "@bs-lab/ui";
import { GraduationCap, Layers, Leaf, Microscope, MoreHorizontal, Pencil, Plus, Trash2 } from "@bs-lab/ui/icons";

import { useTreeManager } from "@/hooks/use-tree-manager";
import { useOptionalLeftTreeRail } from "@/components/layout/left-tree-rail-context";
import type { TreeNode, TreeNodeId, TreeState } from "@/types/tree";
import { lucideIconForTreeIconKey } from "@/lib/tree/discipline-tree-icons";
import { matchIconKey } from "@/lib/tree/icon-match";
import { cn } from "@/lib/utils";

import { GlobalTreeRootIconRail } from "./global-tree-root-icon-rail";

function toTreeItems(nodes: TreeNode[]): Array<TreeNode & { children?: any[] }> {
  return nodes as any;
}

function iconFor(iconKey: string | null) {
  if (!iconKey) return null;
  if (iconKey.startsWith("phase.")) {
    if (iconKey.includes("primary")) return Leaf;
    if (iconKey.includes("junior")) return Microscope;
    if (iconKey.includes("senior")) return GraduationCap;
    return Leaf;
  }
  if (iconKey.startsWith("grade.")) return Layers;
  const mapped = lucideIconForTreeIconKey(iconKey);
  if (mapped) return mapped;
  return Leaf;
}

export function GlobalTree(props: {
  storageKey?: string;
  /** 与 `storageKey` 配合：无快照时的内存初始树（如年级优先结构） */
  initialTreeState?: TreeState;
  skipLegacyTreeHydration?: boolean;
  className?: string;
  selectedId?: TreeNodeId | null;
  onSelectId?: (id: TreeNodeId | null) => void;
  metrics?: (nodeId: TreeNodeId) => { count?: number; attention?: boolean };
  showEditToggle?: boolean;
  isEditMode?: boolean;
  onEditModeChange?: (next: boolean) => void;
  onSubjectPatch?: (patch: { op: "add"; parentId: TreeNodeId | null; label: string; createdNodeId: TreeNodeId }) => void;
  bottomSlot?: React.ReactNode;
  /** 外部触发：收起全部节点（token 变化即触发一次） */
  collapseAllToken?: number;
}) {
  const { tree, busy, setTree, addChild, renameNode, deleteNode } = useTreeManager({
    storageKey: props.storageKey,
    initialState: props.initialTreeState,
    skipLegacyHydration: props.skipLegacyTreeHydration,
  });
  const [internalEditMode, setInternalEditMode] = React.useState(false);
  const editMode = props.isEditMode ?? internalEditMode;
  const setEditMode = React.useCallback(
    (next: boolean) => {
      props.onEditModeChange?.(next);
      if (props.isEditMode == null) setInternalEditMode(next);
    },
    [props],
  );
  const [collapsedIds, setCollapsedIds] = React.useState<Set<string>>(() => new Set());
  const didInitCollapsed = React.useRef(false);
  const [dialog, setDialog] = React.useState<null | { kind: "add" | "rename"; nodeId: string | null; label: string }>(null);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);

  const items = React.useMemo(() => toTreeItems(tree), [tree]);
  const rail = useOptionalLeftTreeRail();

  React.useEffect(() => {
    if (editMode && rail?.collapsed) {
      rail.setManualExpanded(true);
    }
  }, [editMode, rail]);

  React.useEffect(() => {
    if (didInitCollapsed.current) return;
    if (!tree || tree.length === 0) return;
    // 默认仅展开一级（学段），二级（学科）默认收起。
    const next = new Set<string>();
    const visit = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        const kind = String((n.meta as any)?.kind ?? "");
        if (kind === "discipline" || kind === "gradeGroup") next.add(String(n.id));
        if (n.children && n.children.length > 0) visit(n.children);
      }
    };
    visit(tree);
    setCollapsedIds(next);
    didInitCollapsed.current = true;
  }, [tree]);

  React.useEffect(() => {
    if (!props.collapseAllToken) return;
    if (!tree || tree.length === 0) return;
    const next = new Set<string>();
    const visit = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        if (n.children && n.children.length > 0) {
          next.add(String(n.id));
          visit(n.children);
        }
      }
    };
    visit(tree);
    setCollapsedIds(next);
  }, [props.collapseAllToken, tree]);

  const renderIcon = React.useCallback((item: any) => {
    const kind = String(item.meta?.kind ?? "");
    if (kind === "gradeGroup") {
      return <Layers className="size-4 text-muted-foreground opacity-90" aria-hidden />;
    }
    const m = matchIconKey(String(item.label ?? ""), item.meta, item.iconKey);
    const Ico = iconFor(m?.iconKey ?? null);
    return Ico ? <Ico className="size-4 opacity-70" aria-hidden /> : null;
  }, []);

  const renderTrailing = React.useCallback(
    (item: any) => {
      const m = props.metrics?.(String(item.id));
      return (
        <div className="flex items-center gap-1">
          {!editMode && m?.attention ? <span className="size-2 rounded-full bg-destructive" aria-label="有待处理项" /> : null}
          {!editMode && m?.count != null ? (
            <Badge variant="outline" className="h-5 px-1.5 text-[11px] font-normal tabular-nums">
              {m.count}
            </Badge>
          ) : null}
          {editMode ? (
            <>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setDialog({ kind: "add", nodeId: String(item.id), label: "" });
                }}
                aria-label="新增子节点"
              >
                <Plus className="size-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="节点操作"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => setDialog({ kind: "rename", nodeId: String(item.id), label: String(item.label ?? "") })}>
                  <Pencil className="size-4" />
                  重命名
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setPendingDeleteId(String(item.id))}>
                  <Trash2 className="size-4" />
                  删除
                </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : null}
        </div>
      );
    },
    [editMode, props],
  );

  const onItemsChange = React.useCallback(
    (next: any[]) => {
      void setTree(next as TreeNode[]);
    },
    [setTree],
  );

  const submitDialog = async () => {
    if (!dialog) return;
    const label = dialog.label.trim();
    if (!label) return;
    if (dialog.kind === "add") {
      const createdNodeId = await addChild(dialog.nodeId, { label });
      props.onSubjectPatch?.({
        op: "add",
        parentId: dialog.nodeId,
        label,
        createdNodeId: createdNodeId ?? `pending-${Date.now()}`,
      });
    } else {
      if (!dialog.nodeId) return;
      await renameNode(dialog.nodeId, label);
    }
    setDialog(null);
  };

  return (
    <div className={cn("space-y-1.5", props.className)}>
      {props.showEditToggle === false ? null : (
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">浏览</span>
          <Switch checked={editMode} onCheckedChange={(c) => setEditMode(Boolean(c))} aria-label="树编辑模式切换" />
          <span className="text-xs text-muted-foreground">编辑</span>
        </div>
      )}

      {rail?.collapsed && !editMode ? (
        <GlobalTreeRootIconRail
          roots={tree}
          selectedId={props.selectedId ?? null}
          onSelectId={(id) => props.onSelectId?.(id)}
          renderIcon={(node) => renderIcon(node as any)}
          metrics={props.metrics}
        />
      ) : (
        <TreeView
          items={items}
          onItemsChange={onItemsChange}
          selectedId={props.selectedId ?? null}
          onSelect={(id) => props.onSelectId?.(id)}
          editMode={editMode}
          collapsedIds={collapsedIds}
          onCollapsedIdsChange={setCollapsedIds}
          renderIcon={renderIcon}
          renderTrailing={renderTrailing}
          indentPx={10}
          className="rounded-md border border-border bg-card p-1"
        />
      )}
      {props.bottomSlot ? <div className="rounded-md border border-border bg-muted/20 p-2 text-sm">{props.bottomSlot}</div> : null}

      <Dialog open={Boolean(dialog)} onOpenChange={(o) => (!o ? setDialog(null) : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog?.kind === "add" ? "新增节点" : "重命名"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="tree-node-label">名称</Label>
            <Input id="tree-node-label" value={dialog?.label ?? ""} onChange={(e) => setDialog((p) => (p ? { ...p, label: e.target.value } : p))} />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>
              取消
            </Button>
            <Button type="button" onClick={() => void submitDialog()} disabled={busy}>
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingDeleteId)} onOpenChange={(o) => (!o ? setPendingDeleteId(null) : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>删除节点</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">删除后该节点及其子节点将被移除，是否继续？</p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setPendingDeleteId(null)}>
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!pendingDeleteId) return;
                void deleteNode(pendingDeleteId);
                setPendingDeleteId(null);
              }}
              disabled={busy}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

