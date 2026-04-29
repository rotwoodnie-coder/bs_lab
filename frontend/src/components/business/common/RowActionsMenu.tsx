"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bs-lab/ui";
import { MoreHorizontal } from "@bs-lab/ui/icons";

export type RowActionsMenuItem = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean;
  onSelect?: () => void | Promise<void>;
  confirm?: {
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
  };
};

export function RowActionsMenu(props: {
  items: RowActionsMenuItem[];
  triggerLabel?: string;
  align?: "start" | "center" | "end";
  size?: "sm" | "md";
}) {
  const { triggerLabel = "更多操作", align = "end", size = "sm" } = props;
  const triggerSize = size === "md" ? "size-10 min-h-10 min-w-10" : "size-7";
  const iconSize = size === "md" ? "size-4.5" : "size-4";

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [confirmItem, setConfirmItem] = React.useState<RowActionsMenuItem | null>(null);

  const openConfirm = React.useCallback((item: RowActionsMenuItem) => {
    setConfirmItem(item);
    setConfirmOpen(true);
  }, []);

  const handleItemSelect = React.useCallback((item: RowActionsMenuItem) => {
    if (item.disabled) return;
    if (item.confirm) {
      openConfirm(item);
      return;
    }
    void item.onSelect?.();
  }, [openConfirm]);

  const handleConfirm = React.useCallback(async () => {
    if (!confirmItem?.onSelect) {
      setConfirmOpen(false);
      setConfirmItem(null);
      return;
    }
    if (pending) return;
    setPending(true);
    try {
      await confirmItem.onSelect();
      setConfirmOpen(false);
      setConfirmItem(null);
    } finally {
      setPending(false);
    }
  }, [confirmItem, pending]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={`${triggerSize} shrink-0 rounded-md text-foreground`}
            aria-label={triggerLabel}
          >
            <MoreHorizontal className={`${iconSize} text-foreground`} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align}>
          {props.items.map((item) => {
            if (item.separator) return <DropdownMenuSeparator key={item.key} />;
            return (
              <DropdownMenuItem
                key={item.key}
                disabled={item.disabled}
                className={item.destructive ? "text-destructive focus:text-destructive" : undefined}
                onClick={() => handleItemSelect(item)}
              >
                {item.icon ? <span className="mr-2 inline-flex items-center">{item.icon}</span> : null}
                {item.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmItem?.confirm?.title ?? "确认操作"}</AlertDialogTitle>
            {confirmItem?.confirm?.description ? (
              <AlertDialogDescription>{confirmItem.confirm.description}</AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {confirmItem?.confirm?.cancelText ?? "取消"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleConfirm();
              }}
              className={confirmItem?.destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
              disabled={pending}
            >
              {pending ? "处理中…" : (confirmItem?.confirm?.confirmText ?? "确认")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

