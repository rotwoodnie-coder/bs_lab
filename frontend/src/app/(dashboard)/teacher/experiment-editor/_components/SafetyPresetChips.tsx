"use client";

import * as React from "react";

import { Badge } from "@bs-lab/ui";

import type { V2DictItem } from "@/lib/v2/v2-exp-api";

/**
 * 安全注意事项 / 危险提示预设标签组件。
 * 从字典表 data_material_security 加载标签列表，点击可追加/移除对应文本到富文本编辑器。
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
              variant={active ? "default" : "outline"}
              className={`cursor-pointer select-none transition-colors ${
                active
                  ? "bg-[#008080] hover:bg-[#006666]"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {label}
              {active ? " ✕" : " ＋"}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}

/** 转义正则特殊字符 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
