"use client";

import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bs-lab/ui";
import {
  AUDIT_CATEGORY_LABEL,
  AUDIT_RISK_LABEL,
  type AuditTimePreset,
  type ConsoleAuditCategory,
  type ConsoleAuditRisk,
} from "@/lib/console-audit-log";

export function AuditLogFilterBar({
  q,
  onQChange,
  timePreset,
  onTimePresetChange,
  actorFilter,
  onActorFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  riskFilter,
  onRiskFilterChange,
  actorOptions,
}: {
  q: string;
  onQChange: (v: string) => void;
  timePreset: AuditTimePreset;
  onTimePresetChange: (v: AuditTimePreset) => void;
  actorFilter: string;
  onActorFilterChange: (v: string) => void;
  categoryFilter: ConsoleAuditCategory | "all";
  onCategoryFilterChange: (v: ConsoleAuditCategory | "all") => void;
  riskFilter: ConsoleAuditRisk | "all";
  onRiskFilterChange: (v: ConsoleAuditRisk | "all") => void;
  actorOptions: string[];
}) {
  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-end">
      <Input
        placeholder="关键词：操作人、Target、摘要…"
        value={q}
        onChange={(e) => onQChange(e.target.value)}
        className="h-8 max-w-md text-sm lg:flex-1"
      />
      <div className="flex flex-wrap gap-2">
        <Select value={timePreset} onValueChange={(v) => onTimePresetChange(v as AuditTimePreset)}>
          <SelectTrigger className="h-8 w-[130px] text-xs" aria-label="时间段">
            <SelectValue placeholder="时间段" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">今日</SelectItem>
            <SelectItem value="7d">近 7 天</SelectItem>
            <SelectItem value="30d">近 30 天</SelectItem>
            <SelectItem value="all">全部</SelectItem>
          </SelectContent>
        </Select>
        <Select value={actorFilter} onValueChange={onActorFilterChange}>
          <SelectTrigger className="h-8 w-[160px] text-xs" aria-label="操作人">
            <SelectValue placeholder="操作人" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部操作人</SelectItem>
            {actorOptions.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => onCategoryFilterChange(v as ConsoleAuditCategory | "all")}>
          <SelectTrigger className="h-8 w-[130px] text-xs" aria-label="分类">
            <SelectValue placeholder="分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {(Object.keys(AUDIT_CATEGORY_LABEL) as ConsoleAuditCategory[]).map((c) => (
              <SelectItem key={c} value={c}>{AUDIT_CATEGORY_LABEL[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={(v) => onRiskFilterChange(v as ConsoleAuditRisk | "all")}>
          <SelectTrigger className="h-8 w-[118px] text-xs" aria-label="风险">
            <SelectValue placeholder="风险" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部等级</SelectItem>
            {(Object.keys(AUDIT_RISK_LABEL) as ConsoleAuditRisk[]).map((r) => (
              <SelectItem key={r} value={r}>{AUDIT_RISK_LABEL[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
