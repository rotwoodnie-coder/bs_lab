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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bs-lab/ui";
import type { V2ExpLibraryItem } from "@/lib/v2/v2-exp-api";
import type { CreateHomeworkInput } from "@/lib/v2/v2-homework-api";
import type { CoreApiActor } from "@/lib/core-api-shared";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  actor: CoreApiActor;
  expLibraryItems: V2ExpLibraryItem[];
  expLibLoading: boolean;
  submitting: boolean;
  onSubmit: (input: CreateHomeworkInput) => Promise<void>;
}

export function CreateHomeworkDialog({
  open, onOpenChange, actor, expLibraryItems, expLibLoading, submitting, onSubmit,
}: Props) {
  const [selectedLibExpId, setSelectedLibExpId] = React.useState("");
  const [classId, setClassId] = React.useState("");
  const [requireDate, setRequireDate] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setSelectedLibExpId("");
      setClassId("");
      setRequireDate("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedLibExpId || !classId) return;
    await onSubmit({
      expId: selectedLibExpId,
      teacherUserId: actor.userId,
      classId,
      requireDate: requireDate || undefined,
    });
  };

  const canSubmit = Boolean(selectedLibExpId && classId) && !submitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>布置作业</DialogTitle>
          <DialogDescription>从实验库选择实验，填写班级与截止日期后布置给学生。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>选择实验</Label>
            {expLibLoading ? (
              <p className="text-sm text-muted-foreground">加载中…</p>
            ) : expLibraryItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无可用实验，请先在实验库中创建</p>
            ) : (
              <Select value={selectedLibExpId} onValueChange={setSelectedLibExpId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择实验" />
                </SelectTrigger>
                <SelectContent>
                  {expLibraryItems.map((e) => (
                    <SelectItem key={e.libExpId} value={e.libExpId}>
                      {e.libExpName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hw-class">班级</Label>
            <Input
              id="hw-class"
              placeholder="输入班级名称或编号"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hw-date">完成截止（可选）</Label>
            <Input
              id="hw-date"
              type="datetime-local"
              value={requireDate}
              onChange={(e) => setRequireDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="button" disabled={!canSubmit} onClick={handleSubmit}>
            {submitting ? "布置中…" : "确认布置"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
