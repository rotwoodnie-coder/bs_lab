"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminMenuConfigPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/console/settings/system/roles");
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      正在跳转到「角色与权限」…
    </div>
  );
}
