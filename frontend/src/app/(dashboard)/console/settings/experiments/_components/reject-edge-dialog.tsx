"use client";

import * as React from "react";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Textarea } from "@bs-lab/ui";

export type RejectEdgeDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reason: string;
  setReason: (v: string) => void;
  onConfirm: () => void;
};

export function RejectEdgeDialog(props: RejectEdgeDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>驳回原因</DialogTitle>
        </DialogHeader>
        <Textarea
          value={props.reason}
          onChange={(e) => props.setReason(e.target.value)}
          placeholder="填写给贡献者的说明"
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
            取消
          </Button>
          <Button type="button" onClick={props.onConfirm}>
            确认驳回
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
