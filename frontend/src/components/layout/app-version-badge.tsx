"use client";

import * as React from "react";

/**
 * 从后端 `/v2/version` 获取当前部署版本号并显示。
 * 静默失败——不展示版本号比报错好。
 */
export function AppVersionBadge() {
  const [version, setVersion] = React.useState<string | null>(null);
  React.useEffect(() => {
    fetch("/v2/version")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.success && d?.data?.version) setVersion(d.data.version);
      })
      .catch(() => { /* 静默失败 */ });
  }, []);
  if (!version) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border/40 bg-muted/30 px-1.5 py-0.5 text-[11px] font-mono leading-none text-muted-foreground/60">
      v{version}
    </span>
  );
}
