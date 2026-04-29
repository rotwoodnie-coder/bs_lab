"use client";

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label } from "@bs-lab/ui";

export type CategoryCreateDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  catName: string;
  setCatName: (v: string) => void;
  onSubmit: () => void;
};

export function CategoryCreateDialog(props: CategoryCreateDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新建实验类型</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">类型编码由系统根据名称自动生成，保存后可在列表中查看。</p>
          <div className="space-y-1">
            <Label>名称</Label>
            <Input value={props.catName} onChange={(e) => props.setCatName(e.target.value)} placeholder="如 观察实验" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
            取消
          </Button>
          <Button type="button" onClick={props.onSubmit}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
