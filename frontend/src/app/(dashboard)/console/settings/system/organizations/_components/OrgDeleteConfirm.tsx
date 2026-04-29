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

export function OrgDeleteConfirm(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgName: string;
  busy: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认物理删除组织？</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span>
              将删除「{props.orgName}」及其<strong>全部下级</strong>在表 <span className="font-mono">sys_org</span>{" "}
              中的行（硬删除），并清理 <span className="font-mono">sys_user_role</span> 中指向这些组织的关联。
            </span>
            <span>
              若仍有用户绑定、试验作业或题库题目引用该组织（含子组织），操作将被拒绝。
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.busy}>取消</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={props.busy}
            onClick={() => void props.onConfirm()}
          >
            {props.busy ? "删除中…" : "确认删除"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
