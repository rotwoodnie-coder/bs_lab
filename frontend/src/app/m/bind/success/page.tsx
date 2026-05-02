"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileCard } from "@/components/mobile/MobileCard";

export default function BindSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.href = "/m";
    }, 800);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="p-4">
      <MobileCard title="绑定成功" subtitle="正在返回首页...">
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>绑定状态已更新，页面即将跳转。</p>
          <button
            onClick={() => router.replace("/m")}
            className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
          >
            立即进入首页
          </button>
        </div>
      </MobileCard>
    </div>
  );
}
