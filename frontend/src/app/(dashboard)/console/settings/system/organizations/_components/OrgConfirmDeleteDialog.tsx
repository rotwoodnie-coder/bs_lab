"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Input,
  Label,
} from "@bs-lab/ui";

import type { ConfirmItem } from "../org-structure-diff";

export interface OrgConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  confirmItems: ConfirmItem[];
  isSuperAdmin: boolean;
  submitting: boolean;
  onConfirm: () => void;
}

export function OrgConfirmDeleteDialog({
  open,
  onOpenChange,
  confirmItems,
  isSuperAdmin,
  submitting,
  onConfirm,
}: OrgConfirmDeleteDialogProps) {
  const [typed, setTyped] = React.useState("");

  React.useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  const classes = confirmItems.filter((c) => c.action === "delete_class" || c.action === "reduce_class_count");
  const grades = confirmItems.filter((c) => c.action === "delete_grade");
  const allSafe = confirmItems.every((c) => !c.hasStudents);

  const confirmDisabled = isSuperAdmin ? typed !== "确认删除" : submitting;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认执行删除操作？</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p className="text-xs text-muted-foreground">
              以下节点将被物理删除。此操作不可撤销，请确认不再需要这些数据。
            </p>

            {classes.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">班级（{classes.length} 个）：</p>
                <ul className="list-inside list-disc space-y-0.5 text-xs">
                  {classes.map((c, i) => (
                    <li key={i} className={c.hasStudents ? "text-destructive" : "text-muted-foreground"}>
                      {c.orgName}（{c.gradeName}）
                      {c.hasStudents ? " — 含学生数据，将被跳过不删除" : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {grades.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">年级（{grades.length} 个）：</p>
                <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
                  {grades.map((c, i) => (
                    <li key={i}>{c.orgName}</li>
                  ))}
                </ul>
              </div>
            )}

            {isSuperAdmin && (
              <div className="mt-3 space-y-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                <Label className="text-xs font-medium text-destructive">
                  请输入"确认删除"以执行操作
                </Label>
                <Input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder="确认删除"
                  className="border-destructive/40"
                />
              </div>
            )}

            {!allSafe && !isSuperAdmin && (
              <p className="text-xs text-destructive">
                含学生数据的节点已被跳过，不会被删除。请先迁移学生后再操作。
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>取消</AlertDialogCancel>
          <Button
            type="button"
            variant={isSuperAdmin ? "destructive" : "default"}
            disabled={confirmDisabled}
            onClick={() => void onConfirm()}
          >
            {isSuperAdmin ? "确认并执行" : "确认"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
