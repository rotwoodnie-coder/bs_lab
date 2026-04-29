"use client";

import * as React from "react";

import { Spinner } from "@bs-lab/ui";

import { TeacherMaterialWaterfall } from "@/app/(dashboard)/teacher/materials/_components/TeacherMaterialWaterfall";

import { useHomeVideoSquare } from "./home-video-square.hooks";
import { ParentBindingGuard } from "./parent-binding-guide";

export function ManagementHomeView() {
  const { items, loading, actor } = useHomeVideoSquare();

  return (
    <ParentBindingGuard>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">实验课程数</p>
          <p className="mt-2 text-2xl font-semibold">0</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">学生作业数</p>
          <p className="mt-2 text-2xl font-semibold">0</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">作品数</p>
          <p className="mt-2 text-2xl font-semibold">0</p>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        ) : (
          <TeacherMaterialWaterfall
            actor={actor}
            items={items}
            mode="waterfall"
            readOnly
          />
        )}
      </div>
    </ParentBindingGuard>
  );
}
