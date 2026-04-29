"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from "@bs-lab/ui";

import type { CatalogCore } from "@/lib/experiment-catalog-api";

export function DeleteStandardCoreDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: CatalogCore | null;
  loading: boolean;
  onConfirm: () => void;
}) {
  const name = props.target?.displayName ?? "";

  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>停用标准试验</AlertDialogTitle>
          <AlertDialogDescription>
            确定停用「{name}」吗？列表中将不再显示该条；记录仍保留在标准试验库（V2）中，可在「实验列表配置」中再次启用。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.loading}>取消</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={props.loading || !props.target}
            onClick={() => props.onConfirm()}
          >
            {props.loading ? "处理中…" : "停用"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
