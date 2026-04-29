"use client";

import * as React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@bs-lab/ui";

import type { V2SysOrgItem } from "@/lib/v2/v2-sys-api";

export function CreateResearchGroupDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentOrgName: string;
  submitting: boolean;
  onSubmit: (payload: { groupName: string }) => void | Promise<void>;
}) {
  const { open, onOpenChange, submitting, onSubmit } = props;
  const [name, setName] = React.useState("");

  React.useEffect(() => {
    if (!open) setName("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新建课题组</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="rg-create-name">课题组名称</Label>
            <Input
              id="rg-create-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入课题组名称"
              maxLength={60}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            type="button"
            disabled={submitting || !name.trim()}
            onClick={() => void onSubmit({ groupName: name.trim() })}
          >
            {submitting ? "保存中…" : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditResearchGroupDialog(props: {
  target: V2SysOrgItem | null;
  onOpenChange: (open: boolean) => void;
  submitting: boolean;
  onSubmit: (orgId: string, input: { orgName: string }) => void | Promise<void>;
}) {
  const { target, onOpenChange, submitting, onSubmit } = props;
  const open = Boolean(target);
  const [editName, setEditName] = React.useState("");

  React.useEffect(() => {
    if (target) setEditName(target.orgName);
  }, [target]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑课题组</DialogTitle>
        </DialogHeader>
        {target ? (
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="rg-edit-name">名称</Label>
              <Input
                id="rg-edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={60}
              />
            </div>
          </div>
        ) : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            type="button"
            disabled={submitting || !target || !editName.trim()}
            onClick={() => target && void onSubmit(target.orgId, { orgName: editName.trim() })}
          >
            {submitting ? "保存中…" : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
