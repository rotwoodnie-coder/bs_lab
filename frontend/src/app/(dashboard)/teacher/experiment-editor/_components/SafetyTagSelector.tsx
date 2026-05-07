"use client";

import * as React from "react";

import { Badge } from "@bs-lab/ui";

import type { ExperimentSecurityDraft } from "../types";

/**
 * 实验安全标识选择器。
 * 从材料的安全标签（exp_material_security → data_material_security）提取候选项，
 * 用户勾选后存入 exp_security 表。
 * 利用 securityLevel 展示风险等级色标。
 */
export function SafetyTagSelector(props: {
  /** 安全标识草稿列表（含已选/未选状态） */
  drafts: ExperimentSecurityDraft[];
  /** 勾选/取消勾选 */
  onToggle: (securityId: string) => void;
  disabled: boolean;
}) {
  const { drafts, onToggle, disabled } = props;

  if (!drafts.length) return null;

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foreground">实验安全标识（来自材料属性）</p>
      <p className="mb-2 text-xs text-muted-foreground">
        系统从实验材料的安全标签中提取以下候选项，勾选的将作为实验的整体安全标识。
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {drafts.map((item) => (
          <button
            key={item.securityId}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(item.securityId)}
            className="focus-visible:outline-none"
          >
            <Badge
              variant={getSecurityBadgeVariant(item.securityLevel, item.selected)}
              className={`cursor-pointer select-none transition-colors ${
                item.selected && !item.securityLevel
                  ? "bg-[#008080] hover:bg-[#006666]"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {item.securityName}
              {item.selected ? " ✕" : " ＋"}
              {renderSecurityLevelDot(item.securityLevel)}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * 根据 security_level 确定 Badge 变体。
 * securityLevel: 1=安全(success), 2=注意(warning), 3~4=危险(destructive), null/其他=outline
 */
function getSecurityBadgeVariant(level: number | null, selected: boolean): "default" | "secondary" | "destructive" | "warning" | "outline" | "success" {
  if (selected) return "default";
  if (level == null) return "outline";
  if (level <= 1) return "success";
  if (level === 2) return "warning";
  if (level >= 3) return "destructive";
  return "outline";
}

/** 风险等级小圆点指示器 */
function renderSecurityLevelDot(level: number | null): React.ReactNode {
  if (level == null) return null;
  // 色标：绿(1) → 黄(2) → 橙(3) → 红(4)
  const dotColor =
    level <= 1
      ? "bg-green-500"
      : level === 2
        ? "bg-yellow-500"
        : level >= 3
          ? "bg-red-500"
          : "bg-gray-300";
  return (
    <span
      className={`ml-1 inline-block h-2 w-2 rounded-full ${dotColor}`}
      title={`风险等级：${level}`}
    />
  );
}
