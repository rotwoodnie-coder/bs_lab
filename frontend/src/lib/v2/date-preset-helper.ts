/**
 * 预设日期计算与长期锚点常量
 *
 * 遵循真源层级：
 * - 长期有效在 MySQL 中存储为 "2099-12-31 23:59:59"
 * - 排序友好（查询"即将到期"时自动排最后），避开 Y2K38，业务自解释
 */

/** 长期有效锚点值（MySQL datetime 格式） */
export const ETERNAL_ANCHOR = "2099-12-31 23:59:59";

/** 长期有效锚点值（HTML datetime-local 格式，缺 :ss） */
export const ETERNAL_ANCHOR_LOCAL = "2099-12-31 23:59";

export interface DatePreset {
  label: string;
  value: string; // HTML datetime-local 格式 "YYYY-MM-DDTHH:MM"
}

/**
 * 计算从当前时刻偏移 N 年的日期，返回 HTML datetime-local 格式（YYYY-MM-DDTHH:MM）。
 * 时间保持当前时刻，日期为当前月日（保留原月日）。
 */
export function addYears(date: Date, years: number): string {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return formatToLocal(d);
}

/** 将 Date 对象格式化为 HTML datetime-local 所需的 "YYYY-MM-DDTHH:MM" */
function formatToLocal(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hour = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${min}`;
}

/**
 * 生成预设快捷按钮列表
 * 返回四个标签：[ 1年 ] [ 3年 ] [ 5年 ] [ 长期 ]
 * 点击后直接跳转到对应日期，无需打开日历面板。
 */
export function getDatePresets(now = new Date()): DatePreset[] {
  return [
    { label: "1 年", value: addYears(now, 1) },
    { label: "3 年", value: addYears(now, 3) },
    { label: "5 年", value: addYears(now, 5) },
    { label: "长期", value: ETERNAL_ANCHOR_LOCAL },
  ];
}

/**
 * 将 datetime-local 值转为 MySQL datetime 格式
 * 同时做了边界收敛：超过 2099-12-31 23:59:59 → ETERNAL_ANCHOR
 */
export function toMysqlDatetime(localValue: string): string {
  const raw = localValue.trim().replace("T", " ");
  if (!raw) return "";
  // 补秒：YYYY-MM-DD HH:MM → YYYY-MM-DD HH:MM:00
  const withSec = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(raw) ? `${raw}:00` : raw;
  // 边界收敛：超过 2099-12-31 23:59:59 → ETERNAL_ANCHOR
  if (withSec > ETERNAL_ANCHOR) return ETERNAL_ANCHOR;
  // 锁定长期锚点：HTML datetime-local 传 "2099-12-31T23:59" → 补秒得 "2099-12-31 23:59:00"
  // 必须显式归一到精确锚点 "2099-12-31 23:59:59"，否则未来精准匹配会漏掉
  if (withSec === "2099-12-31 23:59:00" || withSec === "2099-12-31") return ETERNAL_ANCHOR;
  return withSec;
}
