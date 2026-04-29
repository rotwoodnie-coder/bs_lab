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

export function OrgTypeDeleteConfirm(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  typeName: string;
  busy: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除组织类型？</AlertDialogTitle>
          <AlertDialogDescription>
            将物理删除「{props.typeName}」对应的 <span className="font-mono">data_org_type</span> 行。
            若仍有 <span className="font-mono">sys_org</span> 引用该类型，操作将被拒绝。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.busy}>取消</AlertDialogCancel>
          <Button type="button" variant="destructive" disabled={props.busy} onClick={() => void props.onConfirm()}>
            {props.busy ? "删除中…" : "确认删除"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
