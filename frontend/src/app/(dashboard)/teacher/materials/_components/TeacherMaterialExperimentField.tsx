"use client";

import * as React from "react";
import { Button, Combobox, Label } from "@bs-lab/ui";

type ExperimentOption = {
  value: string;
  label: string;
};

type Props = {
  value: string | null;
  linkedExperimentTitle: string | null;
  options: ExperimentOption[];
  disabled?: boolean;
  loading?: boolean;
  onChange: (next: { experimentId: string | null; linkedExperimentTitle: string | null }) => void;
};

export function TeacherMaterialExperimentField(props: Props) {
  const selected = React.useMemo(
    () => (props.value ? props.options.find((item) => item.value === props.value) ?? null : null),
    [props.options, props.value],
  );
  return (
    <div className="space-y-1">
      <Label>关联标准试验（可选）</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Combobox
          options={props.options}
          value={props.value ?? undefined}
          onValueChange={(next) => {
            const selectedOption = props.options.find((item) => item.value === next) ?? null;
            props.onChange({
              experimentId: selectedOption?.value ?? null,
              linkedExperimentTitle: selectedOption?.label ?? null,
            });
          }}
          placeholder={props.loading ? "标准试验列表加载中…" : "搜索并选择标准试验"}
          triggerClassName="min-w-0 w-full sm:max-w-[320px]"
          disabled={props.disabled || props.loading}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={props.disabled || (!props.value && !props.linkedExperimentTitle)}
          onClick={() => props.onChange({ experimentId: null, linkedExperimentTitle: null })}
        >
          清空关联
        </Button>
      </div>
      {selected ? (
        <p className="text-xs text-muted-foreground">已关联：{selected.label}</p>
      ) : props.linkedExperimentTitle ? (
        <p className="text-xs text-muted-foreground">当前关联名称：{props.linkedExperimentTitle}</p>
      ) : (
        <p className="text-xs text-muted-foreground">未关联标准试验</p>
      )}
    </div>
  );
}
