"use client";

import * as React from "react";
import { Badge, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bs-lab/ui";
import type { TeacherMaterialKind } from "@/lib/teacher-materials-api";
import { TeacherMaterialExperimentField } from "./TeacherMaterialExperimentField";

type Props = {
  title: string;
  onTitleChange: (value: string) => void;
  kind: TeacherMaterialKind;
  kindOptions: { value: string; label: string }[];
  onKindChange: (value: TeacherMaterialKind) => void;
  selectedFilesCount: number;
  experimentId: string | null;
  linkedExperimentTitle: string | null;
  experimentOptions?: { value: string; label: string }[];
  experimentOptionsLoading?: boolean;
  submitting: boolean;
  onExperimentChange: (next: { experimentId: string | null; linkedExperimentTitle: string | null }) => void;
};

export function TeacherMaterialCreateMetaPanel(props: Props) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/10 p-3">
      <div className="space-y-1">
        <Label htmlFor="material-title">素材名称</Label>
        <Input
          id="material-title"
          value={props.title}
          onChange={(e) => props.onTitleChange(e.currentTarget.value)}
          placeholder={props.selectedFilesCount > 1 ? "多文件时将按各自文件名生成" : "留空则使用文件名"}
          disabled={props.selectedFilesCount > 1}
        />
        {props.selectedFilesCount > 1 ? (
          <p className="text-xs text-muted-foreground">多文件批量创建时，每条素材名称取自对应文件名。</p>
        ) : (
          <p className="text-xs text-muted-foreground">单个文件时可自定义名称；留空则使用上传文件名。</p>
        )}
      </div>
      <div className="space-y-1">
        <Label>素材类型</Label>
        <Select value={props.kind} onValueChange={(v) => props.onKindChange(v as TeacherMaterialKind)}>
          <SelectTrigger>
            <SelectValue placeholder="选择类型" />
          </SelectTrigger>
          <SelectContent>
            {props.kindOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <TeacherMaterialExperimentField
        value={props.experimentId}
        linkedExperimentTitle={props.linkedExperimentTitle}
        options={props.experimentOptions ?? []}
        loading={props.experimentOptionsLoading}
        disabled={props.submitting}
        onChange={props.onExperimentChange}
      />
      <div className="rounded-md border border-border bg-background p-2 text-xs text-muted-foreground">
        <div className="mb-1 font-medium text-foreground">创建预览</div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary">{props.kindOptions.find((option) => option.value === props.kind)?.label ?? props.kind}</Badge>
        </div>
      </div>
    </div>
  );
}
