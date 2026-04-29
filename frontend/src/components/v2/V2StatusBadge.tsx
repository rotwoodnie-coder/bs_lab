"use client";

import { Badge } from "@bs-lab/ui";

// ─── 实验状态 ──────────────────────────────────────────────
const EXP_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  y: { label: "已上架", variant: "default" },
  n: { label: "已下架", variant: "secondary" },
  t: { label: "待审核", variant: "outline" },
};

// ─── 题库状态 ──────────────────────────────────────────────
const QUESTION_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  y: { label: "已入库", variant: "default" },
  n: { label: "已驳回", variant: "destructive" },
  t: { label: "待处理", variant: "outline" },
};

// ─── 用户状态 ──────────────────────────────────────────────
const USER_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  y: { label: "正常", variant: "default" },
  n: { label: "已冻结", variant: "destructive" },
};

// ─── 组织状态 ──────────────────────────────────────────────
const ORG_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  y: { label: "启用", variant: "default" },
  n: { label: "停用", variant: "secondary" },
};

type BadgeType = "exp" | "question" | "user" | "org";

const STATUS_MAP: Record<BadgeType, typeof EXP_STATUS_MAP> = {
  exp: EXP_STATUS_MAP,
  question: QUESTION_STATUS_MAP,
  user: USER_STATUS_MAP,
  org: ORG_STATUS_MAP,
};

interface V2StatusBadgeProps {
  type: BadgeType;
  status: string | null | undefined;
  className?: string;
}

export function V2StatusBadge({ type, status, className }: V2StatusBadgeProps) {
  const map = STATUS_MAP[type];
  const config = status ? map[status] : undefined;

  if (!config) {
    return (
      <Badge variant="outline" className={className}>
        {status ?? "—"}
      </Badge>
    );
  }

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
