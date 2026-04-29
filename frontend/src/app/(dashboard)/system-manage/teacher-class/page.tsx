"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { TeacherClassAdmin } from "./TeacherClassAdmin";

export default function TeacherClassPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          加载教师授课关系…
        </div>
      }
    >
      <div className="w-full max-w-none space-y-6 bg-muted/25">
        <PageHeader
          className="mb-6 px-0"
          title="教师授课关系"
          description="为每位教师配置授课班级与学科，支持表格与卡片双视图切换。"
        />
        <TeacherClassAdmin />
      </div>
    </React.Suspense>
  );
}
