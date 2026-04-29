"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./lab-ui";
import type { LabSectionConfig, UiLabContext } from "../lab-types";

export function getUiLabSectionsPart4(): LabSectionConfig[] {
  return [
    {
      id: "section-shell",
      title: "容器与导航",
      description: "对话框、抽屉、侧栏、浮层、导航与分页。",
      stackClassName: "space-y-8",
      items: [
        {
          kind: "custom",
          id: "overlays",
          label: "Dialog / Drawer / Sheet / Popover / Tooltip",
          render: () => (
            <div className="flex flex-wrap gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    Dialog
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>对话框标题</DialogTitle>
                    <DialogDescription>居中模态，支持关闭按钮与焦点陷阱。</DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" size="sm">
                      取消
                    </Button>
                    <Button type="button" size="sm">
                      确认
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Drawer direction="right">
                <DrawerTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    Drawer
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Drawer</DrawerTitle>
                    <DrawerDescription>移动端友好的 Vaul 抽屉。</DrawerDescription>
                  </DrawerHeader>
                  <div className="px-4 text-sm text-muted-foreground">内容区</div>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button type="button" variant="outline" size="sm">
                        关闭
                      </Button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>

              <Sheet>
                <SheetTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    Sheet
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Sheet</SheetTitle>
                    <SheetDescription>侧滑面板，用于辅助上下文。</SheetDescription>
                  </SheetHeader>
                  <p className="mt-4 text-sm text-muted-foreground">面板内容</p>
                </SheetContent>
              </Sheet>

              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    Popover
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 text-sm" align="start">
                  <p className="font-medium text-foreground">浮层内容</p>
                  <p className="mt-1 text-muted-foreground">
                    与触发器对齐，可用于轻量表单或说明。
                  </p>
                </PopoverContent>
              </Popover>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    Tooltip
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>简短提示文案</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ),
        },
        { kind: "showcase", name: "CommandDialog" },
        { kind: "showcase", name: "Breadcrumb" },
        {
          kind: "custom",
          id: "pagination",
          label: "Pagination（受控示意）",
          render: (ctx: UiLabContext) => (
            <div className="space-y-3">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      size="default"
                      onClick={(e) => {
                        e.preventDefault();
                        ctx.setPage((p) => Math.max(1, p - 1));
                      }}
                    />
                  </PaginationItem>
                  {[1, 2, 3].map((i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        href="#"
                        size="icon"
                        isActive={ctx.page === i}
                        onClick={(e) => {
                          e.preventDefault();
                          ctx.setPage(i);
                        }}
                      >
                        {i}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      size="default"
                      onClick={(e) => {
                        e.preventDefault();
                        ctx.setPage((p) => Math.min(3, p + 1));
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ),
        },
      ],
    },
  ];
}
