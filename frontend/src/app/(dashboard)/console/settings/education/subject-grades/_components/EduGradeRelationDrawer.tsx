"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Checkbox,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@bs-lab/ui";

import type { EduGrade, GradeDrawerModel } from "../page.types";

export function EduGradeRelationDrawer(props: {
  open: boolean;
  model: GradeDrawerModel | null;
  grades: EduGrade[];
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onModelChange: (next: GradeDrawerModel) => void;
  onSave: () => void;
}) {
  const selectedSet = React.useMemo(
    () => new Set(props.model?.selectedGradeIds ?? []),
    [props.model?.selectedGradeIds],
  );

  const onToggleGrade = React.useCallback(
    (gradeId: string, checked: boolean) => {
      if (!props.model) return;
      const nextSet = new Set(selectedSet);
      if (checked) nextSet.add(gradeId);
      else nextSet.delete(gradeId);
      props.onModelChange({ ...props.model, selectedGradeIds: [...nextSet] });
    },
    [props, selectedSet],
  );

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>年级关联设置</SheetTitle>
          <SheetDescription>当前学科在所选学段下可用的年级范围。</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 py-4">
          {props.model ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{props.model.levelName}</Badge>
                <Badge variant="secondary">{props.model.subjectName}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {props.grades.map((grade) => (
                  <label
                    key={grade.id}
                    className="flex items-center gap-2 rounded border border-border px-2 py-2 text-sm"
                  >
                    <Checkbox
                      checked={selectedSet.has(grade.id)}
                      onCheckedChange={(checked) => onToggleGrade(grade.id, checked === true)}
                    />
                    <span>{grade.name}</span>
                  </label>
                ))}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">请选择中间学科后再设置年级关联。</div>
          )}
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
            取消
          </Button>
          <Button type="button" onClick={props.onSave} disabled={!props.model || props.saving}>
            {props.saving ? "保存中..." : "保存"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
