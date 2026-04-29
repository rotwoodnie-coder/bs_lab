"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "@bs-lab/ui";

import type { V2SysUserItem, V2SysOrgItem } from "@/lib/v2/v2-sys-api";
import type { SubjectOption } from "../page.hooks";
import { TeacherConfigBody } from "./TeacherConfigBody";
import { TeacherConfigFooter } from "./TeacherConfigFooter";
import { TeacherConfigHeader } from "./TeacherConfigHeader";

export interface TeacherConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: V2SysUserItem | null;
  subjects: SubjectOption[];
  subjectNameById: Record<string, string>;
  classTree: V2SysOrgItem[];
  classNameById: Record<string, string>;
  relationMap: Record<string, Set<string>>;
  relationLoading: boolean;
  dirty: boolean;
  savePending: boolean;
  onAdd: (subjectId: string, classIds: string[]) => void;
  onRemove: (subjectId: string, classOrgId: string) => void;
  onSave: () => Promise<void>;
  onSaveAndContinue: () => Promise<void>;
  lockedSchoolId?: string | null;
  defaultSchoolOrgId?: string | null;
  defaultSchoolDisplayName?: string | null;
  // 新：课设配置辅助
  configTeacherSubjects: SubjectOption[];
  configTeacherSubjectsLoading: boolean;
  gradeSubjectMap: Record<string, string[]>;
  conflictSet: Set<string>;
  onReloadConflicts: (gradeId: string) => Promise<void>;
}

export function TeacherConfigDialog({
  open,
  onOpenChange,
  teacher,
  subjects,
  subjectNameById,
  classTree,
  classNameById,
  relationMap,
  relationLoading,
  dirty,
  savePending,
  onAdd,
  onRemove,
  onSave,
  onSaveAndContinue,
  lockedSchoolId,
  defaultSchoolOrgId,
  defaultSchoolDisplayName,
  configTeacherSubjects,
  configTeacherSubjectsLoading,
  gradeSubjectMap,
  conflictSet,
  onReloadConflicts,
}: TeacherConfigDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={
          "flex h-[min(80vh,92dvh)] max-h-[min(80vh,92dvh)] w-[min(96vw,1100px)] max-w-[min(96vw,1100px)] " +
          "sm:max-w-[min(96vw,1100px)] md:max-w-[min(96vw,1100px)] lg:max-w-[min(96vw,1100px)] " +
          "flex-col gap-0 overflow-hidden border border-border/80 bg-card p-0 shadow-lg sm:rounded-xl"
        }
      >
        <DialogTitle className="sr-only">配置授课班级</DialogTitle>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6">
          <div className="mx-auto flex max-w-none flex-col gap-6">
            {teacher ? <TeacherConfigHeader teacher={teacher} /> : null}
            {teacher ? (
              <TeacherConfigBody
                open={open}
                teacher={teacher}
                subjects={subjects}
                subjectNameById={subjectNameById}
                classTree={classTree}
                classNameById={classNameById}
                relationMap={relationMap}
                lockedSchoolId={lockedSchoolId}
                defaultSchoolOrgId={defaultSchoolOrgId ?? null}
                defaultSchoolDisplayName={defaultSchoolDisplayName ?? null}
                relationLoading={relationLoading}
                onAdd={onAdd}
                onRemove={onRemove}
                configTeacherSubjects={configTeacherSubjects}
                configTeacherSubjectsLoading={configTeacherSubjectsLoading}
                gradeSubjectMap={gradeSubjectMap}
                conflictSet={conflictSet}
                onReloadConflicts={onReloadConflicts}
              />
            ) : (
              <p className="text-sm text-muted-foreground">请先选择教师</p>
            )}
          </div>
        </div>

        <TeacherConfigFooter
          dirty={dirty}
          savePending={savePending}
          onClose={() => onOpenChange(false)}
          onSave={onSave}
          onSaveAndContinue={onSaveAndContinue}
        />
      </DialogContent>
    </Dialog>
  );
}
