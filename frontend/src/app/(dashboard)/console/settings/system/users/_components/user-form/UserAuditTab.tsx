import * as React from "react";

import { ScrollArea } from "@bs-lab/ui";
import { formatZhDateTime } from "@/lib/datetime/format-zh";

function mockAuditLines(username: string, id: string) {
  return [
    { t: formatZhDateTime("2026-04-12 08:10:00"), m: `${username} 修改个人资料（邮箱脱敏展示）` },
    { t: formatZhDateTime("2026-04-11 17:22:00"), m: `${username} 登录控制台（IP 已脱敏）` },
    { t: formatZhDateTime("2026-04-10 09:01:00"), m: `管理员调整角色：${id.slice(0, 8)}…` },
    { t: formatZhDateTime("2026-04-08 14:55:00"), m: `${username} 导出实验报表（）` },
  ];
}

export function UserAuditTab(props: { auditSubject: string; editingId: string | null }) {
  return (
    <ScrollArea className="h-[min(52vh,420px)] pr-3">
      <ul className="space-y-3 text-sm">
        {mockAuditLines(props.auditSubject, props.editingId ?? "new").map((line) => (
          <li
            key={line.t + line.m}
            className="rounded-md border border-border bg-muted/30 px-3 py-2 text-muted-foreground"
          >
            <div className="text-xs text-foreground/80">{line.t}</div>
            <div className="mt-1 text-foreground">{line.m}</div>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}

