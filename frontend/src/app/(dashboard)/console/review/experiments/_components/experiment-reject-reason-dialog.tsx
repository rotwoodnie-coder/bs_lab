"use client";

import * as React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from "@bs-lab/ui";

export type ExperimentRejectReasonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rejectReason: string;
  onRejectReasonChange: (v: string) => void;
  onConfirm: () => void;
};

export function ExperimentRejectReasonDialog({
  open,
  onOpenChange,
  rejectReason,
  onRejectReasonChange,
  onConfirm,
}: ExperimentRejectReasonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>驳回理由（必填）</DialogTitle>
          <DialogDescription>驳回须填写可追溯说明，将持久化到试验记录的驳回原因与审批摘要字段。</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-1">
          <Label htmlFor="reject-reason">驳回说明</Label>
          <Textarea
            id="reject-reason"
            value={rejectReason}
            onChange={(e) => onRejectReasonChange(e.target.value)}
            placeholder="例如：步骤三缺少护目镜安全提示；课标引用或安全说明需更新。"
            rows={5}
            className="min-h-[120px] resize-y"
          />
          <p className="text-xs text-muted-foreground">不少于 4 个字；以本框为准提交驳回。</p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={rejectReason.trim().length < 4}
            onClick={onConfirm}
          >
            确认驳回并下一条
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
