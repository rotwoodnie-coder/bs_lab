"use client";

import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bs-lab/ui";

export const TEXTBOOK_REF_GRADE_NONE = "__none__";

type Opt = { id: string; name: string };

export function TextbookRefGradeSelect(props: {
  labelId: string;
  value: string;
  onValueChange: (v: string) => void;
  /** 缺省或为空时仅展示「不限年级」 */
  options?: Opt[] | null;
}) {
  const opts = Array.isArray(props.options) ? props.options : [];
  return (
    <div className="space-y-1">
      <Label htmlFor={props.labelId}>年级</Label>
      <Select value={props.value} onValueChange={props.onValueChange}>
        <SelectTrigger id={props.labelId} className="w-full">
          <SelectValue placeholder="选择年级" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TEXTBOOK_REF_GRADE_NONE}>不限年级</SelectItem>
          {opts.map((g) => (
            <SelectItem key={g.id} value={g.id}>
              {g.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
