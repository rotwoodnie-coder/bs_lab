"use client";

import * as React from "react";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input } from "@bs-lab/ui";

type DialogState = null | { kind: "add" | "rename"; nodeId: string; label: string };

export function EduStageTreeBoardDialogs(props: {
  canManage: boolean;
  editMode: boolean;
  dialog: DialogState;
  setDialog: React.Dispatch<React.SetStateAction<DialogState>>;
  pendingDeleteId: string | null;
  setPendingDeleteId: React.Dispatch<React.SetStateAction<string | null>>;
  submitDialog: () => void;
  submitDelete: () => void;
}) {
  const { canManage, editMode, dialog, setDialog, pendingDeleteId, setPendingDeleteId, submitDialog, submitDelete } =
    props;

  return (
    <>
      <Dialog open={canManage && editMode && Boolean(dialog)} onOpenChange={(open) => (!open ? setDialog(null) : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog?.kind === "add" ? "新增节点" : "重命名节点"}</DialogTitle>
          </DialogHeader>
          <Input
            value={dialog?.label ?? ""}
            onChange={(event) => setDialog((prev) => (prev ? { ...prev, label: event.target.value } : prev))}
            placeholder="请输入节点名称"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>
              取消
            </Button>
            <Button type="button" onClick={submitDialog}>
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={canManage && editMode && Boolean(pendingDeleteId)}
        onOpenChange={(open) => (!open ? setPendingDeleteId(null) : null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>删除节点</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">确认删除该节点吗？当前仅影响前端展示。</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDeleteId(null)}>
              取消
            </Button>
            <Button type="button" variant="destructive" onClick={submitDelete}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
