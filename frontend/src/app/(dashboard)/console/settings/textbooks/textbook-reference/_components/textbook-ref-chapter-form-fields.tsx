"use client";

import * as React from "react";
import { Input, Label, Textarea } from "@bs-lab/ui";

export function ChapterTitleField(props: { value: string; onChange: (v: string) => void }) {
  const id = React.useId();
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>标题</Label>
      <Input id={id} value={props.value} onChange={(e) => props.onChange(e.target.value)} />
    </div>
  );
}

export function ChapterSortField(props: { value: string; onChange: (v: string) => void }) {
  const id = React.useId();
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>排序</Label>
      <Input id={id} value={props.value} onChange={(e) => props.onChange(e.target.value)} inputMode="numeric" />
    </div>
  );
}

export function ChapterDescField(props: { value: string; onChange: (v: string) => void }) {
  const id = React.useId();
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>文字说明</Label>
      <Textarea id={id} value={props.value} onChange={(e) => props.onChange(e.target.value)} rows={3} placeholder="可选" />
    </div>
  );
}

export function ChapterImageField(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const id = React.useId();
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>配图媒体登记 id</Label>
      <Input id={id} value={props.value} onChange={(e) => props.onChange(e.target.value)} placeholder={props.placeholder} />
    </div>
  );
}
