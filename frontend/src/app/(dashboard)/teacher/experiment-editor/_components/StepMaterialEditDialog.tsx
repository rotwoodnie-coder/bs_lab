import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label } from "@bs-lab/ui";

type EditDraft = {
  thumbnailUrl: string;
  nameLab: string;
  quantity: string;
  materialType: string;
  safetyReminder: string;
};

export function StepMaterialEditDialog(props: {
  open: boolean;
  draft: EditDraft;
  onOpenChange: (open: boolean) => void;
  onDraftChange: (next: EditDraft) => void;
  onSave: () => void;
}) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>修改材料信息</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Label className="grid gap-1 text-sm">
            缩略图地址
            <Input
              value={props.draft.thumbnailUrl}
              onChange={(e) => props.onDraftChange({ ...props.draft, thumbnailUrl: e.target.value })}
            />
          </Label>
          <Label className="grid gap-1 text-sm">
            材料名称
            <Input value={props.draft.nameLab} onChange={(e) => props.onDraftChange({ ...props.draft, nameLab: e.target.value })} />
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Label className="grid gap-1 text-sm">
              数量
              <Input value={props.draft.quantity} onChange={(e) => props.onDraftChange({ ...props.draft, quantity: e.target.value })} />
            </Label>
            <Label className="grid gap-1 text-sm">
              材料类型
              <Input
                value={props.draft.materialType}
                onChange={(e) => props.onDraftChange({ ...props.draft, materialType: e.target.value })}
              />
            </Label>
          </div>
          <Label className="grid gap-1 text-sm">
            材料安全提醒
            <Input
              value={props.draft.safetyReminder}
              onChange={(e) => props.onDraftChange({ ...props.draft, safetyReminder: e.target.value })}
            />
          </Label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
            取消
          </Button>
          <Button type="button" onClick={props.onSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
