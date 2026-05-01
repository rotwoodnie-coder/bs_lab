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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  sonnerToast,
} from "@bs-lab/ui";
import { TEACHER_MATERIALS_KIND_FORM_OPTIONS } from "../_lib/teacher-materials-ui.config";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 选中的素材 ID 列表 */
  ids: string[];
  /** 确认修改分类后的回调 */
  onApply: (category: string) => void;
};

/** 批量修改分类弹窗 */
export function BatchCategoryDialog({ open, onOpenChange, ids, onApply }: Props) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("");
  const [applying, setApplying] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setSelectedCategory("");
      setApplying(false);
    }
  }, [open]);

  const handleApply = React.useCallback(async () => {
    if (!selectedCategory) {
      sonnerToast.error("请选择分类");
      return;
    }
    setApplying(true);
    try {
      onApply(selectedCategory);
      sonnerToast.success(`已为 ${ids.length} 个素材修改分类`);
      onOpenChange(false);
    } catch (error) {
      sonnerToast.error(error instanceof Error ? error.message : "修改分类失败");
    } finally {
      setApplying(false);
    }
  }, [selectedCategory, ids.length, onApply, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>批量修改分类</DialogTitle>
          <DialogDescription>
            已选 {ids.length} 个素材，将统一修改为以下分类：
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="请选择素材类型" />
            </SelectTrigger>
            <SelectContent>
              {TEACHER_MATERIALS_KIND_FORM_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={applying}>
            取消
          </Button>
          <Button onClick={handleApply} disabled={!selectedCategory || applying}>
            {applying ? "修改中..." : "确认修改"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
