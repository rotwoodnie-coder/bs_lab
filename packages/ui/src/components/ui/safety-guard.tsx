"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import { cn } from "../../lib/utils";
import { buttonVariants } from "./button";
import { Checkbox } from "./checkbox";
import { Label } from "./label";
import { ScrollArea } from "./scroll-area";

export type SafetyGuardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  acknowledgeId: string;
  acknowledgeLabel: React.ReactNode;
  acknowledgeChecked: boolean;
  onAcknowledgeChange: (checked: boolean) => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  className?: string;
};

/**
 * 全屏安全确认：高 z-index、半透明毛玻璃遮罩；需勾选确认后方可 primary 操作。
 * 关闭方式：使用底部「取消」或确认流程结束由业务将 `open` 置为 false（与 Radix AlertDialog 一致）。
 */
export function SafetyGuard({
  open,
  onOpenChange,
  title,
  description,
  children,
  acknowledgeId,
  acknowledgeLabel,
  acknowledgeChecked,
  onAcknowledgeChange,
  onConfirm,
  confirmLabel = "确认继续",
  cancelLabel = "暂不进入",
  confirmDisabled,
  className,
}: SafetyGuardProps) {
  const disabled = confirmDisabled ?? !acknowledgeChecked;

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[60] bg-overlay backdrop-blur-md",
          )}
        />
        <AlertDialogPrimitive.Content
          className={cn(
            "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[60] flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col gap-0 rounded-none border-0 p-0 shadow-none duration-200 outline-none",
            className,
          )}
        >
          <div className="shrink-0 space-y-2 border-b border-border px-4 py-4 text-left sm:px-6">
            <AlertDialogPrimitive.Title className="text-lg font-semibold text-foreground">
              {title}
            </AlertDialogPrimitive.Title>
            {description ? (
              <AlertDialogPrimitive.Description asChild>
                <p className="text-sm text-muted-foreground">{description}</p>
              </AlertDialogPrimitive.Description>
            ) : null}
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="px-4 py-4 sm:px-6">{children}</div>
          </ScrollArea>

          <div className="shrink-0 flex-col gap-3 border-t border-border bg-background p-4 sm:px-6">
            <div className="flex w-full items-start gap-3 rounded-component border border-border/60 bg-muted/20 p-3">
              <Checkbox
                id={acknowledgeId}
                checked={acknowledgeChecked}
                onCheckedChange={(v) => onAcknowledgeChange(v === true)}
              />
              <Label htmlFor={acknowledgeId} className="cursor-pointer text-sm leading-snug font-normal">
                {acknowledgeLabel}
              </Label>
            </div>
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <AlertDialogPrimitive.Cancel
                type="button"
                className={cn(buttonVariants({ variant: "outline" }), "m-0 w-full sm:w-auto")}
              >
                {cancelLabel}
              </AlertDialogPrimitive.Cancel>
              <button
                type="button"
                disabled={disabled}
                className={cn(buttonVariants(), "m-0 w-full sm:w-auto")}
                onClick={() => {
                  if (disabled) return;
                  onConfirm();
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
