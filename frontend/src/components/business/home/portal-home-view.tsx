"use client";

import * as React from "react";

import { Spinner } from "@bs-lab/ui";

import { TeacherMaterialWaterfall } from "@/app/(dashboard)/teacher/materials/_components/TeacherMaterialWaterfall";

import { useHomeVideoSquare } from "./home-video-square.hooks";

export function PortalHomeView() {
  const { items, loading, actor } = useHomeVideoSquare();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="py-2">
      <TeacherMaterialWaterfall
        actor={actor}
        items={items}
        mode="waterfall"
        readOnly
      />
    </div>
  );
}
