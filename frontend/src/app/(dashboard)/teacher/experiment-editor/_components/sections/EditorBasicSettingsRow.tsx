"use client";

import * as React from "react";

import { Button, Input, Label, RadioGroup, RadioGroupItem } from "@bs-lab/ui";
import { ExternalLink } from "@bs-lab/ui/icons";

type Props = {
  chooseType: "y" | "n" | null;
  participation: "required" | "optional";
  fieldDisabled: boolean;
  onChooseTypeChange: (v: "y" | "n" | null) => void;
  difficulty: "basic" | "intermediate" | "advanced";
  onDifficultyChange: (v: "basic" | "intermediate" | "advanced") => void;
  simulatorUrl: string;
  onSimulatorUrlChange: (v: string) => void;
};

export function EditorBasicSettingsRow(props: Props) {
  const { chooseType, participation, fieldDisabled, onChooseTypeChange, difficulty, onDifficultyChange, simulatorUrl, onSimulatorUrlChange } = props;

  return (
    <div className="grid gap-4 lg:col-span-12 lg:grid-cols-3">
      <div className="grid gap-2">
        <Label>实验类型</Label>
        <RadioGroup
          value={chooseType === "y" ? "required" : chooseType === "n" ? "optional" : participation}
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
        <RadioGroup
          value={difficulty}
          onValueChange={(v) => onDifficultyChange(v as "basic" | "intermediate" | "advanced")}
          className="flex flex-wrap gap-4"
        >
          <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="basic" disabled={fieldDisabled} />基础</label>
          <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="intermediate" disabled={fieldDisabled} />进阶</label>
          <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="advanced" disabled={fieldDisabled} />挑战</label>
        </RadioGroup>
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
