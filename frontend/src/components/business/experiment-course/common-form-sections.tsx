"use client";

import * as React from "react";

import { Button, Card, CardContent, CardHeader, CardTitle, Label, Textarea } from "@bs-lab/ui";
import { Sparkles } from "@bs-lab/ui/icons";

type CommonFormSectionsProps = {
  principle: string;
  onPrincipleChange: (value: string) => void;
  objectivesText?: string;
  onObjectivesChange?: (value: string) => void;
  stepsText?: string;
  onStepsTextChange?: (value: string) => void;
  onAiOptimizeObjectives?: () => void;
  onAiOptimizeSteps?: () => void;
  aiBusyField?: "objectives" | "steps" | null;
  disabled?: boolean;
  children?: React.ReactNode;
};

export function CommonFormSections({
  principle,
  onPrincipleChange,
  objectivesText,
  onObjectivesChange,
  stepsText,
  onStepsTextChange,
  onAiOptimizeObjectives,
  onAiOptimizeSteps,
  aiBusyField = null,
  disabled = false,
  children,
}: CommonFormSectionsProps) {
  return (
    <Card id="design" className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">实验设计（原理 / 材料 / 步骤）</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="exp-principle">实验原理</Label>
          <Textarea
            id="exp-principle"
            value={principle}
            onChange={(e) => onPrincipleChange(e.target.value)}
            rows={3}
            disabled={disabled}
          />
        </div>
        {objectivesText !== undefined && onObjectivesChange ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="objectives">实验目标</Label>
              {onAiOptimizeObjectives ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={aiBusyField === "objectives"}
                  onClick={onAiOptimizeObjectives}
                >
                  <Sparkles className="mr-1 size-3.5" />
                  AI 优化
                </Button>
              ) : null}
            </div>
            <Textarea
              id="objectives"
              value={objectivesText}
              onChange={(event) => onObjectivesChange(event.target.value)}
              disabled={disabled}
            />
          </div>
        ) : null}
        {children}
        {stepsText !== undefined && onStepsTextChange ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="steps">实验步骤</Label>
              {onAiOptimizeSteps ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={aiBusyField === "steps"}
                  onClick={onAiOptimizeSteps}
                >
                  <Sparkles className="mr-1 size-3.5" />
                  AI 优化
                </Button>
              ) : null}
            </div>
            <Textarea
              id="steps"
              value={stepsText}
              onChange={(event) => onStepsTextChange(event.target.value)}
              disabled={disabled}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
