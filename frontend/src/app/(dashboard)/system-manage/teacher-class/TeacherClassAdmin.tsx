"use client";

import * as React from "react";

import { useTeacherClassAdmin } from "./page.hooks";
import { useTeacherClassConfig } from "./page.config-hooks";
import { StatsCards } from "./_components/StatsCards";
import { TeacherClassTable } from "./_components/TeacherClassTable";
import { TeacherConfigDialog } from "./_components/TeacherConfigDialog";

export function TeacherClassAdmin() {
  const base = useTeacherClassAdmin();
  const config = useTeacherClassConfig(base.actor);

  const prevTeacherIdRef = React.useRef<string | null>(null);

  // 选中教师切换时加载其可教学科 & 年级-学科映射
  React.useEffect(() => {
    if (!base.selectedTeacherId) return;
    if (base.selectedTeacherId !== prevTeacherIdRef.current) {
      prevTeacherIdRef.current = base.selectedTeacherId;
      void config.loadTeacherSubjects(base.selectedTeacherId);
      void config.loadGradeSubjectMap();
    }
  }, [base.selectedTeacherId, config]);

  return (
    <div className="flex w-full max-w-none flex-col gap-5">
      <StatsCards stats={base.stats} loading={base.batchLoading} />

      <TeacherClassTable
        teachers={base.teachers}
        loading={base.teacherLoading}
        query={base.teacherQuery}
        onQueryChange={base.setTeacherQuery}
        allRelationsMap={base.allRelationsMap}
        classTree={base.classTree}
        classNameById={base.classNameById}
        subjectNameById={base.subjectNameById}
        schoolOrgId={base.schoolOrgId}
        schoolOrgName={base.schoolOrgName}
        subjects={base.subjects}
        onConfigure={base.openConfigDialog}
      />

      <TeacherConfigDialog
        open={base.configDialogOpen}
        onOpenChange={(v) => { if (!v) base.closeConfigDialog(); }}
        teacher={base.selectedTeacher}
        subjects={base.subjects}
        subjectNameById={base.subjectNameById}
        classTree={base.classTree}
        classNameById={base.classNameById}
        relationMap={base.relationMap}
        relationLoading={base.relationLoading}
        dirty={base.dirty}
        savePending={base.savePending}
        onAdd={base.handleAdd}
        onRemove={base.handleRemove}
        onSave={base.handleSave}
        onSaveAndContinue={base.handleSaveAndContinue}
        lockedSchoolId={base.schoolOrgId}
        defaultSchoolOrgId={base.configDefaultSchoolOrgId}
        defaultSchoolDisplayName={base.configDefaultSchoolDisplayName}
        configTeacherSubjects={config.configTeacherSubjects}
        configTeacherSubjectsLoading={config.configTeacherSubjectsLoading}
        gradeSubjectMap={config.gradeSubjectMap}
        conflictSet={config.conflictSet}
        onReloadConflicts={(gradeId) => config.reloadConflicts(base.selectedTeacherId ?? "", gradeId)}
      />
    </div>
  );
}
