"use client";

import { Button, Input, Label } from "@bs-lab/ui";
import { Search } from "@bs-lab/ui/icons";

import type { DictOption } from "@/lib/v2/v2-dict-adapter";

type Props = {
  keywordDraft: string;
  onKeywordDraftChange: (v: string) => void;
  fileTypeId: string;
  onFileTypeIdChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  fileTypeOptions: DictOption[];
  loading: boolean;
  onSearch: () => void;
};

export function ConsoleMediaToolbar(props: Props) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-0 flex-1 space-y-1">
        <Label htmlFor="console-media-keyword">按文件名搜索</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="console-media-keyword"
            value={props.keywordDraft}
            onChange={(e) => props.onKeywordDraftChange(e.target.value)}
            placeholder="匹配 data_file.file_name …"
            className="pl-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") props.onSearch();
            }}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="console-media-file-type">文件类型</Label>
        <select
          id="console-media-file-type"
          className="border-input bg-background h-9 w-full min-w-[10rem] rounded-md border px-2 text-sm sm:w-44"
          value={props.fileTypeId}
          onChange={(e) => props.onFileTypeIdChange(e.target.value)}
        >
          <option value="">全部类型</option>
          {props.fileTypeOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="console-media-status">启用状态</Label>
        <select
          id="console-media-status"
          className="border-input bg-background h-9 w-full min-w-[8rem] rounded-md border px-2 text-sm sm:w-36"
          value={props.status}
          onChange={(e) => props.onStatusChange(e.target.value)}
        >
          <option value="">全部</option>
          <option value="y">启用（含 y / t）</option>
          <option value="t">仅 t</option>
          <option value="n">停用（n）</option>
        </select>
      </div>
      <Button type="button" variant="secondary" className="shrink-0 sm:mb-0.5" onClick={props.onSearch} disabled={props.loading}>
        {props.loading ? "加载中…" : "查询"}
      </Button>
    </div>
  );
}
