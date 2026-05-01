"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@bs-lab/ui";
import { MaterialPreviewCard } from "@/app/(dashboard)/teacher/materials/_components/MaterialPreviewCard";
import type { ApiActor } from "@/lib/new-core-api";
import type { TeacherMaterialItem } from "@/lib/teacher-materials-api";
import { getMaterialPreviewPayload, kindLabel } from "@/app/(dashboard)/teacher/materials/_lib/material-preview.utils";
import { materialStorageBrowserHref } from "@/lib/material-asset-url";
import { MaterialCard } from "./MaterialCard";

export type ViewMode = "waterfall" | "grid" | "list";

type Props = {
  actor: ApiActor;
  items: TeacherMaterialItem[];
  mode: ViewMode;
  onClickItem?: (item: TeacherMaterialItem) => void;
};

const LIST_PAGE_SIZE = 15;

/** 视频广场多视图容器——瀑布流/网格/列表，无管理按钮。 */
export function VideoSquareWaterfall({ actor, items, mode, onClickItem }: Props) {
  if (items.length === 0) return null; // 空态由父级处理

  if (mode === "list") {
    return <ListTableView actor={actor} items={items} onClickItem={onClickItem} />;
  }

  const gridClass =
    mode === "waterfall"
      ? "columns-1 gap-3 md:columns-2 2xl:columns-3"
      : "grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";

  return (
    <div className={gridClass}>
      {items.map((item) => (
        <MaterialCard key={item.materialId} item={item} actor={actor} mode={mode} onClick={onClickItem} />
      ))}
    </div>
  );
}

/** 列表视图：使用 `@bs-lab/ui` 原生 `<Table>` 搭建，无操作列，自带分页。 */
function ListTableView({ actor, items, onClickItem }: { actor: ApiActor; items: TeacherMaterialItem[]; onClickItem?: (item: TeacherMaterialItem) => void }) {
  const [page, setPage] = React.useState(1);
  const totalPages = Math.ceil(items.length / LIST_PAGE_SIZE);
  const pageItems = items.slice((page - 1) * LIST_PAGE_SIZE, page * LIST_PAGE_SIZE);

  // 分页超出时自动回退
  React.useEffect(() => {
    if (page > totalPages) setPage(Math.max(1, totalPages));
  }, [page, totalPages]);

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 text-center">#</TableHead>
            <TableHead className="min-w-0">素材</TableHead>
            <TableHead className="w-20">类型</TableHead>
            <TableHead className="w-28">上传人</TableHead>
            <TableHead className="hidden w-32 md:table-cell">单位</TableHead>
            <TableHead className="w-28">更新时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageItems.map((item, idx) => {
            const preview = getMaterialPreviewPayload(item);
            return (
              <TableRow
                key={item.materialId}
                className="cursor-pointer"
                onClick={() => onClickItem?.(item)}
              >
                <TableCell className="text-center text-muted-foreground text-xs">
                  {(page - 1) * LIST_PAGE_SIZE + idx + 1}
                </TableCell>
                <TableCell>
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="h-10 w-[72px] shrink-0 overflow-hidden rounded border border-border/60 bg-muted/30">
                      <MaterialPreviewCard
                        preview={preview}
                        title={item.title}
                        compact
                        className="h-full w-full"
                        actor={actor}
                        repairSourceItem={item}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="line-clamp-1 text-sm font-medium text-foreground">{item.title}</div>
                      <div className="text-[11px] text-muted-foreground">{item.updatedAt}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {kindLabel(item.kind)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-foreground">
                  <div className="flex items-center gap-1.5">
                    {item.ownerUserName ? (
                      <Avatar className="size-6 shrink-0 border border-border">
                        {item.ownerAvatarUrl ? (
                          <AvatarImage src={materialStorageBrowserHref(item.ownerAvatarUrl)} alt="" />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                          {item.ownerUserName.trim().slice(0, 1).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                    ) : null}
                    <span className="truncate">{item.ownerUserName ?? "—"}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden max-w-32 truncate text-sm text-muted-foreground md:table-cell">
                  {item.ownerOrgName ?? "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {item.updatedAt}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {totalPages > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.max(1, p - 1));
                }}
                className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
            {buildPaginationLinks(totalPages, page, (p) => {
              setPage(p);
            })}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.min(totalPages, p + 1));
                }}
                className={page >= totalPages ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}

/** 生成分页数字链接，省略号自动折叠。 */
function buildPaginationLinks(totalPages: number, currentPage: number, onPage: (page: number) => void) {
  const links: React.ReactNode[] = [];

  const addPage = (p: number) => {
    links.push(
      <PaginationItem key={p}>
        <PaginationLink
          href="#"
          isActive={p === currentPage}
          onClick={(e) => {
            e.preventDefault();
            onPage(p);
          }}
        >
          {p}
        </PaginationLink>
      </PaginationItem>,
    );
  };

  const addEllipsis = (key: string) => {
    links.push(
      <PaginationItem key={key}>
        <PaginationEllipsis />
      </PaginationItem>,
    );
  };

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) addPage(i);
    return links;
  }

  addPage(1);
  if (currentPage > 3) addEllipsis("start");
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) addPage(i);
  if (currentPage < totalPages - 2) addEllipsis("end");
  addPage(totalPages);

  return links;
}
