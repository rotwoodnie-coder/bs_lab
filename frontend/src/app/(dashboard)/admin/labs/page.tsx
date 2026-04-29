"use client";

import * as React from "react";
import { Construction } from "@bs-lab/ui/icons";

/**
 * 全 Mock 页面 — 待真实数据接入后替换。
 */
export default function AdminLabsPage() {
  return (
    <div className="mx-auto flex min-h-[min(70vh,560px)] max-w-lg flex-col justify-center">
      <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted">
          <Construction className="size-8 text-muted-foreground" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-foreground">页面开发中</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          实验室实时监控页面正在开发中，数据待真实 IoT 网关接入后展示。
        </p>
      </div>
    </div>
  );
}
