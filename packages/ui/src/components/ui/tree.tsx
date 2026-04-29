'use client'

import * as React from 'react'

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronRight } from 'lucide-react'

import { cn } from '../../lib/utils'
import { Button } from './button'

export type TreeItemId = string

export type TreeItem<T = unknown> = T & {
  id: TreeItemId
  label: string
  children?: TreeItem<T>[]
}

type FlatItem<T> = {
  id: TreeItemId
  label: string
  item: TreeItem<T>
  parentId: TreeItemId | null
  depth: number
  index: number
  hasChildren: boolean
  collapsed: boolean
}

function flattenTree<T>(
  items: TreeItem<T>[],
  opts: { parentId: TreeItemId | null; depth: number },
  collapsedIds: Set<TreeItemId>,
): FlatItem<T>[] {
  const out: FlatItem<T>[] = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!
    const children = item.children ?? []
    const collapsed = collapsedIds.has(item.id)
    out.push({
      id: item.id,
      label: item.label,
      item,
      parentId: opts.parentId,
      depth: opts.depth,
      index: i,
      hasChildren: children.length > 0,
      collapsed,
    })
    if (children.length && !collapsed) {
      out.push(...flattenTree(children, { parentId: item.id, depth: opts.depth + 1 }, collapsedIds))
    }
  }
  return out
}

function buildTreeFromFlat<T>(flat: FlatItem<T>[]): TreeItem<T>[] {
  const byId = new Map<TreeItemId, TreeItem<T>>()
  const childrenByParent = new Map<TreeItemId | null, TreeItemId[]>()

  for (const f of flat) {
    byId.set(f.id, { ...f.item, children: [] })
    const arr = childrenByParent.get(f.parentId) ?? []
    arr.push(f.id)
    childrenByParent.set(f.parentId, arr)
  }

  const build = (parentId: TreeItemId | null): TreeItem<T>[] => {
    const ids = childrenByParent.get(parentId) ?? []
    return ids
      .map((id) => {
        const n = byId.get(id)!
        n.children = build(id)
        if (n.children.length === 0) delete (n as any).children
        return n
      })
  }

  return build(null)
}

function moveInFlat<T>(
  flat: FlatItem<T>[],
  activeId: TreeItemId,
  overId: TreeItemId,
): FlatItem<T>[] {
  const activeIndex = flat.findIndex((x) => x.id === activeId)
  const overIndex = flat.findIndex((x) => x.id === overId)
  if (activeIndex < 0 || overIndex < 0) return flat
  if (activeIndex === overIndex) return flat
  return arrayMove(flat, activeIndex, overIndex)
}

function maxDepth<T>(flat: FlatItem<T>[], index: number): number {
  const cur = flat[index]
  if (!cur) return 0
  // max depth is previous item's depth + 1
  const prev = flat[index - 1]
  return prev ? prev.depth + 1 : 0
}

function getProjection<T>(flat: FlatItem<T>[], activeId: TreeItemId, overId: TreeItemId, offsetX: number, indent = 14) {
  const activeIndex = flat.findIndex((x) => x.id === activeId)
  const overIndex = flat.findIndex((x) => x.id === overId)
  if (activeIndex < 0 || overIndex < 0) return null

  const items = arrayMove(flat, activeIndex, overIndex)
  const over = items[overIndex]
  const prev = items[overIndex - 1]
  const next = items[overIndex + 1]
  if (!over) return null

  const dragDepth = Math.round(offsetX / indent)
  const projectedDepth = Math.max(0, Math.min(over.depth + dragDepth, maxDepth(items, overIndex)))

  let parentId: TreeItemId | null = null
  if (projectedDepth === 0) parentId = null
  else if (prev && projectedDepth > prev.depth) parentId = prev.id
  else if (prev && projectedDepth === prev.depth) parentId = prev.parentId
  else {
    // walk back to find an item with depth === projectedDepth - 1
    for (let i = overIndex - 1; i >= 0; i--) {
      const it = items[i]!
      if (it.depth === projectedDepth - 1) {
        parentId = it.id
        break
      }
    }
  }

  return { depth: projectedDepth, parentId }
}

function SortableRowInner<T>(props: {
  id: TreeItemId
  item: TreeItem<T>
  label: React.ReactNode
  depth: number
  indentPx: number
  selected: boolean
  editMode?: boolean
  hasChildren?: boolean
  collapsed?: boolean
  onToggleCollapse?: (id: TreeItemId) => void
  onClick?: (id: TreeItemId) => void
  renderIcon?: (item: TreeItem<T>) => React.ReactNode
  renderTrailing?: (item: TreeItem<T>) => React.ReactNode
  renderLabel?: (item: TreeItem<T>) => React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  const dragEnabled = Boolean(props.editMode)
  const dragProps = dragEnabled ? { ...attributes, ...listeners } : {}

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-dragging={isDragging ? 'true' : 'false'}
      {...dragProps}
      className={cn(
        'group flex items-center gap-1.5 rounded-md px-2 py-1',
        dragEnabled ? 'cursor-grab active:cursor-grabbing' : '',
        props.selected ? 'bg-accent/70 ring-1 ring-border' : 'hover:bg-muted/50',
      )}
    >
      <div style={{ width: props.depth * props.indentPx }} aria-hidden />
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {props.hasChildren ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0 opacity-70"
            onClick={() => props.onToggleCollapse?.(props.id)}
            aria-label={props.collapsed ? '展开' : '收起'}
          >
            {props.collapsed ? (
              <ChevronRight className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-3.5 text-muted-foreground" />
            )}
          </Button>
        ) : (
          <span className="h-6 w-6 shrink-0" aria-hidden />
        )}
        {props.renderIcon ? (
          <span className="shrink-0 opacity-80">{props.renderIcon(props.item)}</span>
        ) : null}
        <button
          type="button"
          onClick={() => props.onClick?.(props.id)}
          className="min-w-0 flex-1 truncate text-left text-sm text-foreground"
        >
          {props.renderLabel ? props.renderLabel(props.item) : props.label}
        </button>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {props.renderTrailing ? props.renderTrailing(props.item) : null}
      </div>
    </div>
  )
}

