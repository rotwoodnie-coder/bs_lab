"use client";

import * as React from "react";

import { Button, Input, Label, RadioGroup, RadioGroupItem, Skeleton } from "@bs-lab/ui";
import { ExternalLink } from "@bs-lab/ui/icons";

type DifficultyOption = {
  id: string;
  name: string;
};

type Props = {
  chooseType: "y" | "n" | null;
  fieldDisabled: boolean;
  onChooseTypeChange: (v: "y" | "n" | null) => void;
  expTaskType: "hw" | "tk" | "self" | null;
  expTaskTypeDisabled: boolean;
  onExpTaskTypeChange: (v: "hw" | "tk" | "self" | null) => void;
  difficultyId: string;
  onDifficultyIdChange: (v: string) => void;
  difficultyOptions: DifficultyOption[];
  difficultyLoading: boolean;
  simulatorUrl: string;
  onSimulatorUrlChange: (v: string) => void;
};

export function EditorBasicSettingsRow(props: Props) {
  const {
    chooseType, fieldDisabled, onChooseTypeChange,
    expTaskType, expTaskTypeDisabled, onExpTaskTypeChange,
    difficultyId, onDifficultyIdChange, difficultyOptions, difficultyLoading,
    simulatorUrl, onSimulatorUrlChange,
  } = props;

  return (
    <div className="grid gap-4 lg:col-span-12 lg:grid-cols-4">
      <div className="grid gap-2">
        <Label>实验类型</Label>
        <RadioGroup
          key={`choose-${chooseType ?? "none"}`}
          defaultValue={chooseType === "y" ? "required" : "optional"}
          onValueChange={(v) => onChooseTypeChange(v === "required" ? "y" : "n")}
          className="flex flex-wrap gap-4"
        >
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="required" disabled={fieldDisabled} />必做
          </label>
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="optional" disabled={fieldDisabled} />选做
          </label>
        </RadioGroup>
      </div>
      <div className="grid gap-2">
        <Label>实验难度</Label>
        {difficultyLoading ? (
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        ) : difficultyOptions.length === 0 ? (
          <p className="text-xs text-muted-foreground">暂无可选难度</p>
        ) : (
          <RadioGroup
            key={`difficulty-${difficultyId || "none"}`}
            defaultValue={difficultyId}
            onValueChange={(v) => onDifficultyIdChange(v)}
            className="flex flex-wrap gap-4"
          >
            {difficultyOptions.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 text-sm">
                <RadioGroupItem value={opt.id} disabled={fieldDisabled} />
                {opt.name}
              </label>
            ))}
          </RadioGroup>
        )}
      </div>
      <div className="grid gap-2">
        <Label>任务类型</Label>
        <RadioGroup
          key={`task-${expTaskType ?? "self"}`}
          defaultValue={expTaskType ?? "self"}
          onValueChange={(v) => onExpTaskTypeChange(v as "hw" | "tk" | "self")}
          className="flex flex-wrap gap-4"
        >
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="self" disabled={fieldDisabled || expTaskTypeDisabled} />自主探究
          </label>
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="hw" disabled={fieldDisabled || expTaskTypeDisabled} />作业
          </label>
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="tk" disabled={fieldDisabled || expTaskTypeDisabled} />同做
          </label>
        </RadioGroup>
        {expTaskTypeDisabled ? (
          <p className="text-xs text-muted-foreground">该实验已被布置为作业，不可修改任务类型。</p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="simulator-url">模拟器地址</Label>
        <div className="flex gap-2">
          <Input
            id="simulator-url"
            value={simulatorUrl}
            onChange={(e) => onSimulatorUrlChange(e.target.value)}
            disabled={fieldDisabled}
            placeholder="请输入在线模拟器链接"
            className="flex-1"
          />
          {simulatorUrl.trim() ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0 gap-1.5"
              onClick={() => window.open(simulatorUrl, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="size-3.5" />
              打开
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
