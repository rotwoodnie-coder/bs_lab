"use client";

import * as React from "react";

import { Badge } from "@bs-lab/ui";

import type { V2DictItem } from "@/lib/v2/v2-exp-api";

/**
 * 安全注意事项 / 危险提示预设标签组件。
 * 从字典表 data_material_security 加载标签列表，点击可追加/移除对应文本到富文本编辑器。
 * 利用 security_level 展示风险等级色标。
 */
export function SafetyPresetChips(props: {
  /** 安全标识字典项 */
  securities: V2DictItem[];
  /** 当前编辑器文本内容 */
  currentText: string;
  /** 文本变更回调 */
  onChange: (nextText: string) => void;
  disabled: boolean;
}) {
  const { securities, currentText, onChange, disabled } = props;

  if (!securities.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs text-muted-foreground">快速输入：</span>
      {securities.map((item) => {
        const label = item.name;
        const active = currentText.includes(label);
        const badgeVariant = getSecurityBadgeVariant(item.securityLevel, active);
        return (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (active) {
                // 从文本中移除该标签
                const cleaned = currentText
                  .replace(new RegExp(`(,?\\s*)${escapeRegex(label)}(\\s*,?\\s*)`), (_, leading, trailing) => {
                    // 如果前后都有逗号分隔，保留一个分隔
                    const l = leading.replace(/,/g, "").trim();
                    const t = trailing.replace(/,/g, "").trim();
                    if (l && t) return `${l}、${t}`;
                    return l || t || "";
                  })
                  .replace(/^[、,]\s*/, "")
                  .replace(/[、,]\s*$/, "");
                onChange(cleaned);
              } else {
                // 追加该标签
                const trimmed = currentText.trim();
                const next = trimmed ? `${trimmed}、${label}` : label;
                onChange(next);
              }
            }}
            className="focus-visible:outline-none"
          >
            <Badge
              variant={badgeVariant}
              className={`cursor-pointer select-none transition-colors ${
                active && badgeVariant === "default"
                  ? "bg-[#008080] hover:bg-[#006666]"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {label}
              {active ? " ✕" : " ＋"}
              {renderSecurityLevelDot(item.securityLevel)}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}

/**
 * 根据 security_level 确定 Badge 变体。
 * securityLevel: 1=安全(success), 2=注意(warning), 3~4=危险(destructive), null/其他=outline
 */
function getSecurityBadgeVariant(level: number | null | undefined, active: boolean): "default" | "secondary" | "destructive" | "warning" | "outline" | "success" {
  if (active) return "default";
  if (level == null) return "outline";
  if (level <= 1) return "success";
  if (level === 2) return "warning";
  if (level >= 3) return "destructive";
  return "outline";
}

/** 风险等级小圆点指示器 */
function renderSecurityLevelDot(level: number | null | undefined): React.ReactNode {
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

/** 转义正则特殊字符 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
