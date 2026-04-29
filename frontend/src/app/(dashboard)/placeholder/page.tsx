"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bs-lab/ui";
import { Construction } from "@bs-lab/ui/icons";

import { parseUserRoleParam, userRoleLabelZh } from "@/types/auth";

function PlaceholderContent() {
  const sp = useSearchParams();
  const path = sp.get("path") ?? "/—";
  const title = sp.get("title") ?? "未命名模块";
  const roleParam = parseUserRoleParam(sp.get("role"));
  const roleLabel = roleParam ? userRoleLabelZh(roleParam) : "未知身份";

  return (
    <div className="mx-auto flex min-h-[min(70vh,560px)] max-w-lg flex-col justify-center">
      <Card className="border-border shadow-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted">
            <Construction className="size-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">模块建设中</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            当前访问路径（规划路由）
          </CardDescription>
          <p className="break-all font-mono text-sm text-foreground">{path}</p>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-sm text-muted-foreground">
          <p>
            模块「<span className="font-medium text-foreground">{title}</span>」为
            <span className="font-medium text-primary">「{roleLabel}」</span>
            专属能力，正在开发中。
          </p>
          <p>侧栏可继续切换身份或返回其他菜单；本页为纯交互占位，无后端请求。</p>
          <Link
            href="/profile"
            className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            返回个人中心
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PlaceholderModulePage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          加载占位信息…
        </div>
      }
    >
      <PlaceholderContent />
    </React.Suspense>
  );
}