const SortableRow = React.memo(SortableRowInner) as typeof SortableRowInner

export type TreeViewProps<T = unknown> = {
  items: TreeItem<T>[]
  onItemsChange?: (next: TreeItem<T>[]) => void
  selectedId?: TreeItemId | null
  onSelect?: (id: TreeItemId) => void
  editMode?: boolean
  collapsedIds?: Set<TreeItemId>
  onCollapsedIdsChange?: (next: Set<TreeItemId>) => void
  indentPx?: number
  renderIcon?: (item: TreeItem<T>) => React.ReactNode
  renderTrailing?: (item: TreeItem<T>) => React.ReactNode
  renderLabel?: (item: TreeItem<T>) => React.ReactNode
  className?: string
}

/**
 * Minimal sortable tree view.
 * - Supports drag reorder across the flattened list.
 * - Treats drag as sibling reorder by default; higher-level parenting can be
 *   implemented in app layer by transforming `items` in `onItemsChange`.
 */
export function TreeView<T>(props: TreeViewProps<T>) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const [activeId, setActiveId] = React.useState<TreeItemId | null>(null)
  const indent = props.indentPx ?? 10
  const collapsedIds = props.collapsedIds ?? new Set<TreeItemId>()
  const [dragOffsetX, setDragOffsetX] = React.useState(0)
  const flat = React.useMemo(() => flattenTree(props.items, { parentId: null, depth: 0 }, collapsedIds), [props.items, collapsedIds])
  const projection = React.useMemo(() => {
    if (!activeId) return null
    const overId = flat.find((f) => f.id === activeId)?.id
    // during drag we rely on last known over id from state in onDragMove; keep it simple
    return null
  }, [activeId, flat])

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id))
    setDragOffsetX(0)
  }
  const [overId, setOverId] = React.useState<TreeItemId | null>(null)
  const onDragMove = (e: DragMoveEvent) => {
    setDragOffsetX((x) => x + e.delta.x)
    if (e.over?.id) setOverId(String(e.over.id))
  }
  const onDragEnd = (e: DragEndEvent) => {
    const a = e.active?.id ? String(e.active.id) : null
    const o = e.over?.id ? String(e.over.id) : null
    setActiveId(null)
    setOverId(null)
    if (!a || !o || a === o) return
    const reordered = moveInFlat(flat, a, o)
    const proj = getProjection(reordered, a, o, dragOffsetX, indent)
    if (proj) {
      const idx = reordered.findIndex((x) => x.id === a)
      if (idx >= 0) {
        reordered[idx] = { ...reordered[idx]!, depth: proj.depth, parentId: proj.parentId }
      }
    }
    props.onItemsChange?.(buildTreeFromFlat(reordered))
  }

  const activeItem = activeId ? flat.find((f) => f.id === activeId)?.item : null

  const onToggleCollapse = React.useCallback(
    (id: TreeItemId) => {
      const next = new Set(collapsedIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      props.onCollapsedIdsChange?.(next)
    },
    [collapsedIds, props],
  )

  const onClickRow = React.useCallback(
    (id: TreeItemId) => {
      props.onSelect?.(id)
    },
    [props],
  )

  return (
    <div className={cn('space-y-0.5', props.className)}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={flat.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          {flat.map((f) => (
            <SortableRow
              key={f.id}
              id={f.id}
              item={f.item}
              label={f.label}
              indentPx={indent}
              depth={
                activeId && overId && f.id === activeId
                  ? (getProjection(flat, activeId, overId, dragOffsetX, indent)?.depth ?? f.depth)
                  : f.depth
              }
              selected={Boolean(props.selectedId && props.selectedId === f.id)}
              editMode={props.editMode}
              hasChildren={f.hasChildren}
              collapsed={f.collapsed}
              onToggleCollapse={onToggleCollapse}
              onClick={onClickRow}
              renderIcon={props.renderIcon}
              renderTrailing={props.renderTrailing}
              renderLabel={props.renderLabel}
            />
          ))}
        </SortableContext>
        <DragOverlay>
          {activeItem ? (
            <div className="rounded-md border border-border bg-card px-2 py-1.5 shadow-sm">
              <div className="truncate text-sm text-foreground">{activeItem.label}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

