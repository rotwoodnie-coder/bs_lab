"use client";

import * as React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@bs-lab/ui";

import type { CatalogCategory } from "@/lib/experiment-catalog-api";

import type { SchoolDimensionSnapshot } from "../../education/subject-grades/page.types";

import { CatalogGradeScopeField } from "./catalog-grade-scope-field";

export type NewStandardCoreSheetProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  snapshot: SchoolDimensionSnapshot | null;
  categories: CatalogCategory[];
  coreCode: string;
  setCoreCode: (v: string) => void;
  coreName: string;
  setCoreName: (v: string) => void;
  coreStage: string;
  setCoreStage: (v: string) => void;
  coreSubject: string;
  setCoreSubject: (v: string) => void;
  coreGradeIds: string[];
  setCoreGradeIds: (v: string[]) => void;
  coreMandatory: string;
  setCoreMandatory: (v: string) => void;
  coreCat: string;
  setCoreCat: (v: string) => void;
  coreVideo: string;
  setCoreVideo: (v: string) => void;
  videoPickerOpen: boolean;
  setVideoPickerOpen: (v: boolean) => void;
  onSubmit: () => void;
};

/** 仅用于「新增」标准实验；修改请在详情抽屉中操作。 */
export function NewStandardCoreSheet(props: NewStandardCoreSheetProps) {
  const s = props.snapshot;
  return (
    <>
      <Sheet open={props.open} onOpenChange={props.onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>新增标准实验</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <Label>业务编码</Label>
              <Input value={props.coreCode} onChange={(e) => props.setCoreCode(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>实验名称</Label>
              <Input value={props.coreName} onChange={(e) => props.setCoreName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>学段</Label>
                <Select value={props.coreStage} onValueChange={props.setCoreStage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(s?.levels ?? [])
                      .filter((x) => String(x.status ?? "y").trim().toLowerCase() !== "n")
                      .map((x) => (
                        <SelectItem key={x.levelId} value={x.levelId}>
                          {x.levelName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>学科</Label>
                <Select value={props.coreSubject} onValueChange={props.setCoreSubject}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(s?.subjects ?? [])
                      .filter((x) => String(x.status ?? "y").trim().toLowerCase() !== "n")
                      .map((x) => (
                        <SelectItem key={x.subjectId} value={x.subjectId}>
                          {x.subjectName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CatalogGradeScopeField
              snapshot={s}
              stageId={props.coreStage}
              subjectId={props.coreSubject}
              value={props.coreGradeIds}
              onChange={props.setCoreGradeIds}
            />
            <div className="space-y-2">
              <Label>必做</Label>
              <RadioGroup value={props.coreMandatory} onValueChange={props.setCoreMandatory} className="flex gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <RadioGroupItem value="1" id="create-mand-1" />
                  必做
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <RadioGroupItem value="0" id="create-mand-0" />
                  选做
                </label>
              </RadioGroup>
            </div>
            <div className="space-y-1">
              <Label>实验类型</Label>
              <Select value={props.coreCat} onValueChange={props.setCoreCat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {props.categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 rounded-md border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>官方视频</Label>
                <Button type="button" size="sm" variant="secondary" onClick={() => props.setVideoPickerOpen(true)}>
                  从媒体库选择
                </Button>
              </div>
              <Input
                value={props.coreVideo}
                onChange={(e) => props.setCoreVideo(e.target.value)}
                placeholder="登记 id（可由媒体库选择回填）"
              />
              <p className="text-xs text-muted-foreground">媒体库检索接入后，将支持按标题搜索并自动回填登记 id。</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
                取消
              </Button>
              <Button type="button" onClick={() => props.onSubmit()}>
                保存
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={props.videoPickerOpen} onOpenChange={props.setVideoPickerOpen}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>选择官方视频</DialogTitle>
            <DialogDescription>媒体库检索与缩略图预览能力接入中；当前请先在媒体库复制登记 id 后粘贴到上方输入框。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => props.setVideoPickerOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
