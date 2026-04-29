"use client";

import * as React from "react";
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bs-lab/ui";
import { cn } from "@/lib/utils";
import type { OrgNode } from "@/types/org";

export type OrgPickerProps = {
  roots: readonly OrgNode[];
  /** 选中的班级节点 id */
  value: string | null;
  onChange: (classOrgId: string) => void;
  disabled?: boolean;
  className?: string;
};

function districtNodes(roots: readonly OrgNode[]): OrgNode[] {
  return roots.filter((r) => r.level === "district");
}

function schoolsOf(district: OrgNode | undefined): OrgNode[] {
  return (district?.children ?? []).filter((c) => c.level === "school");
}

function classesOf(school: OrgNode | undefined): OrgNode[] {
  return (school?.children ?? []).filter((c) => c.level === "class");
}

function findDistrictContainingClass(roots: readonly OrgNode[], classId: string): OrgNode | undefined {
  for (const d of districtNodes(roots)) {
    for (const s of schoolsOf(d)) {
      if (classesOf(s).some((c) => c.id === classId)) return d;
    }
  }
  return undefined;
}

function findSchoolContainingClass(roots: readonly OrgNode[], classId: string): OrgNode | undefined {
  for (const d of districtNodes(roots)) {
    for (const s of schoolsOf(d)) {
      if (classesOf(s).some((c) => c.id === classId)) return s;
    }
  }
  return undefined;
}

/**
 * 区 → 校 → 班三级下钻；窄屏纵向堆叠，宽屏同一行三列。
 */
export function OrgPicker({ roots, value, onChange, disabled, className }: OrgPickerProps) {
  const districts = React.useMemo(() => districtNodes(roots), [roots]);
  const firstDistrict = districts[0];

  const pickDefaultChain = React.useCallback(() => {
    const d = firstDistrict;
    const s = schoolsOf(d)[0];
    const c = classesOf(s)[0];
    return { d: d?.id ?? "", s: s?.id ?? "", c: c?.id ?? "" };
  }, [firstDistrict]);

  const [districtId, setDistrictId] = React.useState(() => pickDefaultChain().d);
  const [schoolId, setSchoolId] = React.useState(() => pickDefaultChain().s);
  const [classId, setClassId] = React.useState(() => value ?? pickDefaultChain().c);

  React.useEffect(() => {
    if (!value) {
      const { d, s, c } = pickDefaultChain();
      setDistrictId(d);
      setSchoolId(s);
      if (c) setClassId(c);
      return;
    }
    const d = findDistrictContainingClass(roots, value);
    const s = findSchoolContainingClass(roots, value);
    if (d) setDistrictId(d.id);
    if (s) setSchoolId(s.id);
    setClassId(value);
  }, [roots, value, pickDefaultChain]);

  const activeDistrict = districts.find((d) => d.id === districtId) ?? firstDistrict;
  const schools = schoolsOf(activeDistrict);
  const activeSchool = schools.find((s) => s.id === schoolId) ?? schools[0];
  const classes = classesOf(activeSchool);

  const emitClass = React.useCallback(
    (nextDistrict: string, nextSchool: string, nextClass: string) => {
      setDistrictId(nextDistrict);
      setSchoolId(nextSchool);
      setClassId(nextClass);
      if (nextClass) onChange(nextClass);
    },
    [onChange],
  );

  if (!districts.length) {
    return <p className="text-sm text-muted-foreground">暂无组织数据</p>;
  }

  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">区 / 教育学院</Label>
        <Select
          value={activeDistrict?.id}
          onValueChange={(id) => {
            const d = districts.find((x) => x.id === id);
            const ns = schoolsOf(d)[0];
            const nc = classesOf(ns)[0];
            emitClass(id, ns?.id ?? "", nc?.id ?? "");
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="选择区级" />
          </SelectTrigger>
          <SelectContent>
            {districts.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">学校 / 校区</Label>
        <Select
          value={activeSchool?.id}
          onValueChange={(id) => {
            const ns = schools.find((s) => s.id === id);
            const nc = classesOf(ns)[0];
            emitClass(activeDistrict?.id ?? "", id, nc?.id ?? "");
          }}
          disabled={disabled || !schools.length}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="选择学校" />
          </SelectTrigger>
          <SelectContent>
            {schools.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
                {s.code ? `（${s.code}）` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">年级 / 班级</Label>
        <Select
          value={classId}
          onValueChange={(id) => emitClass(activeDistrict?.id ?? "", activeSchool?.id ?? "", id)}
          disabled={disabled || !classes.length}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="选择班级" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
                {c.code ? ` · ${c.code}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
