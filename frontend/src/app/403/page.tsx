"use client";

import { Button } from "@bs-lab/ui";
import { useRouter } from "next/navigation";

export default function ForbiddenPage() {
  const router = useRouter();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-2xl font-semibold">403</div>
      <div className="text-sm text-muted-foreground">当前角色没有权限访问该页面。</div>
      <Button onClick={() => router.back()}>返回上一页</Button>
    </div>
  );
}
