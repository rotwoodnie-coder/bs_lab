"use client";

import { Button } from "@bs-lab/ui";
import { Save, UserPlus } from "@bs-lab/ui/icons";

import { cn } from "@/lib/utils";

/** 教育云主操作：与 globals `--primary`（#0d9488）一致 */
const saveTealClass = cn(
  "gap-1.5 rounded-lg border-0 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50",
);

export interface TeacherConfigFooterProps {
  dirty: boolean;
  savePending: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  onSaveAndContinue: () => Promise<void>;
}

export function TeacherConfigFooter({
  dirty,
  savePending,
  onClose,
  onSave,
  onSaveAndContinue,
}: TeacherConfigFooterProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-border/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
      <p className="text-sm text-muted-foreground">{dirty ? "有未保存的变更" : "无变更"}</p>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" className="rounded-lg border-border/80" onClick={onClose}>
          关闭
        </Button>
        <Button
          type="button"
          size="sm"
          className={cn("text-sm", saveTealClass)}
          disabled={!dirty || savePending}
          onClick={() => void onSave()}
        >
          <Save className="size-3.5" />
          {savePending ? "保存中…" : "保存关系"}
        </Button>
        <Button
          type="button"
          size="sm"
          className={cn("text-sm", saveTealClass)}
          disabled={!dirty || savePending}
          onClick={() => void onSaveAndContinue()}
        >
          <UserPlus className="size-3.5" />
          保存并继续下一个
        </Button>
      </div>
    </div>
  );
}
