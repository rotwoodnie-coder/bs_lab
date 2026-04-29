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
  Input,
  sonnerToast,
} from "@bs-lab/ui";

export type ExperimentCourseCardCommentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (text: string) => void;
};

export function ExperimentCourseCardCommentDialog(props: ExperimentCourseCardCommentDialogProps) {
  const [draft, setDraft] = React.useState("");

  React.useEffect(() => {
    if (props.open) setDraft("");
  }, [props.open]);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>留言（）</DialogTitle>
          <DialogDescription>留言将以本地 Mock 形式记录，仅用于交互。</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="写点什么…" aria-label="留言内容" />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
            取消
          </Button>
          <Button
            type="button"
            onClick={() => {
              const text = draft.trim();
              if (!text) {
                sonnerToast.warning("请输入留言内容");
                return;
              }
              props.onSubmit(text);
            }}
          >
            发布
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

